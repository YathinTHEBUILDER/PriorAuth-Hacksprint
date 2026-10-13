import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { recordAuditLog } from '../middleware/audit.js';

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
    return `- ${field.fieldName}: ${field.fieldValue}${verified ? ` (Source: ${field.document.originalName}, characters ${field.sourceOffsetStart}–${field.sourceOffsetEnd}: “${field.sourceSnippet}”)` : ' (Source quote could not be verified; clinician review required.)'}`;
  });
  const draftText = [
    `RE: Appeal of prior authorization denial for ${request.patient.firstName} ${request.patient.lastName}`,
    `Payer: ${request.payer.name} | Request: ${request.requestNumber}`,
    '',
    `Denial reason supplied: ${denialReasonText}`,
    '',
    'Clinical evidence for clinician review:',
    ...(evidence.length ? evidence : ['- No matching extracted evidence was found. Add supporting chart documentation before submitting.']),
    '',
    'Please review this draft against the patient chart, correct any inaccuracies, and add any required clinical context before sending. This draft is not a clinical determination or a transmission to the payer.',
  ].join('\n');

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
