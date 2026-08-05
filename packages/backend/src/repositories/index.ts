import type { EnhancedBookmark, ReadingHistoryEntry, SearchHistoryEntry, Notification, DailyDigest, ErrorLog, TrendingTopic } from '@nexora/shared';
import { BaseRepository } from './base.repository.js';
import { Collections } from '../firebase/index.js';

export class BookmarkRepository extends BaseRepository<EnhancedBookmark> {
  protected collectionName = Collections.BOOKMARKS;

  async getUserBookmarks(userId: string, limit = 50): Promise<EnhancedBookmark[]> {
    return this.findWhere('userId', '==', userId, limit, { field: 'createdAt', direction: 'desc' });
  }

  async findByUserAndArticle(userId: string, articleId: string): Promise<(EnhancedBookmark & { id: string }) | null> {
    const results = await this.findWhere('userId', '==', userId, 1);
    return results.find((b) => b.articleId === articleId) ?? null;
  }
}

export class ReadingHistoryRepository extends BaseRepository<ReadingHistoryEntry> {
  protected collectionName = Collections.READING_HISTORY;

  async getUserHistory(userId: string, limit = 50): Promise<ReadingHistoryEntry[]> {
    return this.findWhere('userId', '==', userId, limit, { field: 'readAt', direction: 'desc' });
  }

  async getIncomplete(userId: string, limit = 10): Promise<ReadingHistoryEntry[]> {
    const all = await this.findWhere('userId', '==', userId, limit * 2, { field: 'readAt', direction: 'desc' });
    return all.filter((e) => !e.completed).slice(0, limit);
  }
}

export class SearchHistoryRepository extends BaseRepository<SearchHistoryEntry> {
  protected collectionName = Collections.SEARCH_HISTORY;

  async getUserHistory(userId: string, limit = 20): Promise<SearchHistoryEntry[]> {
    return this.findWhere('userId', '==', userId, limit, { field: 'searchedAt', direction: 'desc' });
  }
}

export class NotificationRepository extends BaseRepository<Notification> {
  protected collectionName = Collections.NOTIFICATIONS;

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return this.findWhere('userId', '==', userId, limit, { field: 'createdAt', direction: 'desc' });
  }

  async markAsRead(id: string): Promise<void> {
    await this.update(id, { read: true } as Partial<Notification>);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const snapshot = await this.col()
      .where('userId', '==', userId)
      .where('read', '==', false)
      .count()
      .get();
    return snapshot.data().count;
  }
}

export class DailyDigestRepository extends BaseRepository<DailyDigest> {
  protected collectionName = Collections.DAILY_DIGEST;

  async getUserDigests(userId: string, limit = 30): Promise<DailyDigest[]> {
    return this.findWhere('userId', '==', userId, limit, { field: 'date', direction: 'desc' });
  }

  async getTodayDigest(userId: string, date: string): Promise<DailyDigest | null> {
    const results = await this.findWhere('userId', '==', userId, 1);
    return results.find((d) => d.date === date) ?? null;
  }
}

export class ErrorLogRepository extends BaseRepository<ErrorLog> {
  protected collectionName = Collections.ERROR_LOGS;

  async logError(error: Omit<ErrorLog, 'id'>): Promise<void> {
    await this.create(error as Omit<ErrorLog, 'id'>);
  }

  async getRecent(limit = 100): Promise<ErrorLog[]> {
    const snapshot = await this.col().orderBy('timestamp', 'desc').limit(limit).get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ErrorLog);
  }
}

export class TrendingTopicsRepository extends BaseRepository<TrendingTopic> {
  protected collectionName = Collections.TRENDING_TOPICS;

  async getTop(limit = 20): Promise<TrendingTopic[]> {
    const snapshot = await this.col().orderBy('score', 'desc').limit(limit).get();
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TrendingTopic);
  }

  async upsertTopic(topic: string, score: number, articleCount: number): Promise<void> {
    const id = topic.toLowerCase().replace(/\s+/g, '_');
    await this.createWithId(id, {
      id,
      topic,
      score,
      articleCount,
      updatedAt: new Date().toISOString(),
    });
  }
}

export const bookmarkRepository = new BookmarkRepository();
export const readingHistoryRepository = new ReadingHistoryRepository();
export const searchHistoryRepository = new SearchHistoryRepository();
export const notificationRepository = new NotificationRepository();
export const dailyDigestRepository = new DailyDigestRepository();
export const errorLogRepository = new ErrorLogRepository();
export const trendingTopicsRepository = new TrendingTopicsRepository();
