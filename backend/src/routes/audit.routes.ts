import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', getAuditLogs);

export { router as auditRoutes };
