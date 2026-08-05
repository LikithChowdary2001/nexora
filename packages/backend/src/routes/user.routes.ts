import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { userController } from '../controllers/user.controller.js';

const router = Router();

router.post('/bootstrap', authenticate, asyncHandler(userController.bootstrap.bind(userController)));
router.get('/profile', authenticate, asyncHandler(userController.getProfile.bind(userController)));
router.post('/onboarding', authenticate, asyncHandler(userController.completeOnboarding.bind(userController)));
router.put('/profile', authenticate, asyncHandler(userController.updateProfile.bind(userController)));
router.get('/recommended-interests', authenticate, asyncHandler(userController.getRecommendedInterests.bind(userController)));
router.get('/preferences', authenticate, asyncHandler(userController.getPreferences.bind(userController)));
router.put('/preferences', authenticate, asyncHandler(userController.updatePreferences.bind(userController)));

export default router;
