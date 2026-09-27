import { Router } from 'express';
import { getStaff, createStaff, deleteStaff } from '../controllers/staff.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createStaffSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);
router.get('/', authorize('ADMIN'), getStaff);
router.post('/', authorize('ADMIN'), validate(createStaffSchema), createStaff);
router.delete('/:id', authorize('ADMIN'), deleteStaff);

export { router as staffRoutes };
