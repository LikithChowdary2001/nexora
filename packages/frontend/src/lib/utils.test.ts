import { describe, it, expect } from 'vitest';
import { cn, formatDate, getLocalGreeting } from './utils';

describe('cn', () => {
  it('merges tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatDate', () => {
  it('formats ISO strings', () => {
    const formatted = formatDate('2026-01-15T12:00:00.000Z', 'en-US');
    expect(formatted).toContain('2026');
  });
});

describe('getLocalGreeting', () => {
  it('includes first name', () => {
    const { greeting } = getLocalGreeting('Alex');
    expect(greeting).toContain('Alex');
  });

  it('returns a valid time of day', () => {
    const { timeOfDay } = getLocalGreeting('Alex');
    expect(['morning', 'afternoon', 'evening', 'night']).toContain(timeOfDay);
  });
});
