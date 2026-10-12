import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { recordAuditLog } from '../middleware/audit.js';
import { checkRequestCompleteness } from '../services/completenessService.js';

export async function submitReview(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { reviewDecision, reviewNotes, changesMade } = req.body;

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
    include: { clinicalInformation: true },
  });

  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }

  const reviewerId = req.user?.id || 'user-doctor-01';

  const review = await prisma.requestReview.create({
    data: {
      requestId: id,
      reviewerId,
      reviewDecision: reviewDecision || 'APPROVED_FOR_SUBMISSION',
      reviewNotes: reviewNotes || 'Clinical evidence reviewed and confirmed by attending physician.',
      changesMade: changesMade ? JSON.stringify(changesMade) : null,
      validationResults: JSON.stringify({ score: request.completenessScore }),
    },
    include: {
      reviewer: { select: { fullName: true, role: true } },
    },
  });

  // Mark clinical info verified
  if (request.clinicalInformation) {
    await prisma.clinicalInformation.update({
      where: { requestId: id },
      data: {
        isVerified: true,
        verifiedByUserId: reviewerId,
        verifiedAt: new Date(),
      },
    });
  }

  await recordAuditLog({
    userId: reviewerId,
    eventType: 'REQUEST_REVIEW',
    actionDetails: `Physician review submitted with decision: ${reviewDecision}.`,
    relatedRequestId: id,
    req,
  });

  res.status(201).json({
    review,
    message: 'Clinical review recorded successfully.',
  });
}

export async function markReadyForSubmission(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Run completeness check
  const evaluation = await checkRequestCompleteness(id);

  if (evaluation.missingCount > 0) {
    res.status(400).json({
      error: `Cannot mark as Ready for Submission. ${evaluation.missingCount} mandatory requirement(s) are still missing.`,
      missingRequirements: evaluation.items.filter((i) => i.status === 'MISSING'),
    });
    return;
  }

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
  });

  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  const updated = await prisma.authorizationRequest.update({
    where: { id },
    data: {
      status: 'READY_FOR_SUBMISSION',
    },
  });

  await prisma.requestStatusHistory.create({
    data: {
      requestId: id,
      fromStatus: request.status,
      toStatus: 'READY_FOR_SUBMISSION',
      changedById: req.user?.id || 'user-doctor-01',
      changeReason: 'Physician confirmed all clinical criteria and documentation are complete.',
      notes: `Completeness verified at ${evaluation.score}%. Ready for payer gateway dispatch.`,
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'STATUS_CHANGE',
    actionDetails: `Marked request ${request.requestNumber} as Ready for Submission.`,
    relatedRequestId: id,
    req,
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: req.user?.id || 'user-staff-01',
      title: 'Request Ready for Submission',
      message: `Request ${request.requestNumber} is verified and ready for payer dispatch.`,
      type: 'SUCCESS',
      relatedRequestId: id,
    },
  });

  res.json({
    request: updated,
    message: 'Request is now marked Ready for Submission.',
  });
}
