import { Request, Response } from 'express';
import prisma from '../prisma.js';

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;

  const notifications = await prisma.notification.findMany({
    where: userId ? { OR: [{ userId }, { userId: 'user-staff-01' }] } : {},
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  res.json({
    notifications,
    unreadCount,
  });
}

export async function markNotificationAsRead(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const notification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json({ notification });
}

export async function markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;

  await prisma.notification.updateMany({
    where: userId ? { userId } : {},
    data: { isRead: true },
  });

  res.json({ message: 'All notifications marked as read' });
}
