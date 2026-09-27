import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const generateQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      res.status(400).json({ success: false, message: 'Patient ID is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) {
      res.status(404).json({ success: false, message: 'Patient not found', code: 'PATIENT_NOT_FOUND' });
      return;
    }

    // Revoke any existing active tokens for this patient
    await prisma.qRToken.updateMany({
      where: { patientId, status: 'ACTIVE' },
      data: { status: 'REVOKED' },
    });

    // Generate secure token
    const token = uuidv4();
    const payload = JSON.stringify({ patientId: patient.id, patientCode: patient.patientId, token });

    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999); // Expires end of day

    const qrToken = await prisma.qRToken.create({
      data: {
        token,
        patientId: patient.id,
        payload,
        status: 'ACTIVE',
        expiresAt,
      },
    });

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(token, { width: 300, margin: 2, color: { dark: '#0F172A', light: '#FFFFFF' } });

    res.json({
      success: true,
      data: {
        qrToken: token,
        qrImage: qrDataUrl,
        patient: { id: patient.id, patientId: patient.patientId, name: `${patient.firstName} ${patient.lastName}` },
        expiresAt: qrToken.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate QR code', code: 'INTERNAL_ERROR' });
  }
};

export const verifyQR = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { qrToken } = req.body;
    if (!qrToken || !qrToken.trim()) {
      res.status(400).json({ success: false, message: 'QR token or patient code is required', code: 'VALIDATION_ERROR' });
      return;
    }

    const trimmed = qrToken.trim();

    // 1. Look up by active or matching QR token
    let tokenRecord = await prisma.qRToken.findFirst({
      where: {
        OR: [
          { token: trimmed },
          { id: trimmed },
        ],
      },
      include: {
        patient: {
          include: {
            appointments: {
              where: {
                date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
                status: { in: ['SCHEDULED', 'CHECKED_IN'] },
              },
              include: { department: true, doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
              take: 1,
            },
          },
        },
      },
    });

    let patientRecord: any = tokenRecord?.patient;

    // 2. If not found by QR token, search by patientId (e.g. "P-2026-000002"), id, or phone
    if (!patientRecord) {
      const patient = await prisma.patient.findFirst({
        where: {
          OR: [
            { patientId: { equals: trimmed, mode: 'insensitive' } },
            { id: trimmed },
            { phone: trimmed },
          ],
        },
        include: {
          appointments: {
            where: {
              date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
              status: { in: ['SCHEDULED', 'CHECKED_IN'] },
            },
            include: { department: true, doctor: { include: { user: { select: { firstName: true, lastName: true } } } } },
            take: 1,
          },
        },
      });

      if (!patient) {
        res.status(404).json({ success: false, message: `Patient with code "${trimmed}" not found`, code: 'NOT_FOUND' });
        return;
      }

      patientRecord = patient;

      // Find existing active token or generate new one
      tokenRecord = await prisma.qRToken.findFirst({
        where: {
          patientId: patient.id,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() },
        },
      });

      if (!tokenRecord) {
        const expiresAt = new Date();
        expiresAt.setHours(23, 59, 59, 999);
        const newToken = uuidv4();
        tokenRecord = await prisma.qRToken.create({
          data: {
            token: newToken,
            patientId: patient.id,
            payload: JSON.stringify({ patientId: patient.id, patientCode: patient.patientId, token: newToken }),
            status: 'ACTIVE',
            expiresAt,
          },
        });
      }
    }

    if (tokenRecord && tokenRecord.status === 'USED') {
      res.status(409).json({ success: false, message: 'QR code already used — patient already checked in', code: 'QR_ALREADY_USED' });
      return;
    }

    const appointment = patientRecord.appointments?.[0] || null;

    res.json({
      success: true,
      data: {
        qrToken: tokenRecord ? tokenRecord.token : trimmed,
        patient: {
          id: patientRecord.id,
          patientId: patientRecord.patientId,
          firstName: patientRecord.firstName,
          lastName: patientRecord.lastName,
          phone: patientRecord.phone,
          age: patientRecord.age,
          gender: patientRecord.gender,
        },
        appointment: appointment ? {
          id: appointment.id,
          department: appointment.department,
          doctor: appointment.doctor,
          timeSlot: appointment.timeSlot,
          status: appointment.status,
        } : null,
        qrTokenId: tokenRecord ? tokenRecord.id : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify QR code or patient code', code: 'INTERNAL_ERROR' });
  }
};
