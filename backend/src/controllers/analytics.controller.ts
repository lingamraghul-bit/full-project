import { Request, Response } from 'express';
import prisma from '../config/database';

export const getAnalyticsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = '7' } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    startDate.setHours(0, 0, 0, 0);

    // Patients per day
    const patientsPerDay = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM patients 
      WHERE created_at >= ${startDate} 
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `;

    // Queue entries per department
    const byDepartment = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
      SELECT d.name, COUNT(qe.id) as count
      FROM queue_entries qe
      JOIN queues q ON qe.queue_id = q.id
      JOIN departments d ON q.department_id = d.id
      WHERE qe.created_at >= ${startDate}
      GROUP BY d.name
      ORDER BY count DESC
    `;

    // Average wait time per day
    const avgWaitPerDay = await prisma.$queryRaw<Array<{ date: string; avg_wait: number }>>`
      SELECT DATE(created_at) as date,
        ROUND(AVG(EXTRACT(EPOCH FROM (service_start_at - checkin_time)) / 60)) as avg_wait
      FROM queue_entries
      WHERE created_at >= ${startDate} AND service_start_at IS NOT NULL AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Peak hours
    const peakHours = await prisma.$queryRaw<Array<{ hour: number; count: bigint }>>`
      SELECT EXTRACT(HOUR FROM checkin_time) as hour, COUNT(*) as count
      FROM queue_entries
      WHERE created_at >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM checkin_time)
      ORDER BY hour ASC
    `;

    // Status breakdown
    const statusBreakdown = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
      SELECT status, COUNT(*) as count
      FROM queue_entries
      WHERE created_at >= ${startDate}
      GROUP BY status
    `;

    // Serialize BigInt
    const serialize = (data: any[]) => data.map(row => {
      const obj: any = {};
      for (const [key, val] of Object.entries(row)) {
        obj[key] = typeof val === 'bigint' ? Number(val) : val;
      }
      return obj;
    });

    res.json({
      success: true,
      data: {
        patientsPerDay: serialize(patientsPerDay),
        byDepartment: serialize(byDepartment),
        avgWaitPerDay: serialize(avgWaitPerDay),
        peakHours: serialize(peakHours),
        statusBreakdown: serialize(statusBreakdown),
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', code: 'INTERNAL_ERROR' });
  }
};

export const getDepartmentAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { departmentId } = req.params;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const queue = await prisma.queue.findUnique({ where: { departmentId } });
    if (!queue) { res.status(404).json({ success: false, message: 'Queue not found', code: 'NOT_FOUND' }); return; }

    const [totalToday, completedToday, avgServiceTime] = await Promise.all([
      prisma.queueEntry.count({ where: { queueId: queue.id, createdAt: { gte: today } } }),
      prisma.queueEntry.count({ where: { queueId: queue.id, status: 'COMPLETED', createdAt: { gte: today } } }),
      prisma.queueEntry.aggregate({
        where: { queueId: queue.id, status: 'COMPLETED', createdAt: { gte: today }, serviceStartAt: { not: null }, serviceEndAt: { not: null } },
        _avg: { priority: true }, // placeholder - we'll calc manually
      }),
    ]);

    // Manual avg service time calc
    const entries = await prisma.queueEntry.findMany({
      where: { queueId: queue.id, status: 'COMPLETED', createdAt: { gte: today }, serviceStartAt: { not: null }, serviceEndAt: { not: null } },
      select: { serviceStartAt: true, serviceEndAt: true },
    });
    const avgMins = entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + (e.serviceEndAt!.getTime() - e.serviceStartAt!.getTime()) / 60000, 0) / entries.length)
      : 0;

    res.json({
      success: true,
      data: { totalToday, completedToday, avgServiceTimeMins: avgMins },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch department analytics', code: 'INTERNAL_ERROR' });
  }
};

export const exportReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'daily', date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate); nextDay.setDate(nextDay.getDate() + 1);

    const entries = await prisma.queueEntry.findMany({
      where: { createdAt: { gte: targetDate, lt: nextDay } },
      include: {
        queue: { include: { department: true } },
        appointment: { include: { patient: { select: { patientId: true, firstName: true, lastName: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // CSV format
    const csvHeader = 'Token,Patient ID,Patient Name,Department,Status,Check-in Time,Service Start,Service End\n';
    const csvRows = entries.map(e => {
      const p = e.appointment?.patient;
      return `${e.tokenNumber},${p?.patientId || 'N/A'},${p ? `${p.firstName} ${p.lastName}` : 'N/A'},${e.queue.department.name},${e.status},${e.checkinTime.toISOString()},${e.serviceStartAt?.toISOString() || ''},${e.serviceEndAt?.toISOString() || ''}`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="queue-report-${targetDate.toISOString().split('T')[0]}.csv"`);
    res.send(csvHeader + csvRows);
  } catch {
    res.status(500).json({ success: false, message: 'Failed to export report', code: 'INTERNAL_ERROR' });
  }
};
