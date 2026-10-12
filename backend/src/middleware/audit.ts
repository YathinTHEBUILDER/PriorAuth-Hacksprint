import { Request } from 'express';
import prisma from '../prisma.js';

export async function recordAuditLog(params: {
  userId?: string;
  eventType: string;
  actionDetails: string;
  relatedRequestId?: string;
  req?: Request;
}) {
  try {
    const ip = params.req?.ip || params.req?.socket?.remoteAddress || '127.0.0.1';
    const userAgent = params.req?.headers['user-agent'] || 'System';

    await prisma.auditLog.create({
      data: {
        userId: params.userId || (params.req?.user?.id ?? null),
        eventType: params.eventType,
        actionDetails: params.actionDetails,
        ipAddress: typeof ip === 'string' ? ip.replace('::ffff:', '') : '127.0.0.1',
        userAgent: typeof userAgent === 'string' ? userAgent.substring(0, 200) : 'Unknown',
        relatedRequestId: params.relatedRequestId || null,
      },
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
