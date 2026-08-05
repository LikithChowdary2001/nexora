import { describe, it, expect } from 'vitest';
import {
  getGreeting,
  getGreetingText,
  recommendInterests,
  generateArticleId,
  estimateReadingTime,
} from '../constants.js';

describe('getGreeting', () => {
  it('returns morning for 5-11', () => {
    expect(getGreeting(8)).toBe('morning');
  });
  it('returns afternoon for 12-16', () => {
    expect(getGreeting(14)).toBe('afternoon');
  });
  it('returns evening for 17-20', () => {
    expect(getGreeting(18)).toBe('evening');
  });
  it('returns night for 21-4', () => {
    expect(getGreeting(23)).toBe('night');
  });
});

describe('getGreetingText', () => {
  it('includes first name', () => {
    const text = getGreetingText('morning', 'Alice');
    expect(text).toContain('Alice');
  });
});

describe('recommendInterests', () => {
  it('returns up to 10 interests', () => {
    const interests = recommendInterests(25, 'Software Engineer', 'United States');
    expect(interests.length).toBeLessThanOrEqual(10);
    expect(interests.length).toBeGreaterThan(0);
  });
});

describe('generateArticleId', () => {
  it('generates consistent ids', () => {
    const id1 = generateArticleId('https://example.com/article');
    const id2 = generateArticleId('https://example.com/article');
    expect(id1).toBe(id2);
  });
});

describe('estimateReadingTime', () => {
  it('returns at least 1 minute', () => {
    expect(estimateReadingTime('hello')).toBe(1);
  });
});
