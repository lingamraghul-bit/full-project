import { Router } from 'express';
import { getPatients, getPatientById, createPatient, updatePatient, deletePatient } from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerPatientSchema, updatePatientSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.get('/', getPatients);
router.get('/:id', getPatientById);
router.post('/', authorize('ADMIN', 'RECEPTIONIST'), validate(registerPatientSchema), createPatient);
router.put('/:id', authorize('ADMIN', 'RECEPTIONIST'), updatePatient);
router.delete('/:id', authorize('ADMIN'), deletePatient);

export { router as patientRoutes };
