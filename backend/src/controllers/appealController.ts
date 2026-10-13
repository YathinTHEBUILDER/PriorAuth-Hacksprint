import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { recordAuditLog } from '../middleware/audit.js';
import { groqManager } from '../services/groqService.js';

export async function draftAppeal(req: Request, res: Response): Promise<void> {
  const { id: requestId } = req.params;
  const request = await prisma.authorizationRequest.findUnique({
    where: { id: requestId },
    include: {
      patient: true,
      payer: true,
      documents: { where: { category: 'DENIAL_LETTER' }, orderBy: { createdAt: 'desc' }, take: 1 },
      extractedFields: { include: { document: { select: { originalName: true } } } },
    },
  });
  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }
  if (!['DENIED', 'APPEALING'].includes(request.status)) {
    res.status(409).json({ error: 'Appeals can only be drafted for a denied authorization.' });
    return;
  }

  const denialDocument = request.documents[0];
  const denialReasonText = String(req.body?.denialReasonText || denialDocument?.extractedText || '').trim();
  if (!denialReasonText) {
    res.status(400).json({ error: 'Upload a denial letter or enter the payer’s denial reason first.' });
    return;
  }

  const reason = denialReasonText.toLowerCase();
  const terms = /(conservative|physical therapy|treatment|failed|therapy)/i.test(reason)
    ? /(treatment|therapy|failed|conservative)/i
    : /(imaging|mri|x-ray|radiology|diagnostic)/i.test(reason)
      ? /(imaging|mri|radiology|exam|findings)/i
      : /(diagnos|medical necessity|clinical|code)/i.test(reason)
        ? /(diagnos|clinical|icd|finding)/i
        : null;
  const matchedFields = terms
    ? request.extractedFields.filter((field) => terms.test(`${field.fieldName} ${field.fieldValue}`))
    : request.extractedFields.filter((field) => field.confidence >= 0.75);

  const evidence = matchedFields.map((field) => {
    const verified = field.sourceOffsetStart !== null && field.sourceOffsetEnd !== null;
    return `- ${field.fieldName}: ${field.fieldValue}${verified ? ` (Source: ${field.document.originalName}, chars ${field.sourceOffsetStart}–${field.sourceOffsetEnd}: “${field.sourceSnippet}”)` : ' (Unverified snippet; clinician review required)'}`;
  });

  const deterministicDraft = [
    `RE: Prior Authorization Denial Appeal - ${request.requestedService}`,
    `Patient: ${request.patient.firstName} ${request.patient.lastName} | MRN: ${request.patient.mrn} | DOB: ${request.patient.dateOfBirth}`,
    `Payer: ${request.payer.name} | Request Number: ${request.requestNumber}`,
    `Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    `Dear Appeals Coordinator / Medical Director,`,
    '',
    `This letter serves as a formal appeal of the recent denial for ${request.requestedService} regarding the patient referenced above.`,
    '',
    `DENIAL REASON CITED:`,
    `"${denialReasonText}"`,
    '',
    `CLINICAL REBUTTAL & SUPPORTING DOCUMENTED EVIDENCE:`,
    ...(evidence.length ? evidence : ['- No matching extracted evidence found in current documents. Supporting chart notes required.']),
    '',
    `Based on the documented clinical history, conservative management, and objective examination findings above, this requested service meets all recognized clinical guidelines for medical necessity. We respectfully request that the denial be overturned immediately.`,
    '',
    `Respectfully submitted,`,
    `Clinical Care & Prior Authorization Team`,
    '',
    `[DISCLAIMER: Please review this draft against the patient chart, verify all citations, and append physician signature before submission.]`,
  ].join('\n');

  let draftText = deterministicDraft;

  // Enhance appeal using Groq LLM Failover Pool
  try {
    const prompt = `You are an expert healthcare appeal coordinator and medical director specialized in overcoming prior authorization denials.
Draft a highly persuasive, clinically rigorous, professional Prior Authorization Appeal Letter based on the following case data:

Patient: ${request.patient.firstName} ${request.patient.lastName} (DOB: ${request.patient.dateOfBirth}, MRN: ${request.patient.mrn})
Payer: ${request.payer.name}
Prior Authorization Request #: ${request.requestNumber}
Requested Service: ${request.requestedService}
Payer Denial Reason: "${denialReasonText}"

Available Documented Chart Evidence & Verified Snippets:
${evidence.length > 0 ? evidence.join('\n') : 'No extracted snippets available. Argue based on general medical necessity standards for this condition.'}

REQUIREMENTS:
1. Address the letter to the Medical Review Department at ${request.payer.name}.
2. Explicitly cite the denial reason and systematically refute it using clinical guidelines and the documented chart evidence.
3. Incorporate the cited evidence items, including verbatim source document references and findings.
4. Conclude with an urgent request to overturn the denial or offer a peer-to-peer discussion.
5. Include a standard clinician review disclaimer at the very end.
Format cleanly as a ready-to-sign medical letter with clear headings.`;

    const aiGeneratedAppeal = await groqManager.chatCompletion([
      {
        role: 'system',
        content: 'You are an expert physician appeal specialist. Draft compelling, grammatically flawless, authoritative medical necessity appeal letters that directly rebut health plan denials.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], false, 0.3);

    if (aiGeneratedAppeal && aiGeneratedAppeal.trim().length > 100) {
      draftText = aiGeneratedAppeal.trim();
    }
  } catch (aiErr) {
    console.warn('⚠️ [Groq AI] Appeal generation fell back to deterministic template:', aiErr);
  }

  const appeal = await prisma.appeal.create({
    data: {
      requestId,
      denialDocumentId: denialDocument?.id,
      denialReasonText,
      matchedFields: JSON.stringify(matchedFields.map((field) => field.id)),
      draftText,
      createdById: req.user!.id,
      status: 'READY',
    },
  });
  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'APPEAL_DRAFTED',
    actionDetails: `Created an appeal draft for ${request.requestNumber} with ${matchedFields.length} cited evidence item(s).`,
    relatedRequestId: requestId,
    req,
  });
  res.status(201).json({ appeal, evidenceCount: matchedFields.length });
}

export async function submitAppeal(req: Request, res: Response): Promise<void> {
  const { id: requestId } = req.params;
  const appealId = String(req.body?.appealId || '');
  const draftText = String(req.body?.draftText || '').trim();
  const appeal = await prisma.appeal.findFirst({ where: { id: appealId, requestId } });
  if (!appeal) {
    res.status(404).json({ error: 'Appeal draft not found for this request' });
    return;
  }
  const request = await prisma.authorizationRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }

  const [updatedAppeal] = await prisma.$transaction([
    prisma.appeal.update({ where: { id: appealId }, data: { status: 'SENT', ...(draftText ? { draftText } : {}) } }),
    prisma.authorizationRequest.update({ where: { id: requestId }, data: { status: 'APPEALING' } }),
    prisma.requestStatusHistory.create({
      data: {
        requestId,
        fromStatus: request.status,
        toStatus: 'APPEALING',
        changedById: req.user!.id,
        changeReason: 'Appeal marked submitted by staff',
        notes: 'Recorded in the prototype; no payer transmission is connected.',
      },
    }),
  ]);
  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'APPEAL_MARKED_SUBMITTED',
    actionDetails: `Marked appeal ${appealId} for ${request.requestNumber} as submitted in the prototype.`,
    relatedRequestId: requestId,
    req,
  });
  res.json({ appeal: updatedAppeal, isSimulated: true, message: 'Appeal status recorded. No payer transmission occurred.' });
}
