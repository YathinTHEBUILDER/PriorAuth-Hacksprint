import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma.js';
import { generateToken } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organization: z.string().min(2, 'Organization name is required'),
  role: z.enum(['DOCTOR', 'STAFF']).default('STAFF'), // Public registration cannot claim ADMIN
});

export async function login(req: Request, res: Response): Promise<void> {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const { email, password, rememberMe } = result.data;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as any,
    organization: user.organization,
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  });

  await recordAuditLog({
    userId: user.id,
    eventType: 'USER_LOGIN',
    actionDetails: `User ${user.fullName} (${user.role}) logged in successfully.`,
    req,
  });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
    },
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.errors[0].message });
    return;
  }

  const { fullName, email, password, organization, role } = result.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existing) {
    res.status(400).json({ error: 'An account with this email address already exists.' });
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
  });

  const token = generateToken({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role as any,
    organization: user.organization,
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  });

  await recordAuditLog({
    userId: user.id,
    eventType: 'USER_REGISTER',
    actionDetails: `New user ${user.fullName} registered with role ${user.role}.`,
    req,
  });

  res.status(201).json({
    message: 'Registration successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  if (req.user) {
    await recordAuditLog({
      userId: req.user.id,
      eventType: 'USER_LOGOUT',
      actionDetails: `User ${req.user.fullName} logged out.`,
      req,
    });
  }
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json({ user: req.user });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  // Demonstration response
  res.json({
    message: 'DEMO MODE: Password reset link has been dispatched to your email address (simulated).',
  });
}
