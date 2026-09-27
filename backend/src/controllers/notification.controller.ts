import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications', code: 'INTERNAL_ERROR' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notification', code: 'INTERNAL_ERROR' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update notifications', code: 'INTERNAL_ERROR' });
  }
};

// Utility to create notifications (used by other controllers)
export const createNotification = async (userId: string, type: any, title: string, message: string, data?: string): Promise<void> => {
  try {
    await prisma.notification.create({ data: { userId, type, title, message, data } });
  } catch (e) {
    console.error('Notification creation failed:', e);
  }
};
