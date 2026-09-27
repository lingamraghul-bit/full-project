import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { generateTokenNumber } from '../utils/helpers';

export const createWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, steps } = req.body;

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) { res.status(404).json({ success: false, message: 'Patient not found', code: 'NOT_FOUND' }); return; }

    const workflow = await prisma.patientWorkflow.create({
      data: {
        patientId,
        steps: {
          create: steps.map((step: any, idx: number) => ({
            departmentId: step.departmentId,
            serviceId: step.serviceId || undefined,
            stepOrder: idx + 1,
            status: idx === 0 ? 'WAITING' : 'PENDING',
          })),
        },
      },
      include: {
        steps: { include: { department: true, service: true }, orderBy: { stepOrder: 'asc' } },
      },
    });

    // Auto-add first step to queue
    const firstStep = workflow.steps[0];
    const queue = await prisma.queue.findUnique({ where: { departmentId: firstStep.departmentId } });
    if (queue) {
      const updatedQueue = await prisma.queue.update({ where: { id: queue.id }, data: { currentNumber: { increment: 1 } } });
      const tokenNumber = generateTokenNumber(queue.prefix, updatedQueue.currentNumber);
      
      await prisma.queueEntry.create({
        data: {
          tokenNumber,
          queueId: queue.id,
          patientWorkflowId: workflow.id,
          workflowStepId: firstStep.id,
          status: 'WAITING',
        },
      });
    }

    const io = req.app.get('io');
    if (io) io.emit('workflow:updated', { workflowId: workflow.id });

    await createAuditLog(req.user?.id || null, 'CREATE', 'workflow', workflow.id);
    res.status(201).json({ success: true, data: workflow });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create workflow', code: 'INTERNAL_ERROR' });
  }
};

export const getWorkflow = async (req: Request, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const workflows = await prisma.patientWorkflow.findMany({
      where: { patientId },
      include: {
        steps: { include: { department: true, service: true }, orderBy: { stepOrder: 'asc' } },
        queueEntries: { include: { queue: { include: { department: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: workflows });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch workflows', code: 'INTERNAL_ERROR' });
  }
};

export const getWorkflowStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const workflow = await prisma.patientWorkflow.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { select: { patientId: true, firstName: true, lastName: true } },
        steps: { include: { department: true, service: true }, orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!workflow) { res.status(404).json({ success: false, message: 'Workflow not found', code: 'NOT_FOUND' }); return; }
    res.json({ success: true, data: workflow });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch workflow', code: 'INTERNAL_ERROR' });
  }
};

export const advanceWorkflow = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const workflow = await prisma.patientWorkflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!workflow) { res.status(404).json({ success: false, message: 'Workflow not found', code: 'NOT_FOUND' }); return; }

    // Find current step
    const currentStep = workflow.steps.find(s => s.status === 'IN_PROGRESS' || s.status === 'WAITING');
    if (currentStep && currentStep.status === 'IN_PROGRESS') {
      await prisma.workflowStep.update({ where: { id: currentStep.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    }

    // Find next step
    const nextStep = workflow.steps.find(s => s.status === 'PENDING');
    if (nextStep) {
      await prisma.workflowStep.update({ where: { id: nextStep.id }, data: { status: 'WAITING' } });

      // Add to next queue
      const queue = await prisma.queue.findUnique({ where: { departmentId: nextStep.departmentId } });
      if (queue) {
        const updatedQueue = await prisma.queue.update({ where: { id: queue.id }, data: { currentNumber: { increment: 1 } } });
        const tokenNumber = generateTokenNumber(queue.prefix, updatedQueue.currentNumber);
        await prisma.queueEntry.create({
          data: { tokenNumber, queueId: queue.id, patientWorkflowId: workflow.id, workflowStepId: nextStep.id, status: 'WAITING' },
        });

        const io = req.app.get('io');
        if (io) {
          io.emit('queue:updated', { departmentId: nextStep.departmentId });
          io.emit('workflow:updated', { workflowId: workflow.id });
        }
      }
    } else {
      // All complete
      await prisma.patientWorkflow.update({ where: { id }, data: { status: 'COMPLETED' } });
    }

    const updated = await prisma.patientWorkflow.findUnique({
      where: { id },
      include: { steps: { include: { department: true, service: true }, orderBy: { stepOrder: 'asc' } } },
    });

    await createAuditLog(req.user?.id || null, 'ADVANCE', 'workflow', id);
    res.json({ success: true, data: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to advance workflow', code: 'INTERNAL_ERROR' });
  }
};
