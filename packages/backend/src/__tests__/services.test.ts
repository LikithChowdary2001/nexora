import { describe, it, expect } from 'vitest';
import { deduplicateArticles } from '../utils/news.utils.js';
import { personalizationService } from '../services/personalization.service.js';
import { parsePagination, buildCursorResponse, sanitizeString } from '../utils/pagination.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import type { NewsArticle, UserProfile } from '@nexora/shared';

const mockArticle = (title: string, url: string): NewsArticle => ({
  id: url, title, description: 'desc', url, source: 'Test', publishedAt: new Date().toISOString(),
  readingTimeMinutes: 3, provider: 'newsapi',
});

describe('deduplicateArticles', () => {
  it('removes duplicate titles', () => {
    const articles = [
      mockArticle('Same Title Here', 'https://a.com/1'),
      mockArticle('Same Title Here', 'https://b.com/2'),
    ];
    expect(deduplicateArticles(articles)).toHaveLength(1);
  });

  it('removes duplicate URLs', () => {
    const articles = [
      mockArticle('Title A', 'https://same.com/article'),
      mockArticle('Title B', 'https://same.com/article'),
    ];
    expect(deduplicateArticles(articles)).toHaveLength(1);
  });
});

describe('personalizationService', () => {
  const user: UserProfile = {
    uid: '1', email: 't@test.com', firstName: 'T', lastName: 'U', age: 30,
    country: 'United States', language: 'en', profession: 'Software Engineer',
    interests: ['Technology', 'AI'], customInterests: [], role: 'user',
    emailVerified: true, onboardingCompleted: true,
    createdAt: '', updatedAt: '',
  };

  it('ranks articles by relevance', () => {
    const articles = [
      mockArticle('Random Sports News', 'https://a.com'),
      mockArticle('AI Technology Breakthrough', 'https://b.com'),
    ];
    const ranked = personalizationService.rankArticles(articles, user);
    expect(ranked[0].title).toContain('AI');
  });

  it('recommends interests for profession', () => {
    const interests = personalizationService.recommendInterests(25, 'Software Engineer', 'United States');
    expect(interests.length).toBeLessThanOrEqual(10);
    expect(interests.length).toBeGreaterThan(0);
  });
});

describe('pagination', () => {
  it('parses limit from query', () => {
    expect(parsePagination({ limit: '10' }).limit).toBe(10);
  });

  it('caps max page size', () => {
    expect(parsePagination({ limit: '500' }).limit).toBe(100);
  });

  it('builds cursor response', () => {
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const result = buildCursorResponse(items, 2);
    expect(result.items).toHaveLength(2);
    expect(result.hasMore).toBe(true);
  });
});

describe('errors', () => {
  it('creates AppError with status code', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });

  it('creates ValidationError', () => {
    const err = new ValidationError('Invalid input');
    expect(err.statusCode).toBe(400);
  });
});

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert(1)</script>hello')).toBe('alert(1)hello');
  });
});
