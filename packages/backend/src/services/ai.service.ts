import OpenAI from 'openai';
import type {
  AIBriefing,
  AIAssistantRequest,
  AIAssistantResponse,
  NewsArticle,
  SupportedLanguage,
  UserProfile,
} from '@nexora/shared';
import { config } from '../config/index.js';
import { newsCacheRepository } from '../repositories/newsCache.repository.js';
import { SUMMARY_PROMPT } from '../prompts/ai.prompts.js';
import { logger } from '../utils/logger.js';

let openaiClient: OpenAI | null = null;

const OPENAI_TIMEOUT_MS = 30_000;
const OPENAI_MAX_RETRIES = 2;

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= OPENAI_MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < OPENAI_MAX_RETRIES) {
        logger.warn('OpenAI request retry', { label, attempt: attempt + 1 });
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

function getClient(): OpenAI {
  if (!openaiClient) {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
      timeout: OPENAI_TIMEOUT_MS,
      maxRetries: 0,
    });
  }
  return openaiClient;
}

const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  hi: 'Hindi',
  te: 'Telugu',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese',
};

export async function generateBriefing(
  articles: NewsArticle[],
  user: UserProfile,
  language: SupportedLanguage
): Promise<AIBriefing> {
  const client = getClient();
  const langName = languageNames[language];

  const articleSummaries = articles
    .slice(0, 15)
    .map((a, i) => `${i + 1}. ${a.title} (${a.source}): ${a.description}`)
    .join('\n');

  const response = await withRetry(
    () =>
      client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are Nexora, an AI news assistant. Generate a personalized daily briefing in ${langName}. 
User interests: ${user.interests.join(', ')}. Profession: ${user.profession}. Country: ${user.country}.
Respond in valid JSON with keys: executiveSummary, topHeadlines (array of 5 strings), keyTakeaways (array of 5 strings), relatedTopics (array of 5 strings), suggestedReading (array of 5 article titles from the provided list).`,
          },
          {
            role: 'user',
            content: `Generate today's AI briefing from these articles:\n${articleSummaries}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    'generateBriefing'
  );

  const content = response.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);

  return {
    executiveSummary: parsed.executiveSummary ?? '',
    topHeadlines: parsed.topHeadlines ?? [],
    keyTakeaways: parsed.keyTakeaways ?? [],
    relatedTopics: parsed.relatedTopics ?? [],
    suggestedReading: parsed.suggestedReading ?? [],
    generatedAt: new Date().toISOString(),
    language,
  };
}

export async function summarizeArticles(
  articles: NewsArticle[],
  query: string,
  language: SupportedLanguage
): Promise<string> {
  const client = getClient();
  const langName = languageNames[language];

  const articleText = articles
    .slice(0, 10)
    .map((a) => `- ${a.title}: ${a.description}`)
    .join('\n');

  const response = await withRetry(
    () =>
      client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `Summarize news articles about "${query}" in ${langName}. Provide a concise, informative summary with key points.`,
          },
          { role: 'user', content: articleText },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    'summarizeArticles'
  );

  return response.choices[0]?.message?.content ?? '';
}

export async function summarizeSingleArticle(
  article: NewsArticle,
  language: SupportedLanguage
): Promise<string> {
  const cached = await newsCacheRepository.getArticleSummary(article.id, language);
  if (cached) {
    logger.debug('AI summary cache hit', { articleId: article.id });
    return cached;
  }

  const client = getClient();
  const langName = languageNames[language];

  const response = await withRetry(
    () =>
      client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `${SUMMARY_PROMPT} Respond in ${langName}.`,
          },
          {
            role: 'user',
            content: `Title: ${article.title}\nDescription: ${article.description}\nSource: ${article.source}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    'summarizeSingleArticle'
  );

  const summary = response.choices[0]?.message?.content ?? article.description;
  await newsCacheRepository.setArticleSummary(article.id, language, summary);
  return summary;
}

export async function chatWithAssistant(
  request: AIAssistantRequest,
  articles: NewsArticle[],
  user: UserProfile
): Promise<AIAssistantResponse> {
  const client = getClient();
  const langName = languageNames[request.language];

  const context = articles
    .map((a) => `[${a.source}] ${a.title}: ${a.description}`)
    .join('\n');

  const response = await withRetry(
    () =>
      client.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: `You are Nexora AI Assistant, a helpful news analyst. Answer in ${langName}.
User: ${user.firstName}, interests: ${user.interests.join(', ')}.
Use the provided articles as context. If asked to explain like they're 10, use simple language.
Only cite facts from the provided articles. If information is unavailable, say so clearly.
Available articles:\n${context}`,
          },
          { role: 'user', content: request.message },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    'chatWithAssistant'
  );

  return {
    message: response.choices[0]?.message?.content ?? 'I could not generate a response.',
    sources: articles.slice(0, 3),
  };
}

export async function generateRelatedSearches(
  query: string,
  language: SupportedLanguage
): Promise<string[]> {
  const client = getClient();

  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      {
        role: 'system',
        content: 'Generate 5 related search queries as a JSON array of strings.',
      },
      { role: 'user', content: `Related searches for: "${query}" in ${languageNames[language]}` },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content ?? '{"searches":[]}';
  const parsed = JSON.parse(content);
  return parsed.searches ?? parsed.relatedSearches ?? [];
}

export async function checkOpenAIHealth(): Promise<boolean> {
  try {
    if (!config.openai.apiKey) return false;
    const client = getClient();
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}
