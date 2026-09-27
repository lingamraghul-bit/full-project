import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const getStaff = async (_req: Request, res: Response): Promise<void> => {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true } },
        department: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: staff });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch staff', code: 'INTERNAL_ERROR' });
  }
};

export const createStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, phone, role, departmentId, position } = req.body;
    const passwordHash = await bcrypt.hash('SmartQMS2026!', 12);
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const employeeId = `STF-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, username, passwordHash, role, firstName, lastName, phone },
      });
      const staff = await tx.staff.create({
        data: { userId: user.id, employeeId, departmentId, position },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } },
          department: { select: { name: true } },
        },
      });
      return staff;
    });

    await createAuditLog(req.user?.id || null, 'CREATE', 'staff', result.id);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Email or username already exists', code: 'DUPLICATE_ENTRY' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create staff', code: 'INTERNAL_ERROR' });
  }
};

export const deleteStaff = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await prisma.staff.findUnique({ where: { id: req.params.id } });
    if (!staff) { res.status(404).json({ success: false, message: 'Staff not found', code: 'NOT_FOUND' }); return; }
    await prisma.user.update({ where: { id: staff.userId }, data: { isActive: false } });
    await createAuditLog(req.user?.id || null, 'DEACTIVATE', 'staff', req.params.id);
    res.json({ success: true, message: 'Staff deactivated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete staff', code: 'INTERNAL_ERROR' });
  }
};
