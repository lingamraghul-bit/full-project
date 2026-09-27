import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { calculateEstimatedWait } from '../utils/helpers';

export const getAdminDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalPatients, todayPatients, waiting, inService, completed, roomsAvailable, totalRooms, todayAppointments] = await Promise.all([
      prisma.patient.count({ where: { isActive: true } }),
      prisma.patient.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.queueEntry.count({ where: { status: 'WAITING', createdAt: { gte: today } } }),
      prisma.queueEntry.count({ where: { status: 'IN_SERVICE', createdAt: { gte: today } } }),
      prisma.queueEntry.count({ where: { status: 'COMPLETED', createdAt: { gte: today } } }),
      prisma.room.count({ where: { status: 'AVAILABLE' } }),
      prisma.room.count(),
      prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED'] } } }),
    ]);

    // Average wait time (from completed entries today)
    const completedEntries = await prisma.queueEntry.findMany({
      where: { status: 'COMPLETED', createdAt: { gte: today }, serviceStartAt: { not: null } },
      select: { checkinTime: true, serviceStartAt: true },
    });
    const avgWaitMins = completedEntries.length > 0
      ? Math.round(completedEntries.reduce((sum, e) => sum + (e.serviceStartAt!.getTime() - e.checkinTime.getTime()) / 60000, 0) / completedEntries.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalPatients, todayPatients, waiting, inService, completed,
        roomsAvailable, totalRooms, todayAppointments, avgWaitTime: avgWaitMins,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', code: 'INTERNAL_ERROR' });
  }
};

export const getReceptionDashboard = async (_req: Request, res: Response): Promise<void> => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayRegistered, todayAppointments, waiting, inService, completed, noShows] = await Promise.all([
      prisma.patient.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.queueEntry.count({ where: { status: 'WAITING', createdAt: { gte: today } } }),
      prisma.queueEntry.count({ where: { status: 'IN_SERVICE', createdAt: { gte: today } } }),
      prisma.queueEntry.count({ where: { status: 'COMPLETED', createdAt: { gte: today } } }),
      prisma.queueEntry.count({ where: { status: 'NO_SHOW', createdAt: { gte: today } } }),
    ]);

    res.json({
      success: true,
      data: { todayRegistered, todayAppointments, waiting, inService, completed, noShows },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', code: 'INTERNAL_ERROR' });
  }
};

export const getDoctorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    // Get doctor's department
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.id },
      include: { department: true },
    });

    if (!doctor) {
      res.status(404).json({ success: false, message: 'Doctor profile not found', code: 'NOT_FOUND' });
      return;
    }

    const queue = await prisma.queue.findUnique({ where: { departmentId: doctor.departmentId } });
    let queueData = { waiting: 0, inService: 0, completed: 0, entries: [] as any[] };

    if (queue) {
      const [waiting, inService, completed] = await Promise.all([
        prisma.queueEntry.count({ where: { queueId: queue.id, status: 'WAITING', createdAt: { gte: today } } }),
        prisma.queueEntry.count({ where: { queueId: queue.id, status: 'IN_SERVICE', createdAt: { gte: today } } }),
        prisma.queueEntry.count({ where: { queueId: queue.id, status: 'COMPLETED', createdAt: { gte: today } } }),
      ]);

      const entries = await prisma.queueEntry.findMany({
        where: { queueId: queue.id, createdAt: { gte: today }, status: { in: ['WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED'] } },
        include: {
          appointment: { include: { patient: { select: { id: true, patientId: true, firstName: true, lastName: true, age: true, gender: true } } } },
          room: true,
        },
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { checkinTime: 'asc' }],
      });

      queueData = { waiting, inService, completed, entries };
    }

    const todayAppointments = await prisma.appointment.count({
      where: { doctorId: doctor.id, date: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED'] } },
    });

    res.json({
      success: true,
      data: {
        doctor: { id: doctor.id, name: `Dr. ${req.user!.firstName} ${req.user!.lastName}`, department: doctor.department, specialization: doctor.specialization },
        todayAppointments,
        queue: queueData,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard', code: 'INTERNAL_ERROR' });
  }
};

export const getPatientDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) { res.status(404).json({ success: false, message: 'Patient not found', code: 'NOT_FOUND' }); return; }

    // Active queue entries
    const activeEntries = await prisma.queueEntry.findMany({
      where: {
        createdAt: { gte: today },
        status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
        OR: [
          { appointment: { patientId } },
          { workflow: { patientId } },
        ],
      },
      include: {
        queue: { include: { department: true } },
        room: true,
      },
    });

    // For each active entry, calculate position
    const entriesWithPosition = await Promise.all(activeEntries.map(async (entry) => {
      const ahead = await prisma.queueEntry.count({
        where: {
          queueId: entry.queueId,
          status: 'WAITING',
          createdAt: { gte: today },
          checkinTime: { lt: entry.checkinTime },
        },
      });
      const waitEstimate = calculateEstimatedWait(ahead, 15, 1);
      return { ...entry, position: ahead + 1, estimatedWait: waitEstimate };
    }));

    // Active workflows
    const workflows = await prisma.patientWorkflow.findMany({
      where: { patientId, status: 'IN_PROGRESS' },
      include: { steps: { include: { department: true, service: true }, orderBy: { stepOrder: 'asc' } } },
    });

    // Active QR token
    const qrToken = await prisma.qRToken.findFirst({
      where: { patientId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: {
        patient: { id: patient.id, patientId: patient.patientId, firstName: patient.firstName, lastName: patient.lastName },
        activeEntries: entriesWithPosition,
        workflows,
        hasActiveQR: !!qrToken,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch patient dashboard', code: 'INTERNAL_ERROR' });
  }
};
