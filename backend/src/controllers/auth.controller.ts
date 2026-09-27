import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { createAuditLog } from '../utils/audit';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is deactivated', code: 'ACCOUNT_DISABLED' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ success: false, message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' });
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      { expiresIn: '7d' }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await createAuditLog(user.id, 'LOGIN', 'user', user.id, null, req.ip);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login failed', code: 'INTERNAL_ERROR' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Refresh token required', code: 'NO_TOKEN' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret') as { userId: string };

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_TOKEN' });
      return;
    }

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({ success: true, data: { accessToken } });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token', code: 'INVALID_TOKEN' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        lastLogin: true,
        createdAt: true,
        doctor: {
          include: { department: true },
        },
        staff: {
          include: { department: true },
        },
        patient: true,
      },
    });

    res.json({ success: true, data: user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch profile', code: 'INTERNAL_ERROR' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  await createAuditLog(req.user?.id || null, 'LOGOUT', 'user', req.user?.id);
  res.json({ success: true, message: 'Logged out successfully' });
};
