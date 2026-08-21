import { Router } from 'express';
import { z } from 'zod';
import {
  authenticate,
  requireProfile,
  type AuthenticatedRequest,
} from '../middleware/auth.middleware.js';
import { searchRateLimiter } from '../middleware/rateLimit.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { fetchNewsFromAllProviders } from '../services/news.service.js';
import { summarizeArticles, generateRelatedSearches } from '../services/ai.service.js';
import { searchHistoryRepository } from '../repositories/index.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { isFirestoreUnavailableError } from '../utils/errors.js';
import type { SupportedLanguage } from '@nexora/shared';

const router = Router();

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  language: z.enum(['en', 'es', 'hi', 'te', 'fr', 'de', 'ja', 'zh']).optional(),
});

async function saveSearchHistory(uid: string, query: string, resultCount: number): Promise<void> {
  try {
    await searchHistoryRepository.create({
      userId: uid,
      query,
      resultCount,
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (isFirestoreUnavailableError(error)) {
      logger.debug('Search history not saved — Firestore unavailable', { uid });
      return;
    }
    logger.warn('Search history not saved', {
      uid,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
}

router.post(
  '/',
  searchRateLimiter,
  authenticate,
  requireProfile,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { query, language } = searchSchema.parse(req.body);
    const lang = (language || req.user!.language || 'en') as SupportedLanguage;

    const articles = await fetchNewsFromAllProviders(query, req.user!);

    let summary = '';
    try {
      summary = articles.length > 0
        ? await summarizeArticles(articles, query, lang)
        : `No recent news found for "${query}". Try a broader search term.`;
    } catch (error) {
      logger.warn('Search summary unavailable', {
        query,
        message: error instanceof Error ? error.message : 'unknown',
      });
      summary = articles.length > 0
        ? `Found ${articles.length} articles about "${query}". AI summary is temporarily unavailable.`
        : `No recent news found for "${query}".`;
    }

    let relatedSearches: string[] = [];
    try {
      relatedSearches = await generateRelatedSearches(query, lang);
    } catch (error) {
      logger.warn('Related searches unavailable', {
        query,
        message: error instanceof Error ? error.message : 'unknown',
      });
    }

    if (req.uid) {
      await saveSearchHistory(req.uid, query, articles.length);
    }

    sendSuccess(res, {
      query,
      summary,
      articles: articles.slice(0, 20),
      relatedSearches,
      searchedAt: new Date().toISOString(),
    });
  })
);

router.get(
  '/history',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.uid) {
      sendSuccess(res, []);
      return;
    }

    try {
      const items = await searchHistoryRepository.getUserHistory(req.uid, 20);
      sendSuccess(res, items);
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        sendSuccess(res, []);
        return;
      }
      throw error;
    }
  })
);

router.delete(
  '/history/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    if (!req.uid) {
      sendSuccess(res, { deleted: false });
      return;
    }

    try {
      const entry = await searchHistoryRepository.findById(String(req.params.id));
      if (!entry || entry.userId !== req.uid) {
        sendSuccess(res, { deleted: false });
        return;
      }
      await searchHistoryRepository.delete(String(req.params.id));
      sendSuccess(res, { deleted: true });
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        sendSuccess(res, { deleted: false });
        return;
      }
      throw error;
    }
  })
);

export default router;
