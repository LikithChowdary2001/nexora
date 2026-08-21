import axios from 'axios';
import Parser from 'rss-parser';
import {
  generateArticleId,
  estimateReadingTime,
  type NewsArticle,
  type NewsProvider,
  type UserProfile,
} from '@nexora/shared';
import { config } from '../config/index.js';
import { deduplicateArticles, normalizeArticle } from '../utils/news.utils.js';
import { personalizationService } from './personalization.service.js';
import { newsCacheRepository } from '../repositories/newsCache.repository.js';
import { readingHistoryRepository } from '../repositories/index.js';
import { trendingTopicsRepository } from '../repositories/index.js';
import { logger } from '../utils/logger.js';
import { isFirestoreUnavailableError } from '../utils/errors.js';

export { deduplicateArticles, normalizeArticle };

let firestoreDegradedLogged = false;

function logFirestoreDegraded(context: string, error: unknown, extra?: Record<string, unknown>): void {
  if (isFirestoreUnavailableError(error)) {
    if (!firestoreDegradedLogged) {
      firestoreDegradedLogged = true;
      logger.warn(`${context} — Firestore unavailable; continuing without persistence`, {
        hint: 'Enable Firestore: https://console.firebase.google.com/project/nexora-28cf4/firestore',
        message: error instanceof Error ? error.message : 'unknown',
      });
    }
    return;
  }
  logger.warn(context, {
    ...extra,
    message: error instanceof Error ? error.message : 'unknown',
  });
}

const rssParser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail'],
  },
});

const GOOGLE_NEWS_RSS = 'https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en';

const RSS_TIMEOUT_MS = 12_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function fetchGoogleNewsRss(query: string): Promise<NewsArticle[]> {
  try {
    const url = GOOGLE_NEWS_RSS.replace('{query}', encodeURIComponent(query));
    const feed = await withTimeout(rssParser.parseURL(url), RSS_TIMEOUT_MS, 'Google News RSS');

    return (feed.items ?? []).map((item) => ({
      id: generateArticleId(item.link ?? item.guid ?? item.title ?? ''),
      title: item.title ?? '',
      description: item.contentSnippet ?? item.content ?? '',
      url: item.link ?? '',
      imageUrl: extractImageFromRss(item),
      source: extractSource(item.title ?? ''),
      publishedAt: item.pubDate ?? new Date().toISOString(),
      readingTimeMinutes: estimateReadingTime(item.contentSnippet ?? item.title ?? ''),
      provider: 'google-news-rss' as NewsProvider,
    }));
  } catch {
    return [];
  }
}

async function fetchGNews(query: string): Promise<NewsArticle[]> {
  if (!config.news.gnewsApiKey) return [];

  try {
    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: { q: query, lang: 'en', max: 20, apikey: config.news.gnewsApiKey },
      timeout: 10000,
    });

    return (response.data.articles ?? []).map(
      (item: { title: string; description: string; url: string; image: string; source: { name: string }; publishedAt: string; content: string }) => ({
        id: generateArticleId(item.url),
        title: item.title,
        description: item.description ?? '',
        url: item.url,
        imageUrl: item.image,
        source: item.source?.name ?? 'GNews',
        publishedAt: item.publishedAt,
        content: item.content,
        readingTimeMinutes: estimateReadingTime(item.description ?? item.title),
        provider: 'gnews' as NewsProvider,
      })
    );
  } catch {
    return [];
  }
}

async function fetchNewsApi(query: string): Promise<NewsArticle[]> {
  if (!config.news.newsApiKey) return [];

  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: query, language: 'en', pageSize: 20, sortBy: 'publishedAt', apiKey: config.news.newsApiKey },
      timeout: 10000,
    });

    return (response.data.articles ?? []).map(
      (item: { title: string; description: string; url: string; urlToImage: string; source: { name: string }; publishedAt: string; author: string; content: string }) => ({
        id: generateArticleId(item.url),
        title: item.title,
        description: item.description ?? '',
        url: item.url,
        imageUrl: item.urlToImage,
        source: item.source?.name ?? 'NewsAPI',
        publishedAt: item.publishedAt,
        author: item.author ?? undefined,
        content: item.content ?? undefined,
        readingTimeMinutes: estimateReadingTime(item.description ?? item.title),
        provider: 'newsapi' as NewsProvider,
      })
    );
  } catch {
    return [];
  }
}

function extractSource(title: string): string {
  const match = title.match(/ - ([^-]+)$/);
  return match ? match[1].trim() : 'Google News';
}

function extractImageFromRss(item: Parser.Item): string | undefined {
  const raw = item as Parser.Item & Record<string, unknown>;
  const media = raw['media:content'] as { $?: { url?: string } } | undefined;
  if (media?.$?.url) return media.$.url;
  const thumb = raw['media:thumbnail'] as { $?: { url?: string } } | undefined;
  if (thumb?.$?.url) return thumb.$.url;
  return undefined;
}

export async function rankArticles(
  articles: NewsArticle[],
  user: UserProfile,
  trendingTopics: string[] = []
): Promise<NewsArticle[]> {
  let history: Awaited<ReturnType<typeof readingHistoryRepository.getUserHistory>> = [];
  try {
    history = await readingHistoryRepository.getUserHistory(user.uid, 100);
  } catch (error) {
    logFirestoreDegraded('Reading history unavailable — ranking without history', error, { uid: user.uid });
  }
  return personalizationService.rankArticles(articles, user, trendingTopics, history);
}

export async function fetchNewsFromAllProviders(
  query: string,
  user?: UserProfile
): Promise<NewsArticle[]> {
  try {
    const cached = await newsCacheRepository.getValidCache(query);
    if (cached) {
      logger.debug('News cache hit', { query });
      const articles = cached.articles;
      if (user) return rankArticles(articles, user);
      return articles;
    }
  } catch (error) {
    logFirestoreDegraded('News cache read failed — fetching fresh', error, { query });
  }

  const results = await Promise.allSettled([
    fetchGoogleNewsRss(query),
    fetchGNews(query),
    fetchNewsApi(query),
  ]);

  const allArticles: NewsArticle[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') allArticles.push(...result.value);
  }

  const deduped = deduplicateArticles(allArticles);

  try {
    await newsCacheRepository.setCache(query, deduped);
  } catch (error) {
    logFirestoreDegraded('News cache write failed — continuing without cache', error, { query });
  }

  if (user) return rankArticles(deduped, user);

  return deduped.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function fetchPersonalizedFeed(user: UserProfile): Promise<NewsArticle[]> {
  let trendingNames: string[] = [];
  try {
    const trending = await trendingTopicsRepository.getTop(10);
    trendingNames = trending.map((t) => t.topic);
  } catch (error) {
    logFirestoreDegraded('Trending topics unavailable — using interests only', error);
  }

  const queries = [
    ...user.interests.slice(0, 5),
    ...user.customInterests.slice(0, 3),
    user.profession,
    ...trendingNames.slice(0, 2),
  ].filter(Boolean);

  const results = await Promise.all(
    queries.map((q) => fetchNewsFromAllProviders(q, user))
  );

  const allArticles = results.flat();
  return deduplicateArticles(allArticles).slice(0, 50);
}

export async function fetchTrendingNews(): Promise<NewsArticle[]> {
  return fetchNewsFromAllProviders('trending news today');
}

export async function checkNewsProvidersHealth(): Promise<Record<NewsProvider, boolean>> {
  const [google, gnews, newsapi] = await Promise.all([
    fetchGoogleNewsRss('technology').then((r) => r.length > 0).catch(() => false),
    config.news.gnewsApiKey
      ? fetchGNews('technology').then((r) => r.length > 0).catch(() => false)
      : Promise.resolve(false),
    config.news.newsApiKey
      ? fetchNewsApi('technology').then((r) => r.length > 0).catch(() => false)
      : Promise.resolve(false),
  ]);

  return {
    'google-news-rss': google,
    gnews,
    newsapi,
    rss: google,
  };
}
