import { Router } from 'express';
import { getAppointments, getAppointmentById, createAppointment, updateAppointment, cancelAppointment, getTodayAppointments } from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAppointmentSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);

router.get('/', getAppointments);
router.get('/today', getTodayAppointments);
router.get('/:id', getAppointmentById);
router.post('/', authorize('ADMIN', 'RECEPTIONIST'), validate(createAppointmentSchema), createAppointment);
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST'), updateAppointment);
router.patch('/:id/cancel', authorize('ADMIN', 'RECEPTIONIST'), cancelAppointment);

export { router as appointmentRoutes };
