import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { recordAuditLog } from '../middleware/audit.js';

export async function requestMissingInformation(req: Request, res: Response): Promise<void> {
  const { id: requestId } = req.params;
  const fieldName = String(req.body?.fieldName || '').trim();
  const reason = String(req.body?.reason || '').trim();
  if (!fieldName) {
    res.status(400).json({ error: 'Missing information field is required.' });
    return;
  }
  const authorizationRequest = await prisma.authorizationRequest.findUnique({
    where: { id: requestId },
    include: { patient: true, assignedDoctor: true },
  });
  if (!authorizationRequest) {
    res.status(404).json({ error: 'Authorization request not found.' });
    return;
  }
  const recipientId = authorizationRequest.assignedDoctorId || req.user!.id;
  await prisma.notification.create({
    data: {
      userId: recipientId,
      title: `Clinical information requested: ${fieldName}`,
      message: `${req.user!.fullName} requested ${fieldName} for ${authorizationRequest.patient.firstName} ${authorizationRequest.patient.lastName} (${authorizationRequest.requestNumber}). ${reason}`,
      type: 'WARNING',
      relatedRequestId: requestId,
    },
  });
  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'MISSING_INFO_REQUESTED',
    actionDetails: `Requested ${fieldName} from ${authorizationRequest.assignedDoctor?.fullName || 'the assigned clinical team'} for ${authorizationRequest.requestNumber}.`,
    relatedRequestId: requestId,
    req,
  });
  res.status(201).json({ message: 'Follow-up request logged and clinician notified.' });
}
