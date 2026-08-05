import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import {
  bookmarkRepository,
  readingHistoryRepository,
  notificationRepository,
  dailyDigestRepository,
} from '../repositories/index.js';
import { parsePagination, buildCursorResponse, DEFAULT_PAGE_SIZE } from '../utils/pagination.js';

export class BookmarkController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const { limit = DEFAULT_PAGE_SIZE } = parsePagination(req.query as Record<string, unknown>);
    const bookmarks = await bookmarkRepository.getUserBookmarks(req.uid, limit + 1);
    sendSuccess(res, buildCursorResponse(bookmarks, limit));
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid || !req.body.article) throw new ValidationError('Invalid request');
    const existing = await bookmarkRepository.findByUserAndArticle(req.uid, req.body.article.id);
    if (existing) {
      sendSuccess(res, existing);
      return;
    }
    const id = await bookmarkRepository.create({
      userId: req.uid,
      articleId: req.body.article.id,
      article: req.body.article,
      folderId: req.body.folderId,
      tags: req.body.tags ?? [],
      createdAt: new Date().toISOString(),
    });
    sendSuccess(res, { id, userId: req.uid, article: req.body.article }, 201);
  }

  async remove(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const doc = await bookmarkRepository.findById(String(req.params.id));
    if (!doc || doc.userId !== req.uid) throw new ValidationError('Not found');
    await bookmarkRepository.delete(String(req.params.id));
    sendSuccess(res, { deleted: true });
  }
}

export class ReadingHistoryController {
  async record(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid || !req.body.article) throw new ValidationError('Invalid request');
    await readingHistoryRepository.create({
      userId: req.uid,
      articleId: req.body.article.id,
      article: req.body.article,
      readAt: new Date().toISOString(),
      readDurationSeconds: req.body.readDurationSeconds ?? 0,
      completed: req.body.completed ?? false,
    });
    sendSuccess(res, { recorded: true });
  }

  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const { limit = DEFAULT_PAGE_SIZE } = parsePagination(req.query as Record<string, unknown>);
    const history = await readingHistoryRepository.getUserHistory(req.uid, limit + 1);
    sendSuccess(res, buildCursorResponse(history, limit));
  }

  async getContinueReading(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const items = await readingHistoryRepository.getIncomplete(req.uid);
    sendSuccess(res, items);
  }

  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const history = await readingHistoryRepository.getUserHistory(req.uid, 500);
    const totalReadTime = history.reduce((sum, e) => sum + (e.readDurationSeconds ?? 0), 0);
    const completed = history.filter((e) => e.completed).length;
    sendSuccess(res, {
      totalArticlesRead: history.length,
      totalReadTimeSeconds: totalReadTime,
      completionRate: history.length ? completed / history.length : 0,
      readingStreak: 0,
      favoriteCategories: [],
    });
  }
}

export class NotificationController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const notifications = await notificationRepository.getUserNotifications(req.uid);
    const unreadCount = await notificationRepository.getUnreadCount(req.uid);
    sendSuccess(res, { notifications, unreadCount });
  }

  async markRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const notification = await notificationRepository.findById(String(req.params.id));
    if (!notification || notification.userId !== req.uid) {
      throw new ValidationError('Not found');
    }
    await notificationRepository.markAsRead(String(req.params.id));
    sendSuccess(res, { read: true });
  }
}

export class DigestController {
  async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const digests = await dailyDigestRepository.getUserDigests(req.uid);
    sendSuccess(res, digests);
  }

  async getToday(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const timezone = req.user?.timezone ?? 'UTC';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    const digest = await dailyDigestRepository.getTodayDigest(req.uid, today);
    sendSuccess(res, digest);
  }
}

export const bookmarkController = new BookmarkController();
export const readingHistoryController = new ReadingHistoryController();
export const notificationController = new NotificationController();
export const digestController = new DigestController();
