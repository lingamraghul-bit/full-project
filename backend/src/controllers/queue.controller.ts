import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { generateTokenNumber, calculateEstimatedWait } from '../utils/helpers';

export const checkin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qrToken, departmentId } = req.body;

    const trimmed = (qrToken || '').trim();

    // Verify QR token or find patient by code
    let tokenRecord = await prisma.qRToken.findFirst({
      where: {
        OR: [
          { token: trimmed },
          { id: trimmed },
        ],
      },
      include: { patient: true },
    });

    if (!tokenRecord) {
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { patientId: { equals: trimmed, mode: 'insensitive' } },
            { id: trimmed },
            { phone: trimmed },
          ],
        },
      });

      if (!patient) {
        res.status(400).json({ success: false, message: 'Invalid patient code or QR token', code: 'INVALID_QR' });
        return;
      }

      // Find or create active token
      tokenRecord = await prisma.qRToken.findFirst({
        where: {
          patientId: patient.id,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
        include: { patient: true },
      });

      if (!tokenRecord) {
        const expiresAt = new Date();
        expiresAt.setHours(23, 59, 59, 999);
        tokenRecord = await prisma.qRToken.create({
          data: {
            token: trimmed.startsWith('P-') ? `${trimmed}-${Date.now()}` : trimmed,
            patientId: patient.id,
            payload: JSON.stringify({ patientId: patient.id, patientCode: patient.patientId }),
            status: 'ACTIVE',
            expiresAt,
          },
          include: { patient: true },
        });
      }
    }

    if (tokenRecord.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'QR token is inactive or already used', code: 'INVALID_QR' });
      return;
    }

    // Get or determine department
    let deptId = departmentId;
    if (!deptId) {
      // Check if patient has an appointment today
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const appt = await prisma.appointment.findFirst({
        where: { patientId: tokenRecord.patientId, date: { gte: today, lt: tomorrow }, status: { in: ['SCHEDULED', 'CHECKED_IN'] } },
      });
      if (appt) {
        deptId = appt.departmentId;
        await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'CHECKED_IN' } });
      } else {
        res.status(400).json({ success: false, message: 'Department is required for walk-in patients', code: 'DEPT_REQUIRED' });
        return;
      }
    }

    // Get queue for department
    const queue = await prisma.queue.findUnique({ where: { departmentId: deptId } });
    if (!queue) {
      res.status(404).json({ success: false, message: 'No queue found for this department', code: 'QUEUE_NOT_FOUND' });
      return;
    }

    // Check if already checked in to this queue today
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existingEntry = await prisma.queueEntry.findFirst({
      where: {
        queueId: queue.id,
        appointment: { patientId: tokenRecord.patientId },
        createdAt: { gte: today },
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });
    if (existingEntry) {
      res.status(409).json({ success: false, message: 'Patient already in queue', code: 'ALREADY_IN_QUEUE' });
      return;
    }

    // Increment queue number and generate token
    const updatedQueue = await prisma.queue.update({
      where: { id: queue.id },
      data: { currentNumber: { increment: 1 } },
    });
    const tokenNumber = generateTokenNumber(queue.prefix, updatedQueue.currentNumber);

    // Get appointment for linking
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
    const appointment = await prisma.appointment.findFirst({
      where: { patientId: tokenRecord.patientId, departmentId: deptId, date: { gte: todayStart, lt: todayEnd }, status: { in: ['SCHEDULED', 'CHECKED_IN'] } },
    });

    // Create queue entry
    const entry = await prisma.queueEntry.create({
      data: {
        tokenNumber,
        queueId: queue.id,
        appointmentId: appointment?.id,
        priority: appointment ? 1 : 0, // Appointments get priority
        status: 'WAITING',
      },
      include: {
        queue: { include: { department: true } },
      },
    });

    // Mark QR as used
    await prisma.qRToken.update({ where: { id: tokenRecord.id }, data: { status: 'USED', usedAt: new Date() } });

    // Update appointment status
    if (appointment) {
      await prisma.appointment.update({ where: { id: appointment.id }, data: { status: 'IN_QUEUE' } });
    }

    // Log event
    await prisma.queueEvent.create({
      data: { entryId: entry.id, action: 'CREATED', performedBy: req.user?.id },
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { departmentId: deptId });
      io.emit('patient:checked-in', { tokenNumber, department: entry.queue.department.name });
    }

    // Count patients ahead
    const ahead = await prisma.queueEntry.count({
      where: { queueId: queue.id, status: 'WAITING', priority: { gte: entry.priority }, checkinTime: { lt: entry.checkinTime }, createdAt: { gte: todayStart } },
    });

    const waitEstimate = calculateEstimatedWait(ahead, 15, 1); // 15min avg, 1 counter default

    await createAuditLog(req.user?.id || null, 'CHECKIN', 'queue_entry', entry.id, JSON.stringify({ tokenNumber, patient: tokenRecord.patient.patientId }));

    res.status(201).json({
      success: true,
      data: {
        entry: {
          id: entry.id,
          tokenNumber: entry.tokenNumber,
          status: entry.status,
          department: entry.queue.department.name,
          departmentCode: entry.queue.department.code,
        },
        patient: {
          id: tokenRecord.patient.id,
          patientId: tokenRecord.patient.patientId,
          name: `${tokenRecord.patient.firstName} ${tokenRecord.patient.lastName}`,
        },
        queuePosition: ahead + 1,
        estimatedWait: waitEstimate,
      },
    });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ success: false, message: 'Check-in failed', code: 'INTERNAL_ERROR' });
  }
};

export const getQueues = async (_req: Request, res: Response): Promise<void> => {
  try {
    const queues = await prisma.queue.findMany({
      where: { isActive: true },
      include: {
        department: { select: { id: true, name: true, code: true } },
        entries: {
          where: { status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] }, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          orderBy: [{ priority: 'desc' }, { checkinTime: 'asc' }],
          include: {
            appointment: { include: { patient: { select: { patientId: true, firstName: true, lastName: true } } } },
          },
        },
        _count: {
          select: { entries: { where: { status: 'WAITING', createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } } },
        },
      },
    });

    res.json({ success: true, data: queues });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch queues', code: 'INTERNAL_ERROR' });
  }
};

export const getQueueByDepartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const queue = await prisma.queue.findUnique({
      where: { departmentId },
      include: {
        department: true,
        entries: {
          where: { createdAt: { gte: today }, status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] } },
          orderBy: [{ priority: 'desc' }, { checkinTime: 'asc' }],
          include: {
            appointment: { include: { patient: { select: { id: true, patientId: true, firstName: true, lastName: true, age: true, gender: true } } } },
            room: true,
            workflowStep: { include: { service: true } },
          },
        },
      },
    });

    if (!queue) {
      res.status(404).json({ success: false, message: 'Queue not found', code: 'QUEUE_NOT_FOUND' });
      return;
    }

    const serving = queue.entries.find(e => e.status === 'IN_SERVICE');
    const called = queue.entries.find(e => e.status === 'CALLED');
    const waiting = queue.entries.filter(e => e.status === 'WAITING');

    res.json({
      success: true,
      data: {
        queue: { id: queue.id, prefix: queue.prefix, department: queue.department },
        serving: serving || null,
        called: called || null,
        waiting,
        totalWaiting: waiting.length,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch queue', code: 'INTERNAL_ERROR' });
  }
};

export const callNext = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const { roomId } = req.body;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const queue = await prisma.queue.findUnique({ where: { departmentId } });
    if (!queue) { res.status(404).json({ success: false, message: 'Queue not found', code: 'QUEUE_NOT_FOUND' }); return; }

    // Get next waiting entry (by priority then checkin time)
    const nextEntry = await prisma.queueEntry.findFirst({
      where: { queueId: queue.id, status: 'WAITING', createdAt: { gte: today } },
      orderBy: [{ priority: 'desc' }, { checkinTime: 'asc' }],
      include: { appointment: { include: { patient: { select: { patientId: true, firstName: true, lastName: true } } } } },
    });

    if (!nextEntry) {
      res.json({ success: true, data: null, message: 'No patients waiting in queue' });
      return;
    }

    // Update entry status to CALLED
    const updated = await prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
        roomId: roomId || undefined,
      },
      include: {
        appointment: { include: { patient: { select: { patientId: true, firstName: true, lastName: true } } } },
        room: true,
        queue: { include: { department: true } },
      },
    });

    await prisma.queueEvent.create({
      data: { entryId: updated.id, action: 'CALLED', performedBy: req.user?.id },
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('token:called', {
        tokenNumber: updated.tokenNumber,
        department: updated.queue.department.name,
        room: updated.room?.roomNumber,
        patient: updated.appointment?.patient,
      });
      io.emit('queue:updated', { departmentId });
    }

    await createAuditLog(req.user?.id || null, 'CALL_NEXT', 'queue_entry', updated.id, JSON.stringify({ tokenNumber: updated.tokenNumber }));

    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to call next', code: 'INTERNAL_ERROR' });
  }
};

export const startService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'IN_SERVICE', serviceStartAt: new Date() },
      include: {
        appointment: { include: { patient: { select: { patientId: true, firstName: true, lastName: true } } } },
        queue: { include: { department: true } },
      },
    });

    if (entry.appointment) {
      await prisma.appointment.update({ where: { id: entry.appointment.id }, data: { status: 'IN_SERVICE' } });
    }

    await prisma.queueEvent.create({ data: { entryId, action: 'STARTED', performedBy: req.user?.id } });

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { departmentId: entry.queue.departmentId });
    }

    await createAuditLog(req.user?.id || null, 'START_SERVICE', 'queue_entry', entryId);
    res.json({ success: true, data: entry });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Queue entry not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to start service', code: 'INTERNAL_ERROR' });
  }
};

export const completeService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const { notes } = req.body;

    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'COMPLETED', serviceEndAt: new Date() },
      include: {
        appointment: true,
        queue: { include: { department: true } },
        workflowStep: true,
        workflow: true,
      },
    });

    if (entry.appointment) {
      await prisma.appointment.update({ where: { id: entry.appointment.id }, data: { status: 'COMPLETED' } });
    }

    // Update workflow step if applicable
    if (entry.workflowStepId) {
      await prisma.workflowStep.update({
        where: { id: entry.workflowStepId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      // Check if there's a next step
      if (entry.patientWorkflowId) {
        const nextStep = await prisma.workflowStep.findFirst({
          where: { workflowId: entry.patientWorkflowId, status: 'PENDING' },
          orderBy: { stepOrder: 'asc' },
          include: { department: true },
        });

        if (nextStep) {
          await prisma.workflowStep.update({ where: { id: nextStep.id }, data: { status: 'WAITING' } });
          // Auto-add to next department queue will happen on next checkin/transfer
        } else {
          // All steps complete
          await prisma.patientWorkflow.update({
            where: { id: entry.patientWorkflowId },
            data: { status: 'COMPLETED' },
          });
        }
      }
    }

    // Free room
    if (entry.roomId) {
      await prisma.room.update({ where: { id: entry.roomId }, data: { status: 'AVAILABLE' } });
    }

    await prisma.queueEvent.create({ data: { entryId, action: 'COMPLETED', performedBy: req.user?.id, notes } });

    const io = req.app.get('io');
    if (io) {
      io.emit('token:completed', { tokenNumber: entry.tokenNumber, department: entry.queue.department.name });
      io.emit('queue:updated', { departmentId: entry.queue.departmentId });
      if (entry.patientWorkflowId) io.emit('workflow:updated', { workflowId: entry.patientWorkflowId });
    }

    await createAuditLog(req.user?.id || null, 'COMPLETE_SERVICE', 'queue_entry', entryId, JSON.stringify({ tokenNumber: entry.tokenNumber }));
    res.json({ success: true, data: entry, message: 'Service completed' });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Queue entry not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to complete service', code: 'INTERNAL_ERROR' });
  }
};

export const skipEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'SKIPPED' },
      include: { queue: { include: { department: true } } },
    });
    await prisma.queueEvent.create({ data: { entryId, action: 'SKIPPED', performedBy: req.user?.id } });
    const io = req.app.get('io');
    if (io) io.emit('queue:updated', { departmentId: entry.queue.departmentId });
    await createAuditLog(req.user?.id || null, 'SKIP', 'queue_entry', entryId);
    res.json({ success: true, data: entry });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Queue entry not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to skip entry', code: 'INTERNAL_ERROR' });
  }
};

export const cancelEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'CANCELLED' },
      include: { queue: { include: { department: true } } },
    });
    if (entry.roomId) await prisma.room.update({ where: { id: entry.roomId }, data: { status: 'AVAILABLE' } });
    await prisma.queueEvent.create({ data: { entryId, action: 'CANCELLED', performedBy: req.user?.id } });
    const io = req.app.get('io');
    if (io) io.emit('queue:updated', { departmentId: entry.queue.departmentId });
    await createAuditLog(req.user?.id || null, 'CANCEL', 'queue_entry', entryId);
    res.json({ success: true, data: entry });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Queue entry not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to cancel entry', code: 'INTERNAL_ERROR' });
  }
};

export const recallEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'CALLED', calledAt: new Date() },
      include: { queue: { include: { department: true } }, room: true },
    });
    await prisma.queueEvent.create({ data: { entryId, action: 'RECALLED', performedBy: req.user?.id } });
    const io = req.app.get('io');
    if (io) {
      io.emit('token:called', { tokenNumber: entry.tokenNumber, department: entry.queue.department.name, room: entry.room?.roomNumber });
      io.emit('queue:updated', { departmentId: entry.queue.departmentId });
    }
    res.json({ success: true, data: entry });
  } catch (error: any) {
    if (error.code === 'P2025') { res.status(404).json({ success: false, message: 'Queue entry not found', code: 'NOT_FOUND' }); return; }
    res.status(500).json({ success: false, message: 'Failed to recall entry', code: 'INTERNAL_ERROR' });
  }
};

export const transferEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entryId } = req.params;
    const { targetDepartmentId, notes } = req.body;

    const currentEntry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { appointment: { include: { patient: true } }, queue: true },
    });
    if (!currentEntry) { res.status(404).json({ success: false, message: 'Queue entry not found', code: 'NOT_FOUND' }); return; }

    // Complete current entry
    await prisma.queueEntry.update({ where: { id: entryId }, data: { status: 'COMPLETED', serviceEndAt: new Date() } });
    if (currentEntry.roomId) await prisma.room.update({ where: { id: currentEntry.roomId }, data: { status: 'AVAILABLE' } });

    // Add to target department queue
    const targetQueue = await prisma.queue.findUnique({ where: { departmentId: targetDepartmentId } });
    if (!targetQueue) { res.status(404).json({ success: false, message: 'Target department queue not found', code: 'QUEUE_NOT_FOUND' }); return; }

    const updatedQueue = await prisma.queue.update({ where: { id: targetQueue.id }, data: { currentNumber: { increment: 1 } } });
    const newToken = generateTokenNumber(targetQueue.prefix, updatedQueue.currentNumber);

    const newEntry = await prisma.queueEntry.create({
      data: {
        tokenNumber: newToken,
        queueId: targetQueue.id,
        patientWorkflowId: currentEntry.patientWorkflowId,
        priority: currentEntry.priority,
        status: 'WAITING',
      },
      include: { queue: { include: { department: true } } },
    });

    await prisma.queueEvent.create({ data: { entryId: newEntry.id, action: 'CREATED', performedBy: req.user?.id, notes: `Transferred from ${currentEntry.tokenNumber}. ${notes || ''}` } });

    const io = req.app.get('io');
    if (io) {
      io.emit('queue:updated', { departmentId: currentEntry.queue.departmentId });
      io.emit('queue:updated', { departmentId: targetDepartmentId });
    }

    await createAuditLog(req.user?.id || null, 'TRANSFER', 'queue_entry', newEntry.id, JSON.stringify({ from: currentEntry.tokenNumber, to: newToken }));
    res.json({ success: true, data: newEntry, message: `Patient transferred with new token ${newToken}` });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to transfer', code: 'INTERNAL_ERROR' });
  }
};

export const getDisplayQueue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const queue = await prisma.queue.findUnique({
      where: { departmentId },
      include: { department: true },
    });
    if (!queue) { res.status(404).json({ success: false, message: 'Queue not found', code: 'QUEUE_NOT_FOUND' }); return; }

    const serving = await prisma.queueEntry.findFirst({
      where: { queueId: queue.id, status: 'IN_SERVICE', createdAt: { gte: today } },
      include: { room: true },
      orderBy: { serviceStartAt: 'desc' },
    });

    const called = await prisma.queueEntry.findFirst({
      where: { queueId: queue.id, status: 'CALLED', createdAt: { gte: today } },
      include: { room: true },
      orderBy: { calledAt: 'desc' },
    });

    const upcoming = await prisma.queueEntry.findMany({
      where: { queueId: queue.id, status: 'WAITING', createdAt: { gte: today } },
      orderBy: [{ priority: 'desc' }, { checkinTime: 'asc' }],
      take: 10,
    });

    res.json({
      success: true,
      data: {
        department: queue.department,
        serving: serving ? { tokenNumber: serving.tokenNumber, room: serving.room?.roomNumber } : null,
        called: called ? { tokenNumber: called.tokenNumber, room: called.room?.roomNumber } : null,
        upcoming: upcoming.map(e => ({ tokenNumber: e.tokenNumber })),
        totalWaiting: upcoming.length,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch display data', code: 'INTERNAL_ERROR' });
  }
};
