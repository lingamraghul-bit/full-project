import { Router } from 'express';
import { getSettings, updateSetting } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', getSettings);
router.put('/', authorize('ADMIN'), updateSetting);

export { router as settingsRoutes };
