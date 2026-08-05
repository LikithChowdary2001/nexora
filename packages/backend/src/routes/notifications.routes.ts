import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { notificationController } from '../controllers/data.controller.js';

const router = Router();

router.get('/', authenticate, asyncHandler(notificationController.list.bind(notificationController)));
router.put('/:id/read', authenticate, asyncHandler(notificationController.markRead.bind(notificationController)));

export default router;
