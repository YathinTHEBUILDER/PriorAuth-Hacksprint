import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'prior-auth-jwt-secret-key-production-ready-2026';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMINISTRATOR' | 'DOCTOR' | 'STAFF';
  organization: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organization: user.organization,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. No session token found.' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        organization: true,
        isActive: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      res.status(401).json({ error: 'User session invalid or account has been deactivated.' });
      return;
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
      role: dbUser.role as 'ADMINISTRATOR' | 'DOCTOR' | 'STAFF',
      organization: dbUser.organization,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(...allowedRoles: Array<'ADMINISTRATOR' | 'DOCTOR' | 'STAFF'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this action. Required: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
