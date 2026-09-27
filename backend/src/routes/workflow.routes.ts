import { Router } from 'express';
import { createWorkflow, getWorkflow, getWorkflowStatus, advanceWorkflow } from '../controllers/workflow.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { workflowSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);

router.post('/', authorize('ADMIN', 'RECEPTIONIST', 'DOCTOR'), validate(workflowSchema), createWorkflow);
router.get('/patient/:patientId', getWorkflow);
router.get('/:id', getWorkflowStatus);
router.post('/:id/advance', authorize('ADMIN', 'DOCTOR'), advanceWorkflow);

export { router as workflowRoutes };
