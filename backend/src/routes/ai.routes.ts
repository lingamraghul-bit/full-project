import { Router } from 'express';
import { chat, getQueueInsights, getConversations } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { aiChatSchema } from '../validators/schemas';

const router = Router();
router.use(authenticate);

router.post('/chat', validate(aiChatSchema), chat);
router.get('/insights', authorize('ADMIN'), getQueueInsights);
router.get('/conversations/:patientId', getConversations);

export { router as aiRoutes };
