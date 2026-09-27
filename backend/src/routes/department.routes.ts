import { Router } from 'express';
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createDepartmentSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', authorize('ADMIN'), validate(createDepartmentSchema), createDepartment);
router.put('/:id', authorize('ADMIN'), updateDepartment);
router.delete('/:id', authorize('ADMIN'), deleteDepartment);

export { router as departmentRoutes };
