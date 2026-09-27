import { Router } from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/service.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createServiceSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);
router.get('/', getServices);
router.post('/', authorize('ADMIN'), validate(createServiceSchema), createService);
router.put('/:id', authorize('ADMIN'), updateService);
router.delete('/:id', authorize('ADMIN'), deleteService);

export { router as serviceRoutes };
