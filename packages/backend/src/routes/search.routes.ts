import { Router } from 'express';
import { z } from 'zod';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { searchRateLimiter } from '../middleware/rateLimit.middleware.js';
import { fetchNewsFromAllProviders } from '../services/news.service.js';
import { summarizeArticles, generateRelatedSearches } from '../services/ai.service.js';
import { getFirestore } from '../firebase/index.js';
import type { SupportedLanguage } from '@nexora/shared';

const router = Router();

const searchSchema = z.object({
  query: z.string().min(1).max(200),
  language: z.enum(['en', 'es', 'hi', 'te', 'fr', 'de', 'ja', 'zh']).optional(),
});

router.post('/', searchRateLimiter, authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { query, language } = searchSchema.parse(req.body);
    const lang = (language || req.user?.language || 'en') as SupportedLanguage;

    const articles = await fetchNewsFromAllProviders(query, req.user);
    const summary = await summarizeArticles(articles, query, lang);
    const relatedSearches = await generateRelatedSearches(query, lang);

    if (req.uid) {
      await getFirestore().collection('searchHistory').add({
        userId: req.uid,
        query,
        resultCount: articles.length,
        searchedAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      data: {
        query,
        summary,
        articles: articles.slice(0, 20),
        relatedSearches,
        searchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors[0]?.message });
      return;
    }
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

router.get('/history', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.uid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const snapshot = await getFirestore()
      .collection('searchHistory')
      .where('userId', '==', req.uid)
      .orderBy('searchedAt', 'desc')
      .limit(20)
      .get();

    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: items });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch search history' });
  }
});

router.delete('/history/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.uid) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const doc = await getFirestore().collection('searchHistory').doc(String(req.params.id)).get();
    if (!doc.exists || doc.data()?.userId !== req.uid) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }

    await doc.ref.delete();
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete search history' });
  }
});

export default router;
