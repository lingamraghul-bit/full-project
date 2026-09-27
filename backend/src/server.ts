import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { patientRoutes } from './routes/patient.routes';
import { departmentRoutes } from './routes/department.routes';
import { doctorRoutes } from './routes/doctor.routes';
import { appointmentRoutes } from './routes/appointment.routes';
import { qrRoutes } from './routes/qr.routes';
import { queueRoutes } from './routes/queue.routes';
import { workflowRoutes } from './routes/workflow.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { aiRoutes } from './routes/ai.routes';
import { notificationRoutes } from './routes/notification.routes';
import { auditRoutes } from './routes/audit.routes';
import { settingsRoutes } from './routes/settings.routes';
import { staffRoutes } from './routes/staff.routes';
import { serviceRoutes } from './routes/service.routes';
import { setupSocketHandlers } from './socket/handlers';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // generous for dev
  message: { success: false, message: 'Too many requests', code: 'RATE_LIMITED' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'SmartQMS API is running', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Socket.IO handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`SmartQMS server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, server, io };
