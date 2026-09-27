import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { calculateEstimatedWait } from '../utils/helpers';

// Gemini AI Service
let genAI: any = null;

const initGemini = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    genAI = new GoogleGenerativeAI(apiKey);
    return genAI;
  } catch {
    return null;
  }
};

const SYSTEM_PROMPT = `You are the SmartQMS hospital queue assistant.

Your role is to assist users with hospital queue and workflow information.

Rules:
1. Use only information supplied by the application context.
2. Never invent patient information.
3. Never reveal information belonging to another patient.
4. Never diagnose diseases or prescribe medication.
5. Never override hospital policy.
6. Queue estimates are estimates, not guarantees.
7. If information is unavailable, say so honestly.
8. Keep patient-facing answers short, clear, and friendly.
9. Escalate medical questions to qualified healthcare professionals.
10. Format responses in clear paragraphs, use bullet points when listing information.`;

const getQueueContext = async (patientId?: string) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let context = '';

  if (patientId) {
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (patient) {
      context += `Patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.patientId})\n`;

      const entries = await prisma.queueEntry.findMany({
        where: {
          createdAt: { gte: today },
          status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
          OR: [{ appointment: { patientId } }, { workflow: { patientId } }],
        },
        include: { queue: { include: { department: true } }, room: true },
      });

      if (entries.length > 0) {
        for (const entry of entries) {
          const ahead = await prisma.queueEntry.count({
            where: { queueId: entry.queueId, status: 'WAITING', checkinTime: { lt: entry.checkinTime }, createdAt: { gte: today } },
          });
          const wait = calculateEstimatedWait(ahead, 15, 1);
          context += `Token: ${entry.tokenNumber}, Department: ${entry.queue.department.name}, Status: ${entry.status}, Position: ${ahead + 1}, Est. Wait: ${wait.estimatedMinutes} mins\n`;
          if (entry.room) context += `Room: ${entry.room.roomNumber}\n`;
        }
      } else {
        context += 'No active queue entries found for this patient today.\n';
      }

      const workflows = await prisma.patientWorkflow.findMany({
        where: { patientId, status: 'IN_PROGRESS' },
        include: { steps: { include: { department: true }, orderBy: { stepOrder: 'asc' } } },
      });
      if (workflows.length > 0) {
        context += '\nPatient Journey:\n';
        workflows[0].steps.forEach(step => {
          const icon = step.status === 'COMPLETED' ? '✓' : step.status === 'IN_PROGRESS' ? '→' : step.status === 'WAITING' ? '⏳' : '○';
          context += `${icon} ${step.department.name} (${step.status})\n`;
        });
      }
    }
  }

  // General queue stats
  const depts = await prisma.department.findMany({ where: { isActive: true }, include: { queues: true } });
  context += '\nDepartment Queue Status:\n';
  for (const dept of depts) {
    if (dept.queues.length > 0) {
      const waitCount = await prisma.queueEntry.count({
        where: { queueId: dept.queues[0].id, status: 'WAITING', createdAt: { gte: today } },
      });
      context += `${dept.name}: ${waitCount} waiting\n`;
    }
  }

  return context;
};

export const chat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message, conversationId, context: chatContext, patientId } = req.body;

    // Check Gemini availability
    if (!genAI) await initGemini();
    if (!genAI) {
      // Fallback response
      res.json({
        success: true,
        data: {
          response: 'The AI assistant is currently unavailable. Basic queue services continue to work normally. Please check the queue display or ask reception staff for assistance.',
          conversationId: conversationId || null,
          aiAvailable: false,
        },
      });
      return;
    }

    // Get queue context
    const queueContext = await getQueueContext(patientId);

    // Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const conv = await prisma.aIConversation.create({
        data: { patientId: patientId || undefined, userId: req.user?.id, context: chatContext || 'patient' },
      });
      convId = conv.id;
    }

    // Save user message
    await prisma.aIMessage.create({
      data: { conversationId: convId, role: 'user', content: message },
    });

    // Call Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `${SYSTEM_PROMPT}\n\nCurrent System Data:\n${queueContext}\n\nUser Question: ${message}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Save AI response
    await prisma.aIMessage.create({
      data: { conversationId: convId, role: 'assistant', content: responseText },
    });

    res.json({
      success: true,
      data: {
        response: responseText,
        conversationId: convId,
        aiAvailable: true,
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.json({
      success: true,
      data: {
        response: 'I apologize, but I encountered an error processing your request. Please try again or contact reception for assistance.',
        conversationId: null,
        aiAvailable: false,
      },
    });
  }
};

export const getQueueInsights = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);

    // Get department stats
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: { queues: true },
    });

    const insights = [];
    for (const dept of departments) {
      if (dept.queues.length === 0) continue;
      const queue = dept.queues[0];

      const waiting = await prisma.queueEntry.count({ where: { queueId: queue.id, status: 'WAITING', createdAt: { gte: today } } });
      const completed = await prisma.queueEntry.count({ where: { queueId: queue.id, status: 'COMPLETED', createdAt: { gte: today } } });

      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (waiting > 15) status = 'critical';
      else if (waiting > 8) status = 'warning';

      insights.push({ department: dept.name, departmentId: dept.id, waiting, completed, status });
    }

    // AI-generated summary if available
    let aiSummary = null;
    if (!genAI) await initGemini();
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const data = insights.map(i => `${i.department}: ${i.waiting} waiting, ${i.completed} completed (${i.status})`).join('\n');
        const prompt = `${SYSTEM_PROMPT}\n\nYou are providing queue insights to a hospital administrator.\n\nCurrent Queue Data:\n${data}\n\nProvide a brief summary of the current queue situation and any recommendations. Keep it to 3-4 sentences.`;
        
        const result = await model.generateContent(prompt);
        aiSummary = result.response.text();
      } catch {
        aiSummary = null;
      }
    }

    res.json({ success: true, data: { insights, aiSummary, aiAvailable: !!genAI } });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch insights', code: 'INTERNAL_ERROR' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId } = req.params;
    const conversations = await prisma.aIConversation.findMany({
      where: { patientId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ success: true, data: conversations });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch conversations', code: 'INTERNAL_ERROR' });
  }
};
