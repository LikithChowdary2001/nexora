import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireProfile, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimit.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { chatWithAssistant } from '../services/ai.service.js';
import { fetchNewsFromAllProviders } from '../services/news.service.js';
import { aiChatRepository } from '../repositories/aiChat.repository.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import type { SupportedLanguage } from '@nexora/shared';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  articleIds: z.array(z.string()).optional(),
  language: z.enum(['en', 'es', 'hi', 'te', 'fr', 'de', 'ja', 'zh']).optional(),
  sessionId: z.string().optional(),
});

router.post('/chat', aiRateLimiter, authenticate, requireProfile, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const uid = req.uid!;

  const { message, articleIds, language, sessionId } = chatSchema.parse(req.body);
  const lang = (language || user.language || 'en') as SupportedLanguage;

  const NEWS_CONTEXT_TIMEOUT_MS = 10_000;

  let articles: Awaited<ReturnType<typeof fetchNewsFromAllProviders>> = [];
  try {
    const fetchArticles = async () => {
      if (articleIds?.length) {
        const feed = await fetchNewsFromAllProviders('', user);
        return feed.filter((a) => articleIds.includes(a.id));
      }
      return (await fetchNewsFromAllProviders('latest news', user)).slice(0, 10);
    };

    articles = await Promise.race([
      fetchArticles(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('News context fetch timed out')), NEWS_CONTEXT_TIMEOUT_MS)
      ),
    ]);
  } catch (error) {
    logger.warn('News fetch failed for AI chat — continuing without article context', {
      message: error instanceof Error ? error.message : 'unknown',
    });
  }

  let response;
  try {
    response = await chatWithAssistant(
      { message, articleIds, language: lang },
      articles,
      user
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown';
    if (msg.includes('OpenAI API key not configured')) {
      res.status(503).json({
        success: false,
        error: 'AI assistant is not configured. Add OPENAI_API_KEY on Render.',
        code: 'AI_NOT_CONFIGURED',
      });
      return;
    }
    throw error;
  }

  const now = new Date().toISOString();
  const userMessage = { id: uuidv4(), role: 'user' as const, content: message, timestamp: now };
  const assistantMessage = {
    id: uuidv4(),
    role: 'assistant' as const,
    content: response.message,
    timestamp: new Date().toISOString(),
    articleContext: response.sources,
  };

  let activeSessionId = sessionId;
  try {
    if (activeSessionId) {
      const session = await aiChatRepository.findById(activeSessionId);
      if (!session || session.userId !== uid) {
        activeSessionId = undefined;
      }
    }

    if (!activeSessionId) {
      activeSessionId = await aiChatRepository.createSession(
        uid,
        message.slice(0, 80) || 'Chat session'
      );
    }

    await aiChatRepository.addMessage(activeSessionId, userMessage);
    await aiChatRepository.addMessage(activeSessionId, assistantMessage);
  } catch (error) {
    logger.warn('AI chat history not saved (Firestore may be unavailable)', {
      uid,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }

  sendSuccess(res, { ...response, sessionId: activeSessionId ?? null });
}));

export default router;
