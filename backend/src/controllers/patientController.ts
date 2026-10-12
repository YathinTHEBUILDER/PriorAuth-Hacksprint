import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';

const patientSchema = z.object({
  mrn: z.string().min(3, 'MRN is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(8, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string().min(7, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  insurancePayerId: z.string().min(1, 'Insurance payer is required'),
  insuranceMemberId: z.string().min(2, 'Member ID is required'),
  insuranceGroupNumber: z.string().optional(),
});

export async function getPatients(req: Request, res: Response): Promise<void> {
  const search = req.query.search as string;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { mrn: { contains: search } },
          { insuranceMemberId: { contains: search } },
        ],
      }
    : {};

  const patients = await prisma.patient.findMany({
    where,
    orderBy: { lastName: 'asc' },
    include: {
      payer: { select: { id: true, name: true, code: true } },
    },
  });

  res.json({ patients });
}

export async function getPatientById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      payer: true,
      requests: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) {
    res.status(404).json({ error: 'Patient not found' });
    return;
  }

  res.json({ patient });
}

export async function createPatient(req: Request, res: Response): Promise<void> {
  const result = patientSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const existing = await prisma.patient.findUnique({
    where: { mrn: result.data.mrn },
  });

  if (existing) {
    res.status(400).json({ error: 'A patient with this MRN already exists.' });
    return;
  }

  const patient = await prisma.patient.create({
    data: {
      ...result.data,
      email: result.data.email || null,
      insuranceGroupNumber: result.data.insuranceGroupNumber || null,
    },
    include: { payer: true },
  });

  res.status(201).json({ patient });
}

export async function updatePatient(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const patient = await prisma.patient.update({
    where: { id },
    data: req.body,
    include: { payer: true },
  });

  res.json({ patient });
}
