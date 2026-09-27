import { Router } from 'express';
import { getAdminDashboard, getReceptionDashboard, getDoctorDashboard, getPatientDashboard } from '../controllers/dashboard.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/admin', authorize('ADMIN'), getAdminDashboard);
router.get('/reception', authorize('ADMIN', 'RECEPTIONIST'), getReceptionDashboard);
router.get('/doctor', authorize('ADMIN', 'DOCTOR'), getDoctorDashboard);
router.get('/patient/:patientId', getPatientDashboard);

export { router as dashboardRoutes };
