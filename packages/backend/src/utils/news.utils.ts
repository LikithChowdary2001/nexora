import { generateArticleId, type NewsArticle } from '@nexora/shared';

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeTitle(a).split(' '));
  const wordsB = new Set(normalizeTitle(b).split(' '));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

export function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const seen = new Map<string, NewsArticle>();
  const urlSet = new Set<string>();

  for (const article of articles) {
    const urlKey = normalizeUrl(article.url);
    if (urlSet.has(urlKey)) continue;

    let isDuplicate = false;
    for (const [, existing] of seen) {
      const similarity = titleSimilarity(article.title, existing.title);
      const sameSource = article.source === existing.source;
      const timeDiff = Math.abs(
        new Date(article.publishedAt).getTime() - new Date(existing.publishedAt).getTime()
      );
      const withinHour = timeDiff < 3600000;

      if (similarity > 0.7 || (similarity > 0.5 && sameSource) || (similarity > 0.6 && withinHour)) {
        isDuplicate = true;
        if ((article.relevanceScore ?? 0) > (existing.relevanceScore ?? 0)) {
          seen.delete(normalizeTitle(existing.title));
          seen.set(normalizeTitle(article.title), article);
          urlSet.add(urlKey);
        }
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(normalizeTitle(article.title), article);
      urlSet.add(urlKey);
    }
  }

  return Array.from(seen.values());
}

export function normalizeArticle(raw: Partial<NewsArticle> & { title: string; url: string }): NewsArticle {
  return {
    id: raw.id ?? generateArticleId(raw.url),
    title: raw.title.trim(),
    description: (raw.description ?? '').trim(),
    url: raw.url,
    imageUrl: raw.imageUrl,
    source: raw.source ?? 'Unknown',
    sourceUrl: raw.sourceUrl,
    publishedAt: raw.publishedAt ?? new Date().toISOString(),
    author: raw.author,
    category: raw.category,
    readingTimeMinutes: raw.readingTimeMinutes ?? 3,
    aiSummary: raw.aiSummary,
    relevanceScore: raw.relevanceScore,
    provider: raw.provider ?? 'google-news-rss',
    content: raw.content,
  };
}
