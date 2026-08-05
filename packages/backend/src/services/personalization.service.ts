import {
  DEFAULT_PERSONALIZATION_WEIGHTS,
  recommendInterests,
  type UserProfile,
  type NewsArticle,
  type ReadingHistoryEntry,
} from '@nexora/shared';

export class PersonalizationService {
  rankArticles(
    articles: NewsArticle[],
    user: UserProfile,
    trendingTopics: string[] = [],
    readingHistory: ReadingHistoryEntry[] = []
  ): NewsArticle[] {
    const weights = DEFAULT_PERSONALIZATION_WEIGHTS;
    const allInterests = [...user.interests, ...user.customInterests].map((i) => i.toLowerCase());

    const readCategories = new Map<string, number>();
    for (const entry of readingHistory) {
      const text = `${entry.article.title} ${entry.article.description}`.toLowerCase();
      for (const interest of allInterests) {
        if (text.includes(interest)) {
          readCategories.set(interest, (readCategories.get(interest) ?? 0) + 1);
        }
      }
    }

    return articles
      .map((article) => {
        let score = 0;
        const text = `${article.title} ${article.description} ${article.category ?? ''}`.toLowerCase();

        for (const interest of allInterests) {
          if (text.includes(interest)) score += weights.interests;
        }

        if (text.includes(user.profession.toLowerCase())) score += weights.profession;

        if (user.country && text.includes(user.country.toLowerCase())) score += weights.country;

        for (const topic of trendingTopics) {
          if (text.includes(topic.toLowerCase())) score += weights.trendingTopics;
        }

        const ageTerms = user.age < 30
          ? ['gaming', 'technology', 'startup', 'ai']
          : user.age < 50
          ? ['business', 'finance', 'politics', 'market']
          : ['health', 'retirement', 'politics', 'medicare'];

        for (const term of ageTerms) {
          if (text.includes(term)) score += weights.age;
        }

        for (const [category, count] of readCategories) {
          if (text.includes(category) && count > 2) {
            score += weights.readingHistory * Math.min(count / 10, 1);
          }
        }

        const hoursSince = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 1 - hoursSince / 48) * 0.1;

        const sourceReliability: Record<string, number> = {
          reuters: 0.05, bloomberg: 0.05, 'associated press': 0.05, bbc: 0.04,
        };
        for (const [source, bonus] of Object.entries(sourceReliability)) {
          if (article.source.toLowerCase().includes(source)) score += bonus;
        }

        return { ...article, relevanceScore: score };
      })
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));
  }

  recommendInterests(age: number, profession: string, country: string, language?: string): string[] {
    const base = recommendInterests(age, profession, country);

    const professionMap: Record<string, string[]> = {
      'Software Engineer': ['Cloud', 'DevOps', 'Open Source'],
      'Data Scientist': ['Machine Learning', 'Data Engineering'],
      'Healthcare': ['Medical Research', 'Public Health'],
      Student: ['Career', 'Internships'],
    };

    const extras = professionMap[profession] ?? [];
    const langBonus = language === 'hi' ? ['Cricket', 'Bollywood'] :
      language === 'ja' ? ['Anime', 'Robotics'] : [];

    return [...new Set([...base, ...extras, ...langBonus])].slice(0, 10);
  }
}

export const personalizationService = new PersonalizationService();
