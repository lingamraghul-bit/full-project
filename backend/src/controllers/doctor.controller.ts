import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const getDoctors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId, search } = req.query;
    const where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, isActive: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: doctors });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch doctors', code: 'INTERNAL_ERROR' });
  }
};

export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        department: true,
        rooms: true,
        appointments: {
          where: {
            date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
            status: { notIn: ['CANCELLED'] },
          },
          include: { patient: { select: { id: true, patientId: true, firstName: true, lastName: true } } },
          orderBy: { date: 'asc' },
        },
      },
    });
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found', code: 'NOT_FOUND' });
      return;
    }
    res.json({ success: true, data: doctor });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch doctor', code: 'INTERNAL_ERROR' });
  }
};

export const createDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, firstName, lastName, phone, departmentId, specialization, qualification, consultationDuration } = req.body;

    const passwordHash = await bcrypt.hash('SmartQMS2026!', 12);
    const username = `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const employeeId = `DR-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, username, passwordHash, role: 'DOCTOR', firstName, lastName, phone },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          employeeId,
          departmentId,
          specialization,
          qualification,
          consultationDuration: consultationDuration || 15,
        },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          department: { select: { id: true, name: true } },
        },
      });

      return doctor;
    });

    await createAuditLog(req.user?.id || null, 'CREATE', 'doctor', result.id, JSON.stringify({ email }));
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Email or username already exists', code: 'DUPLICATE_ENTRY' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create doctor', code: 'INTERNAL_ERROR' });
  }
};

export const updateDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { specialization, qualification, consultationDuration, departmentId, isAvailable } = req.body;
    const doctor = await prisma.doctor.update({
      where: { id: req.params.id },
      data: {
        ...(specialization !== undefined && { specialization }),
        ...(qualification !== undefined && { qualification }),
        ...(consultationDuration !== undefined && { consultationDuration }),
        ...(departmentId !== undefined && { departmentId }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        department: { select: { name: true } },
      },
    });
    await createAuditLog(req.user?.id || null, 'UPDATE', 'doctor', req.params.id);
    res.json({ success: true, data: doctor });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Doctor not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update doctor', code: 'INTERNAL_ERROR' });
  }
};

export const deleteDoctor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id: req.params.id } });
    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor not found', code: 'NOT_FOUND' });
      return;
    }
    await prisma.user.update({ where: { id: doctor.userId }, data: { isActive: false } });
    await createAuditLog(req.user?.id || null, 'DEACTIVATE', 'doctor', req.params.id);
    res.json({ success: true, message: 'Doctor deactivated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete doctor', code: 'INTERNAL_ERROR' });
  }
};
