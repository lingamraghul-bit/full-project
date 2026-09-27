import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const getServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.query;
    const where: any = { isActive: true };
    if (departmentId) where.departmentId = departmentId;

    const services = await prisma.service.findMany({
      where,
      include: { department: { select: { id: true, name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: services });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch services', code: 'INTERNAL_ERROR' });
  }
};

export const createService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = await prisma.service.create({
      data: req.body,
      include: { department: { select: { name: true } } },
    });
    await createAuditLog(req.user?.id || null, 'CREATE', 'service', service.id);
    res.status(201).json({ success: true, data: service });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Service already exists', code: 'DUPLICATE_ENTRY' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create service', code: 'INTERNAL_ERROR' });
  }
};

export const updateService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = await prisma.service.update({ where: { id: req.params.id }, data: req.body });
    await createAuditLog(req.user?.id || null, 'UPDATE', 'service', req.params.id);
    res.json({ success: true, data: service });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Service not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to update service', code: 'INTERNAL_ERROR' });
  }
};

export const deleteService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.service.update({ where: { id: req.params.id }, data: { isActive: false } });
    await createAuditLog(req.user?.id || null, 'DEACTIVATE', 'service', req.params.id);
    res.json({ success: true, message: 'Service deactivated' });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Service not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to delete service', code: 'INTERNAL_ERROR' });
  }
};
