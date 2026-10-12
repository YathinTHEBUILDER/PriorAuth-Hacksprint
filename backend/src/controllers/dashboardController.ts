import { Request, Response } from 'express';
import prisma from '../prisma.js';

export async function getDashboardSummary(req: Request, res: Response): Promise<void> {
  const [
    totalRequests,
    draftRequests,
    missingInfoRequests,
    readyForReviewRequests,
    submittedRequests,
    approvedRequests,
    deniedRequests,
    pendingRequests,
    allRequests,
  ] = await Promise.all([
    prisma.authorizationRequest.count(),
    prisma.authorizationRequest.count({ where: { status: 'DRAFT' } }),
    prisma.authorizationRequest.count({ where: { status: 'MISSING_INFORMATION' } }),
    prisma.authorizationRequest.count({ where: { status: 'READY_FOR_REVIEW' } }),
    prisma.authorizationRequest.count({ where: { status: 'SUBMITTED' } }),
    prisma.authorizationRequest.count({ where: { status: 'APPROVED' } }),
    prisma.authorizationRequest.count({ where: { status: 'DENIED' } }),
    prisma.authorizationRequest.count({ where: { status: 'PENDING' } }),
    prisma.authorizationRequest.findMany({
      select: { completenessScore: true, createdAt: true },
    }),
  ]);

  const avgCompleteness = allRequests.length > 0
    ? Math.round(allRequests.reduce((acc, r) => acc + r.completenessScore, 0) / allRequests.length)
    : 0;

  // Pipeline stages count
  const pipeline = [
    { stage: 'Draft & Intake', count: draftRequests, key: 'DRAFT' },
    { stage: 'Document Processing', count: await prisma.authorizationRequest.count({ where: { status: 'PROCESSING_DOCUMENTS' } }), key: 'PROCESSING_DOCUMENTS' },
    { stage: 'Missing Info', count: missingInfoRequests, key: 'MISSING_INFORMATION' },
    { stage: 'Clinical Review', count: readyForReviewRequests, key: 'READY_FOR_REVIEW' },
    { stage: 'Ready to Submit', count: await prisma.authorizationRequest.count({ where: { status: 'READY_FOR_SUBMISSION' } }), key: 'READY_FOR_SUBMISSION' },
    { stage: 'Submitted & Pending', count: submittedRequests + pendingRequests, key: 'SUBMITTED' },
    { stage: 'Payer Approved', count: approvedRequests, key: 'APPROVED' },
    { stage: 'Denied / Info Req', count: deniedRequests + await prisma.authorizationRequest.count({ where: { status: 'ADDITIONAL_INFO_REQUESTED' } }), key: 'DENIED' },
  ];

  // Recent 5 requests
  const recentRequests = await prisma.authorizationRequest.findMany({
    take: 6,
    orderBy: { updatedAt: 'desc' },
    include: {
      patient: {
        select: { id: true, mrn: true, firstName: true, lastName: true },
      },
      payer: {
        select: { id: true, name: true, code: true },
      },
      assignedDoctor: {
        select: { id: true, fullName: true },
      },
    },
  });

  res.json({
    metrics: {
      totalRequests,
      draftRequests,
      missingInfoRequests,
      readyForReviewRequests,
      submittedRequests,
      approvedRequests,
      deniedRequests,
      pendingRequests,
      avgPreparationHours: 4.2, // Demonstrative estimated average savings
      avgCompletenessScore: avgCompleteness,
    },
    pipeline,
    recentRequests: recentRequests.map((r) => ({
      id: r.id,
      requestNumber: r.requestNumber,
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      patientMrn: r.patient.mrn,
      payerName: r.payer.name,
      payerCode: r.payer.code,
      serviceType: r.serviceType,
      requestedService: r.requestedService,
      status: r.status,
      completenessScore: r.completenessScore,
      priority: r.priority,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
}

export async function getDashboardActivity(req: Request, res: Response): Promise<void> {
  const [recentStatusHistories, recentAuditLogs] = await Promise.all([
    prisma.requestStatusHistory.findMany({
      take: 8,
      orderBy: { timestamp: 'desc' },
      include: {
        request: { select: { requestNumber: true } },
        changedBy: { select: { fullName: true, role: true } },
      },
    }),
    prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, role: true } },
      },
    }),
  ]);

  const activities = [
    ...recentStatusHistories.map((h) => ({
      id: h.id,
      type: 'STATUS_CHANGE',
      title: `Status updated to ${h.toStatus.replace(/_/g, ' ')}`,
      detail: `Request ${h.request.requestNumber} transitioned: ${h.notes || h.changeReason || ''}`,
      user: h.changedBy.fullName,
      timestamp: h.timestamp.toISOString(),
    })),
    ...recentAuditLogs.map((a) => ({
      id: a.id,
      type: a.eventType,
      title: a.eventType.replace(/_/g, ' '),
      detail: a.actionDetails,
      user: a.user?.fullName || 'System',
      timestamp: a.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  res.json({ activities });
}
