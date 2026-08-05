import { Router } from 'express';
import { verifyCronSecret } from '../middleware/cron.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendSuccess } from '../utils/response.js';
import {
  runDailyDigestJob,
  runSyncAnalyticsJob,
  runRefreshTrendingTopicsJob,
  runCleanupExpiredCacheJob,
  runRecordSystemHealthJob,
} from '../services/cron.service.js';

const router = Router();

router.use(verifyCronSecret);

router.post('/daily-digest', asyncHandler(async (_req, res) => {
  const result = await runDailyDigestJob();
  sendSuccess(res, result);
}));

router.post('/sync-analytics', asyncHandler(async (_req, res) => {
  const snapshot = await runSyncAnalyticsJob();
  sendSuccess(res, snapshot);
}));

router.post('/refresh-trending', asyncHandler(async (_req, res) => {
  const updated = await runRefreshTrendingTopicsJob();
  sendSuccess(res, { updated });
}));

router.post('/cleanup-cache', asyncHandler(async (_req, res) => {
  const deleted = await runCleanupExpiredCacheJob();
  sendSuccess(res, { deleted });
}));

router.post('/record-health', asyncHandler(async (_req, res) => {
  const health = await runRecordSystemHealthJob();
  sendSuccess(res, health);
}));

export default router;
