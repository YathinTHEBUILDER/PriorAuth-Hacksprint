import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { checkRequestCompleteness } from '../services/completenessService.js';
import { recordAuditLog } from '../middleware/audit.js';

export async function getCompleteness(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const evaluation = await checkRequestCompleteness(id);
  res.json({ completeness: evaluation });
}

export async function triggerCompletenessCheck(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const evaluation = await checkRequestCompleteness(id);

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'COMPLETENESS_CHECK',
    actionDetails: `Recalculated completeness for request: ${evaluation.score}% (${evaluation.completedCount}/${evaluation.totalApplicable} requirements met).`,
    relatedRequestId: id,
    req,
  });

  res.json({
    completeness: evaluation,
    message: 'Completeness check recalculated.',
  });
}

export async function updateClinicalInformation(req: Request, res: Response): Promise<void> {
  const { id: requestId } = req.params;
  const data = req.body;

  const dataToUpdate: any = {};
  if (data.diagnosis !== undefined) dataToUpdate.diagnosis = data.diagnosis;
  if (data.diagnosisCodes !== undefined) {
    dataToUpdate.diagnosisCodes = Array.isArray(data.diagnosisCodes)
      ? JSON.stringify(data.diagnosisCodes)
      : data.diagnosisCodes;
  }
  if (data.symptoms !== undefined) {
    dataToUpdate.symptoms = Array.isArray(data.symptoms)
      ? JSON.stringify(data.symptoms)
      : data.symptoms;
  }
  if (data.clinicalFindings !== undefined) dataToUpdate.clinicalFindings = data.clinicalFindings;
  if (data.previousTreatments !== undefined) {
    dataToUpdate.previousTreatments = Array.isArray(data.previousTreatments)
      ? JSON.stringify(data.previousTreatments)
      : data.previousTreatments;
  }
  if (data.contraindications !== undefined) {
    dataToUpdate.contraindications = Array.isArray(data.contraindications)
      ? JSON.stringify(data.contraindications)
      : data.contraindications;
  }
  if (data.proposedTreatmentPlan !== undefined) dataToUpdate.proposedTreatmentPlan = data.proposedTreatmentPlan;
  if (data.orderingPhysicianName !== undefined) dataToUpdate.orderingPhysicianName = data.orderingPhysicianName;
  if (data.orderingPhysicianNpi !== undefined) dataToUpdate.orderingPhysicianNpi = data.orderingPhysicianNpi;
  if (data.isVerified !== undefined) {
    dataToUpdate.isVerified = data.isVerified;
    if (data.isVerified) {
      dataToUpdate.verifiedByUserId = req.user?.id || 'user-doctor-01';
      dataToUpdate.verifiedAt = new Date();
    }
  }

  const clinical = await prisma.clinicalInformation.upsert({
    where: { requestId },
    update: dataToUpdate,
    create: {
      requestId,
      diagnosis: data.diagnosis || '',
      diagnosisCodes: JSON.stringify(data.diagnosisCodes || []),
      symptoms: JSON.stringify(data.symptoms || []),
      clinicalFindings: data.clinicalFindings || '',
      previousTreatments: JSON.stringify(data.previousTreatments || []),
      contraindications: JSON.stringify(data.contraindications || []),
      proposedTreatmentPlan: data.proposedTreatmentPlan || '',
      orderingPhysicianName: data.orderingPhysicianName || '',
      orderingPhysicianNpi: data.orderingPhysicianNpi || '',
      documentDates: JSON.stringify([]),
      isVerified: !!data.isVerified,
    },
  });

  // Recheck completeness after clinical information update
  const evaluation = await checkRequestCompleteness(requestId);

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'CLINICAL_INFO_UPDATE',
    actionDetails: `Updated and saved clinical information fields for request (Verified: ${clinical.isVerified}).`,
    relatedRequestId: requestId,
    req,
  });

  res.json({
    clinicalInformation: clinical,
    completeness: evaluation,
    message: 'Clinical information saved successfully.',
  });
}

export async function updateExtractedField(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { verifiedValue, isVerified } = req.body;

  const field = await prisma.extractedField.update({
    where: { id },
    data: {
      verifiedValue: verifiedValue || undefined,
      isVerified: isVerified !== undefined ? isVerified : true,
      verifiedByUserId: req.user?.id || 'user-doctor-01',
    },
  });

  // Recalculate completeness
  await checkRequestCompleteness(field.requestId);

  res.json({
    field,
    message: 'Field updated and marked as verified.',
  });
}
