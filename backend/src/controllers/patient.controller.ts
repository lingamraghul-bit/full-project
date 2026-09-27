import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';
import { generatePatientId } from '../utils/helpers';

export const getPatients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { patientId: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string } },
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          appointments: { take: 1, orderBy: { date: 'desc' } },
        },
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({
      success: true,
      data: patients,
      pagination: { page: parseInt(page as string), limit: take, total, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch patients', code: 'INTERNAL_ERROR' });
  }
};

export const getPatientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        appointments: {
          include: { department: true, doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
          orderBy: { date: 'desc' },
        },
        workflows: {
          include: {
            steps: {
              include: { department: true, service: true },
              orderBy: { stepOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        qrTokens: { where: { status: 'ACTIVE' }, take: 1, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found', code: 'PATIENT_NOT_FOUND' });
      return;
    }

    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch patient', code: 'INTERNAL_ERROR' });
  }
};

export const createPatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, dateOfBirth, age, gender, phone, email, address, emergencyContact, bloodGroup } = req.body;

    // Check duplicate by phone (same day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existing = await prisma.patient.findFirst({
      where: {
        phone,
        createdAt: { gte: today },
      },
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'Patient with this phone already registered today', code: 'DUPLICATE_PATIENT' });
      return;
    }

    // Generate ID
    const count = await prisma.patient.count();
    const patientId = generatePatientId(count + 1);

    const patient = await prisma.patient.create({
      data: {
        patientId,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        age,
        gender,
        phone,
        email: email || undefined,
        address,
        emergencyContact,
        bloodGroup,
      },
    });

    await createAuditLog(req.user?.id || null, 'CREATE', 'patient', patient.id, JSON.stringify({ patientId }));

    res.status(201).json({ success: true, data: patient });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ success: false, message: 'Duplicate entry', code: 'DUPLICATE_ENTRY' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create patient', code: 'INTERNAL_ERROR' });
  }
};

export const updatePatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data: any = { ...req.body };
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth);
    if (data.email === '') delete data.email;

    const patient = await prisma.patient.update({
      where: { id },
      data,
    });

    await createAuditLog(req.user?.id || null, 'UPDATE', 'patient', id);
    res.json({ success: true, data: patient });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Patient not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to update patient', code: 'INTERNAL_ERROR' });
  }
};

export const deletePatient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.patient.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    await createAuditLog(req.user?.id || null, 'DEACTIVATE', 'patient', req.params.id);
    res.json({ success: true, message: 'Patient deactivated' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Patient not found', code: 'NOT_FOUND' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to delete patient', code: 'INTERNAL_ERROR' });
  }
};
