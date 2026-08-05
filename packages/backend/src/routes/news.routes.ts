import { Router } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import {
  fetchPersonalizedFeed,
  fetchTrendingNews,
} from '../services/news.service.js';
import { generateBriefing, summarizeSingleArticle } from '../services/ai.service.js';
import { readingHistoryController } from '../controllers/data.controller.js';
import { sendSuccess } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
import type { SupportedLanguage } from '@nexora/shared';

const router = Router();

router.get('/feed', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new ValidationError('Unauthorized');
  const articles = await fetchPersonalizedFeed(req.user);
  sendSuccess(res, articles);
}));

router.get('/trending', authenticate, asyncHandler(async (_req, res) => {
  const articles = await fetchTrendingNews();
  sendSuccess(res, articles);
}));

router.get('/briefing', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new ValidationError('Unauthorized');
  const language = (req.query.language as SupportedLanguage) || req.user.language || 'en';
  const articles = await fetchPersonalizedFeed(req.user);
  const briefing = await generateBriefing(articles, req.user, language);
  sendSuccess(res, briefing);
}));

router.get('/article/:id/summary', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const url = req.query.url as string;
  if (!url) throw new ValidationError('URL required');

  const language = (req.query.language as SupportedLanguage) || req.user?.language || 'en';
  const articleId = String(req.params.id);
  const article = {
    id: articleId,
    title: (req.query.title as string) || '',
    description: (req.query.description as string) || '',
    url,
    source: (req.query.source as string) || '',
    publishedAt: new Date().toISOString(),
    readingTimeMinutes: 3,
    provider: 'google-news-rss' as const,
  };

  const summary = await summarizeSingleArticle(article, language);
  sendSuccess(res, { ...article, aiSummary: summary });
}));

router.post('/read', authenticate, asyncHandler(readingHistoryController.record.bind(readingHistoryController)));
router.get('/continue-reading', authenticate, asyncHandler(readingHistoryController.getContinueReading.bind(readingHistoryController)));

export default router;
