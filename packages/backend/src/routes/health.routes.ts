import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { healthController } from '../controllers/health.controller.js';

const router = Router();

router.get('/', asyncHandler(healthController.health.bind(healthController)));
router.get('/live', asyncHandler(healthController.live.bind(healthController)));
router.get('/ready', asyncHandler(healthController.ready.bind(healthController)));
router.get('/version', asyncHandler(healthController.version.bind(healthController)));
router.get('/metrics', asyncHandler(healthController.metrics.bind(healthController)));
router.get('/detailed', asyncHandler(healthController.detailed.bind(healthController)));

export default router;
