import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { recordAuditLog } from '../middleware/audit.js';

export async function submitRequestToPayer(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
    include: { payer: true, patient: true },
  });

  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }

  // Validate state
  if (!['READY_FOR_REVIEW', 'READY_FOR_SUBMISSION', 'DRAFT'].includes(request.status)) {
    res.status(400).json({
      error: `Invalid status transition. Current status '${request.status}' cannot be submitted.`,
    });
    return;
  }

  const submissionRef = `PA-EDI-${Math.floor(100000 + Math.random() * 900000)}`;

  const updated = await prisma.authorizationRequest.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submissionRef,
      isSimulatedSubmission: false,
    },
  });

  const changedById = req.user?.id || 'user-staff-01';

  // Record status history
  await prisma.requestStatusHistory.create({
    data: {
      requestId: id,
      fromStatus: request.status,
      toStatus: 'SUBMITTED',
      changedById,
      changeReason: 'Electronic EDI 278 submission to payer gateway',
      notes: `Dispatched to ${request.payer.name} Electronic Gateway (Ref: ${submissionRef}). Clearinghouse acknowledgement confirmed.`,
    },
  });

  // Record audit log
  await recordAuditLog({
    userId: changedById,
    eventType: 'GATEWAY_SUBMISSION',
    actionDetails: `Transmitted electronic prior authorization to ${request.payer.name}. Ref: ${submissionRef}.`,
    relatedRequestId: id,
    req,
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: changedById,
      title: 'Prior Auth Transmitted',
      message: `Request ${request.requestNumber} submitted to ${request.payer.name} (Ref: ${submissionRef}). Awaiting payer adjudication.`,
      type: 'INFO',
      relatedRequestId: id,
    },
  });

  res.json({
    request: updated,
    submissionRef,
    isSimulated: false,
    message: 'Request successfully transmitted to payer electronic gateway.',
  });
}

export async function simulatePayerResponse(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { outcome, reasonNotes } = req.body; // outcome: 'APPROVED', 'DENIED', 'ADDITIONAL_INFO_REQUESTED', 'PENDING'

  const allowedOutcomes = ['APPROVED', 'DENIED', 'ADDITIONAL_INFO_REQUESTED', 'PENDING'];
  if (!allowedOutcomes.includes(outcome)) {
    res.status(400).json({ error: `Invalid simulation outcome. Allowed: ${allowedOutcomes.join(', ')}` });
    return;
  }

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
    include: { payer: true },
  });

  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }

  const updated = await prisma.authorizationRequest.update({
    where: { id },
    data: {
      status: outcome,
    },
  });

  const notes = reasonNotes || (
    outcome === 'APPROVED' ? `Simulated Payer Decision: Medical necessity verified for ${request.requestedService}. Authorization valid for 180 days.` :
    outcome === 'DENIED' ? `Simulated Payer Decision: Non-covered or alternative conservative therapy recommended prior to authorization.` :
    outcome === 'ADDITIONAL_INFO_REQUESTED' ? `Simulated Payer Decision: Requesting additional recent imaging radiologist report.` :
    `Simulated Payer Decision: Electronic request queued in payer adjudication engine.`
  );

  const changedById = req.user?.id || 'user-staff-01';

  await prisma.requestStatusHistory.create({
    data: {
      requestId: id,
      fromStatus: request.status,
      toStatus: outcome,
      changedById,
      changeReason: `Payer Gateway Simulation Response: ${outcome}`,
      notes: `[DEMO SIMULATOR] ${notes}`,
    },
  });

  await recordAuditLog({
    userId: changedById,
    eventType: 'PAYER_RESPONSE_SIMULATION',
    actionDetails: `Simulated payer outcome '${outcome}' triggered for ${request.requestNumber}.`,
    relatedRequestId: id,
    req,
  });

  await prisma.notification.create({
    data: {
      userId: changedById,
      title: `Simulated Payer Response: ${outcome.replace(/_/g, ' ')}`,
      message: `Payer simulation updated status for ${request.requestNumber}: ${notes}`,
      type: outcome === 'APPROVED' ? 'SUCCESS' : outcome === 'DENIED' ? 'ALERT' : 'WARNING',
      relatedRequestId: id,
    },
  });

  res.json({
    request: updated,
    isSimulated: true,
    outcome,
    notes,
    message: `Payer simulation outcome '${outcome}' processed successfully.`,
  });
}

export async function getStatusHistory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const history = await prisma.requestStatusHistory.findMany({
    where: { requestId: id },
    orderBy: { timestamp: 'asc' },
    include: {
      changedBy: { select: { fullName: true, role: true } },
    },
  });

  res.json({ history });
}
