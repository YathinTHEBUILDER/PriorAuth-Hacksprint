import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { recordAuditLog } from '../middleware/audit.js';
import { checkRequestCompleteness } from '../services/completenessService.js';

const createRequestSchema = z.object({
  patientId: z.string().min(1, 'Patient selection is required'),
  payerId: z.string().min(1, 'Payer selection is required'),
  serviceType: z.string().min(1, 'Service category is required'),
  requestedService: z.string().min(2, 'Requested service description is required'),
  cptCodes: z.array(z.string()).default([]),
  icd10Codes: z.array(z.string()).default([]),
  priority: z.enum(['STANDARD', 'URGENT', 'EXPEDITED']).default('STANDARD'),
  assignedDoctorId: z.string().optional(),
  notes: z.string().optional(),
  requestedStartDate: z.string().optional(),
  requestedEndDate: z.string().optional(),
});

export async function getRequests(req: Request, res: Response): Promise<void> {
  const { status, payerId, serviceType, search, priority } = req.query as Record<string, string>;

  const where: any = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }
  if (payerId && payerId !== 'ALL') {
    where.payerId = payerId;
  }
  if (serviceType && serviceType !== 'ALL') {
    where.serviceType = serviceType;
  }
  if (priority && priority !== 'ALL') {
    where.priority = priority;
  }

  if (search) {
    where.OR = [
      { requestNumber: { contains: search } },
      { requestedService: { contains: search } },
      { patient: { firstName: { contains: search } } },
      { patient: { lastName: { contains: search } } },
      { patient: { mrn: { contains: search } } },
    ];
  }

  const requests = await prisma.authorizationRequest.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      patient: true,
      payer: true,
      creator: { select: { id: true, fullName: true, role: true } },
      assignedDoctor: { select: { id: true, fullName: true } },
      _count: { select: { documents: true } },
    },
  });

  res.json({
    requests: requests.map((r) => ({
      ...r,
      cptCodes: (() => { try { return JSON.parse(r.cptCodes); } catch { return []; } })(),
      icd10Codes: (() => { try { return JSON.parse(r.icd10Codes); } catch { return []; } })(),
      documentsCount: r._count.documents,
    })),
  });
}

export async function getRequestById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
    include: {
      patient: {
        include: { payer: true },
      },
      payer: true,
      creator: { select: { id: true, fullName: true, role: true } },
      assignedDoctor: { select: { id: true, fullName: true } },
      clinicalInformation: true,
      documents: {
        orderBy: { createdAt: 'desc' },
        include: {
          extractedFields: true,
        },
      },
      extractedFields: true,
      requirementResults: {
        include: {
          requirement: true,
          sourceDocument: true,
        },
        orderBy: { requirement: { sortOrder: 'asc' } },
      },
      reviews: {
        orderBy: { reviewedAt: 'desc' },
        include: {
          reviewer: { select: { id: true, fullName: true, role: true } },
        },
      },
      statusHistory: {
        orderBy: { timestamp: 'desc' },
        include: {
          changedBy: { select: { id: true, fullName: true, role: true } },
        },
      },
    },
  });

  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }

  // Parse JSON fields safely
  const formattedClinical = request.clinicalInformation
    ? {
        ...request.clinicalInformation,
        diagnosisCodes: (() => { try { return JSON.parse(request.clinicalInformation.diagnosisCodes); } catch { return []; } })(),
        symptoms: (() => { try { return JSON.parse(request.clinicalInformation.symptoms); } catch { return []; } })(),
        previousTreatments: (() => { try { return JSON.parse(request.clinicalInformation.previousTreatments); } catch { return []; } })(),
        contraindications: (() => { try { return JSON.parse(request.clinicalInformation.contraindications); } catch { return []; } })(),
        documentDates: (() => { try { return JSON.parse(request.clinicalInformation.documentDates); } catch { return []; } })(),
      }
    : null;

  res.json({
    request: {
      ...request,
      cptCodes: (() => { try { return JSON.parse(request.cptCodes); } catch { return []; } })(),
      icd10Codes: (() => { try { return JSON.parse(request.icd10Codes); } catch { return []; } })(),
      clinicalInformation: formattedClinical,
    },
  });
}

export async function createRequest(req: Request, res: Response): Promise<void> {
  const result = createRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const count = await prisma.authorizationRequest.count();
  const requestNumber = `PA-2026-${String(count + 101).padStart(5, '0')}`;

  const createdById = req.user?.id || 'user-staff-01';

  const newRequest = await prisma.authorizationRequest.create({
    data: {
      requestNumber,
      patientId: result.data.patientId,
      payerId: result.data.payerId,
      serviceType: result.data.serviceType,
      requestedService: result.data.requestedService,
      cptCodes: JSON.stringify(result.data.cptCodes || []),
      icd10Codes: JSON.stringify(result.data.icd10Codes || []),
      priority: result.data.priority,
      status: 'DRAFT',
      notes: result.data.notes || '',
      requestedStartDate: result.data.requestedStartDate || null,
      requestedEndDate: result.data.requestedEndDate || null,
      createdById,
      assignedDoctorId: result.data.assignedDoctorId || null,
    },
    include: {
      patient: true,
      payer: true,
    },
  });

  // Create empty initial clinical information record
  await prisma.clinicalInformation.create({
    data: {
      requestId: newRequest.id,
      diagnosis: '',
      diagnosisCodes: JSON.stringify(result.data.icd10Codes || []),
      symptoms: JSON.stringify([]),
      clinicalFindings: '',
      previousTreatments: JSON.stringify([]),
      contraindications: JSON.stringify([]),
      proposedTreatmentPlan: result.data.requestedService,
      orderingPhysicianName: '',
      orderingPhysicianNpi: '',
      documentDates: JSON.stringify([]),
      isVerified: false,
    },
  });

  // Record initial status history
  await prisma.requestStatusHistory.create({
    data: {
      requestId: newRequest.id,
      fromStatus: null,
      toStatus: 'DRAFT',
      changedById: createdById,
      changeReason: 'New authorization request initiated',
      notes: `Initiated for ${newRequest.patient.firstName} ${newRequest.patient.lastName} (${newRequest.requestedService})`,
    },
  });

  // Record audit log
  await recordAuditLog({
    userId: createdById,
    eventType: 'REQUEST_CREATE',
    actionDetails: `Created authorization request ${requestNumber} for patient ${newRequest.patient.firstName} ${newRequest.patient.lastName}.`,
    relatedRequestId: newRequest.id,
    req,
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: createdById,
      title: 'New Authorization Request Created',
      message: `Request ${requestNumber} for ${newRequest.patient.firstName} ${newRequest.patient.lastName} was created in Draft status.`,
      type: 'INFO',
      relatedRequestId: newRequest.id,
    },
  });

  // Trigger initial completeness check to link requirements
  await checkRequestCompleteness(newRequest.id);

  res.status(201).json({ request: newRequest });
}

export async function updateRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const dataToUpdate: any = { ...req.body };
  if (dataToUpdate.cptCodes && Array.isArray(dataToUpdate.cptCodes)) {
    dataToUpdate.cptCodes = JSON.stringify(dataToUpdate.cptCodes);
  }
  if (dataToUpdate.icd10Codes && Array.isArray(dataToUpdate.icd10Codes)) {
    dataToUpdate.icd10Codes = JSON.stringify(dataToUpdate.icd10Codes);
  }

  const updated = await prisma.authorizationRequest.update({
    where: { id },
    data: dataToUpdate,
    include: {
      patient: true,
      payer: true,
    },
  });

  // Recalculate completeness
  await checkRequestCompleteness(id);

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'REQUEST_UPDATE',
    actionDetails: `Updated details for request ${updated.requestNumber}.`,
    relatedRequestId: id,
    req,
  });

  res.json({ request: updated });
}

export async function deleteRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
  });

  if (!request) {
    res.status(404).json({ error: 'Request not found' });
    return;
  }

  await prisma.authorizationRequest.delete({
    where: { id },
  });

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'REQUEST_DELETE',
    actionDetails: `Deleted request ${request.requestNumber}.`,
    req,
  });

  res.json({ message: 'Request deleted successfully' });
}

export async function getPayers(req: Request, res: Response): Promise<void> {
  const payers = await prisma.payer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    include: {
      profiles: {
        include: {
          requirements: true,
        },
      },
    },
  });

  res.json({ payers });
}
