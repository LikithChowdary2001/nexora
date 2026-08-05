import { Router } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { aiRateLimiter } from '../middleware/rateLimit.middleware.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { chatWithAssistant } from '../services/ai.service.js';
import { fetchNewsFromAllProviders } from '../services/news.service.js';
import { aiChatRepository } from '../repositories/aiChat.repository.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { SupportedLanguage } from '@nexora/shared';

const router = Router();

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
  articleIds: z.array(z.string()).optional(),
  language: z.enum(['en', 'es', 'hi', 'te', 'fr', 'de', 'ja', 'zh']).optional(),
  sessionId: z.string().optional(),
});

router.post('/chat', aiRateLimiter, authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user || !req.uid) {
    sendError(res, 'Unauthorized', 401);
    return;
  }

  const { message, articleIds, language, sessionId } = chatSchema.parse(req.body);
  const lang = (language || req.user.language || 'en') as SupportedLanguage;

  let articles = [];
  if (articleIds?.length) {
    const feed = await fetchNewsFromAllProviders('', req.user);
    articles = feed.filter((a) => articleIds.includes(a.id));
  } else {
    articles = (await fetchNewsFromAllProviders('latest news', req.user)).slice(0, 10);
  }

  const response = await chatWithAssistant(
    { message, articleIds, language: lang },
    articles,
    req.user
  );

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
  if (activeSessionId) {
    const session = await aiChatRepository.findById(activeSessionId);
    if (!session || session.userId !== req.uid) {
      activeSessionId = undefined;
    }
  }

  if (!activeSessionId) {
    activeSessionId = await aiChatRepository.createSession(
      req.uid,
      message.slice(0, 80) || 'Chat session'
    );
  }

  await aiChatRepository.addMessage(activeSessionId, userMessage);
  await aiChatRepository.addMessage(activeSessionId, assistantMessage);

  sendSuccess(res, { ...response, sessionId: activeSessionId });
}));

export default router;
