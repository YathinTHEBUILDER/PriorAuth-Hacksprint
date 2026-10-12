import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { generatePriorAuthPDF } from '../services/pdfService.js';
import { recordAuditLog } from '../middleware/audit.js';

export async function generateDraft(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
    include: {
      patient: true,
      payer: true,
      clinicalInformation: true,
      documents: true,
    },
  });

  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'DRAFT_GENERATION',
    actionDetails: `Generated prior authorization draft package for ${request.requestNumber}.`,
    relatedRequestId: id,
    req,
  });

  res.json({
    message: 'Prior authorization draft compiled successfully.',
    draft: {
      requestId: request.id,
      requestNumber: request.requestNumber,
      service: request.requestedService,
      status: request.status,
      completenessScore: request.completenessScore,
      generatedAt: new Date().toISOString(),
    },
  });
}

export async function getPreview(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const request = await prisma.authorizationRequest.findUnique({
    where: { id },
    include: {
      patient: true,
      payer: true,
      clinicalInformation: true,
      documents: true,
      requirementResults: {
        include: { requirement: true },
      },
    },
  });

  if (!request) {
    res.status(404).json({ error: 'Authorization request not found' });
    return;
  }

  res.json({ preview: request });
}

export async function downloadPDF(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const request = await prisma.authorizationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      res.status(404).json({ error: 'Authorization request not found' });
      return;
    }

    const pdfBuffer = await generatePriorAuthPDF(id);

    await recordAuditLog({
      userId: req.user?.id,
      eventType: 'PDF_DOWNLOAD',
      actionDetails: `Downloaded Prior Auth packet PDF for request ${request.requestNumber}.`,
      relatedRequestId: id,
      req,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${request.requestNumber}-Prior-Auth-Packet.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF document.' });
  }
}
