import type { NewsArticle, NewsCacheEntry } from '@nexora/shared';
import { BaseRepository } from './base.repository.js';
import { Collections } from '../firebase/index.js';
import { generateArticleId } from '@nexora/shared';

export class NewsCacheRepository extends BaseRepository<NewsCacheEntry> {
  protected collectionName = Collections.NEWS_CACHE;

  async getByQuery(query: string): Promise<NewsCacheEntry | null> {
    const cacheKey = generateArticleId(query.toLowerCase().trim());
    return this.findById(cacheKey);
  }

  async setCache(query: string, articles: NewsArticle[], aiSummary?: string, ttlMinutes = 30): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
    const cacheKey = generateArticleId(query.toLowerCase().trim());

    await this.createWithId(cacheKey, {
      id: cacheKey,
      query,
      articles,
      aiSummary,
      cachedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  }

  async getValidCache(query: string): Promise<NewsCacheEntry | null> {
    const entry = await this.getByQuery(query);
    if (!entry) return null;
    if (new Date(entry.expiresAt) < new Date()) {
      await this.delete(entry.id);
      return null;
    }
    return entry;
  }

  async getArticleSummary(articleId: string, language: string): Promise<string | null> {
    const doc = await this.col().doc(`summary_${articleId}_${language}`).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (data?.expiresAt && new Date(data.expiresAt) < new Date()) return null;
    return data?.summary ?? null;
  }

  async setArticleSummary(articleId: string, language: string, summary: string, ttlHours = 24): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    await this.col().doc(`summary_${articleId}_${language}`).set({
      summary,
      expiresAt: expiresAt.toISOString(),
      cachedAt: new Date().toISOString(),
    });
  }
}

export const newsCacheRepository = new NewsCacheRepository();
