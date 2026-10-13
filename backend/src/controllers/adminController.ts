import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma.js';
import { recordAuditLog } from '../middleware/audit.js';
import { groqManager } from '../services/groqService.js';

const adminCreateUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  organization: z.string().min(2),
  role: z.enum(['ADMINISTRATOR', 'DOCTOR', 'STAFF']),
});

export async function getUsers(req: Request, res: Response): Promise<void> {
  const search = req.query.search as string;

  const where = search
    ? {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
          { organization: { contains: search } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organization: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          createdRequests: true,
          reviews: true,
        },
      },
    },
  });

  res.json({ users });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const result = adminCreateUserSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const { fullName, email, password, organization, role } = result.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    res.status(400).json({ error: 'User with this email already exists.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      organization,
      role,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organization: true,
      isActive: true,
      createdAt: true,
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'ADMIN_CREATE_USER',
    actionDetails: `Admin created user account for ${user.fullName} (${user.role}).`,
    req,
  });

  res.status(201).json({ user });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { fullName, organization, role, isActive } = req.body;

  const dataToUpdate: any = {};
  if (fullName !== undefined) dataToUpdate.fullName = fullName;
  if (organization !== undefined) dataToUpdate.organization = organization;
  if (role !== undefined) dataToUpdate.role = role;
  if (isActive !== undefined) dataToUpdate.isActive = isActive;

  const updated = await prisma.user.update({
    where: { id },
    data: dataToUpdate,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organization: true,
      isActive: true,
      updatedAt: true,
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'ADMIN_UPDATE_USER',
    actionDetails: `Admin updated account for ${updated.fullName} (Active: ${updated.isActive}, Role: ${updated.role}).`,
    req,
  });

  res.json({ user: updated });
}

export async function getPayerConfigurations(req: Request, res: Response): Promise<void> {
  const profiles = await prisma.payerRequirementProfile.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      payer: true,
      requirements: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  res.json({ profiles });
}

export async function createPayerConfiguration(req: Request, res: Response): Promise<void> {
  const { payerId, serviceCategory, version, description, requirements } = req.body;

  if (!payerId || !serviceCategory || !description) {
    res.status(400).json({ error: 'Payer, service category, and description are required.' });
    return;
  }

  const profile = await prisma.payerRequirementProfile.create({
    data: {
      payerId,
      serviceCategory,
      version: version || '1.0',
      description,
      isActive: true,
      requirements: requirements && Array.isArray(requirements)
        ? {
            create: requirements.map((r: any, idx: number) => ({
              code: r.code || `REQ-${Date.now()}-${idx}`,
              name: r.name,
              description: r.description,
              isRequired: r.isRequired !== undefined ? r.isRequired : true,
              applicabilityRule: r.applicabilityRule || 'ALL',
              acceptedDocTypes: r.acceptedDocTypes || 'CLINICAL_NOTES',
              validationInstruction: r.validationInstruction || '',
              sortOrder: idx + 1,
            })),
          }
        : undefined,
    },
    include: {
      payer: true,
      requirements: true,
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'CONFIG_CREATE',
    actionDetails: `Created payer requirement profile: ${profile.description} for ${profile.payer.name}.`,
    req,
  });

  res.status(201).json({ profile });
}

export async function updatePayerConfiguration(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { isActive, description, version } = req.body;

  const updated = await prisma.payerRequirementProfile.update({
    where: { id },
    data: {
      isActive: isActive !== undefined ? isActive : undefined,
      description: description || undefined,
      version: version || undefined,
    },
    include: {
      payer: true,
      requirements: true,
    },
  });

  await recordAuditLog({
    userId: req.user?.id,
    eventType: 'CONFIG_UPDATE',
    actionDetails: `Updated requirement profile ${updated.id} (Active: ${updated.isActive}).`,
    req,
  });

  res.json({ profile: updated });
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { eventType, search } = req.query as Record<string, string>;

  const where: any = {};
  if (eventType && eventType !== 'ALL') {
    where.eventType = eventType;
  }
  if (search) {
    where.OR = [
      { actionDetails: { contains: search } },
      { ipAddress: { contains: search } },
      { user: { fullName: { contains: search } } },
    ];
  }

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: {
        select: { id: true, fullName: true, role: true, email: true },
      },
      request: {
        select: { id: true, requestNumber: true },
      },
    },
  });

  res.json({ logs });
}

export async function getAIEngineStatus(_req: Request, res: Response): Promise<void> {
  const status = groqManager.getPoolStatus();
  res.json({ aiEngine: status });
}
