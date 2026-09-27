import { Router } from 'express';
import { getQueues, getQueueByDepartment, checkin, callNext, startService, completeService, skipEntry, cancelEntry, recallEntry, transferEntry, getDisplayQueue } from '../controllers/queue.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { checkinSchema } from '../validators/schemas';

const router = Router();

// Public display endpoint (no auth required)
router.get('/display/:departmentId', getDisplayQueue);

// Protected routes
router.use(authenticate);
router.get('/', getQueues);
router.get('/department/:departmentId', getQueueByDepartment);
router.post('/checkin', authorize('ADMIN', 'RECEPTIONIST'), validate(checkinSchema), checkin);
router.post('/call/:departmentId', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), callNext);
router.patch('/start/:entryId', authorize('ADMIN', 'DOCTOR'), startService);
router.patch('/complete/:entryId', authorize('ADMIN', 'DOCTOR'), completeService);
router.patch('/skip/:entryId', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), skipEntry);
router.patch('/cancel/:entryId', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), cancelEntry);
router.patch('/recall/:entryId', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), recallEntry);
router.post('/transfer/:entryId', authorize('ADMIN', 'DOCTOR', 'RECEPTIONIST'), transferEntry);

export { router as queueRoutes };
