import { Router } from 'express';
import { getDoctors, getDoctorById, createDoctor, updateDoctor, deleteDoctor } from '../controllers/doctor.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDoctorSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);
router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.post('/', authorize('ADMIN'), validate(createDoctorSchema), createDoctor);
router.put('/:id', authorize('ADMIN'), updateDoctor);
router.delete('/:id', authorize('ADMIN'), deleteDoctor);

export { router as doctorRoutes };
