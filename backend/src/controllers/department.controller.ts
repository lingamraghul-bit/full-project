import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const getDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { doctors: true, rooms: true, services: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch departments', code: 'INTERNAL_ERROR' });
  }
};

export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const dept = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        doctors: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        rooms: true,
        services: true,
        queues: true,
      },
    });
    if (!dept) {
      res.status(404).json({ success: false, message: 'Department not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: dept });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch department', code: 'INTERNAL_ERROR' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, code, description } = req.body;

    const department = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description },
    });

    // Auto-create queue for department
    await prisma.queue.create({
      data: {
        departmentId: department.id,
        prefix: code.substring(0, 1).toUpperCase(),
      },
    });

    await createAuditLog(req.user?.id || null, 'CREATE', 'department', department.id, JSON.stringify({ name }));
    res.status(201).json({ success: true, data: department });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Department already exists', code: 'DUPLICATE_ENTRY' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create department', code: 'INTERNAL_ERROR' });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await createAuditLog(req.user?.id || null, 'UPDATE', 'department', req.params.id);
    res.json({ success: true, data: dept });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Department not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update department', code: 'INTERNAL_ERROR' });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.department.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    await createAuditLog(req.user?.id || null, 'DEACTIVATE', 'department', req.params.id);
    res.json({ success: true, message: 'Department deactivated' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Department not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete department', code: 'INTERNAL_ERROR' });
  }
};
