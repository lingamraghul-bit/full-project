import { Router } from 'express';
import { getAnalyticsOverview, getDepartmentAnalytics, exportReport } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/overview', getAnalyticsOverview);
router.get('/department/:departmentId', getDepartmentAnalytics);
router.get('/export', exportReport);

export { router as analyticsRoutes };
