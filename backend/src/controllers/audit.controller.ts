import { Request, Response } from 'express';
import prisma from '../config/database';

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50', entity, action } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where, skip, take,
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs', code: 'INTERNAL_ERROR' });
  }
};
