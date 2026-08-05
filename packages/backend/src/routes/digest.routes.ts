import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { digestController } from '../controllers/data.controller.js';

const router = Router();

router.get('/', authenticate, asyncHandler(digestController.list.bind(digestController)));
router.get('/today', authenticate, asyncHandler(digestController.getToday.bind(digestController)));

export default router;
