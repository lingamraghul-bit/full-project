import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  try {
    const settings = await prisma.hospitalSetting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { settingsMap[s.key] = s.value; });
    res.json({ success: true, data: settingsMap });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch settings', code: 'INTERNAL_ERROR' });
  }
};

export const updateSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, value } = req.body;
    await prisma.hospitalSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    res.json({ success: true, message: 'Setting updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update setting', code: 'INTERNAL_ERROR' });
  }
};
