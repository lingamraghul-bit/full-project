import { Router } from 'express';
import { generateQR, verifyQR } from '../controllers/qr.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.post('/generate', authorize('ADMIN', 'RECEPTIONIST'), generateQR);
router.post('/verify', authorize('ADMIN', 'RECEPTIONIST'), verifyQR);

export { router as qrRoutes };
