import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const getAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, departmentId, doctorId, status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};
    if (date) {
      const d = new Date(date as string);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }
    if (departmentId) where.departmentId = departmentId;
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where, skip, take,
        include: {
          patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true } },
          doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
          department: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ date: 'asc' }, { timeSlot: 'asc' }],
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      success: true,
      data: appointments,
      pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch appointments', code: 'INTERNAL_ERROR' });
  }
};

export const getAppointmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        department: true,
      },
    });
    if (!appt) { res.status(404).json({ success: false, message: 'Appointment not found', code: 'NOT_FOUND' }); return; }
    res.json({ success: true, data: appt });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch appointment', code: 'INTERNAL_ERROR' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, doctorId, departmentId, date, timeSlot, notes } = req.body;

    // Check for conflicting appointment
    const existing = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorId || undefined,
        date: new Date(date),
        timeSlot,
        status: { notIn: ['CANCELLED'] },
      },
    });
    if (existing && doctorId) {
      res.status(409).json({ success: false, message: 'Time slot already booked for this doctor', code: 'SLOT_CONFLICT' });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: doctorId || undefined,
        departmentId,
        date: new Date(date),
        timeSlot,
        notes,
      },
      include: {
        patient: { select: { patientId: true, firstName: true, lastName: true } },
        department: { select: { name: true } },
      },
    });

    await createAuditLog(req.user?.id || null, 'CREATE', 'appointment', appointment.id);
    res.status(201).json({ success: true, data: appointment });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create appointment', code: 'INTERNAL_ERROR' });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data: any = { ...req.body };
    if (data.date) data.date = new Date(data.date);

    const appt = await prisma.appointment.update({ where: { id: req.params.id }, data });
    await createAuditLog(req.user?.id || null, 'UPDATE', 'appointment', req.params.id);
    res.json({ success: true, data: appt });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Appointment not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to update appointment', code: 'INTERNAL_ERROR' });
  }
};

export const cancelAppointment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const appt = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    await createAuditLog(req.user?.id || null, 'CANCEL', 'appointment', req.params.id);
    res.json({ success: true, data: appt });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Appointment not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to cancel appointment', code: 'INTERNAL_ERROR' });
  }
};

export const getTodayAppointments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: { date: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED'] } },
      include: {
        patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true } },
        doctor: { include: { user: { select: { firstName: true, lastName: true } } } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { timeSlot: 'asc' },
    });

    res.json({ success: true, data: appointments });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch today\'s appointments', code: 'INTERNAL_ERROR' });
  }
};
