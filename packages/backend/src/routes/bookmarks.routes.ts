import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { bookmarkController } from '../controllers/data.controller.js';

const router = Router();

router.get('/', authenticate, asyncHandler(bookmarkController.list.bind(bookmarkController)));
router.post('/', authenticate, asyncHandler(bookmarkController.create.bind(bookmarkController)));
router.delete('/:id', authenticate, asyncHandler(bookmarkController.remove.bind(bookmarkController)));

export default router;
