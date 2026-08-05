import type { CursorPaginatedResponse } from '@nexora/shared';

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const limit = Math.min(
    Math.max(parseInt(String(query.limit ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );
  const cursor = query.cursor ? String(query.cursor) : undefined;
  return { cursor, limit };
}

export function buildCursorResponse<T extends { id: string }>(
  items: T[],
  limit: number
): CursorPaginatedResponse<T> {
  const hasMore = items.length > limit;
  const pageItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id : undefined;

  return {
    items: pageItems,
    nextCursor,
    hasMore,
    pageSize: limit,
  };
}

export function sanitizeString(input: string, maxLength = 1000): string {
  return input.trim().slice(0, maxLength).replace(/<[^>]*>/g, '');
}
