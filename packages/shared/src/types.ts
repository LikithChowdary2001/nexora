export type UserRole = 'user' | 'admin';

export type SupportedLanguage =
  | 'en'
  | 'es'
  | 'hi'
  | 'te'
  | 'fr'
  | 'de'
  | 'ja'
  | 'zh';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  country: string;
  language: SupportedLanguage;
  profession: string;
  interests: string[];
  customInterests: string[];
  role: UserRole;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  avatarUrl?: string;
  timezone?: string;
  fcmToken?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: ThemeMode;
  language: SupportedLanguage;
  notificationsEnabled: boolean;
  emailDigestEnabled: boolean;
  pushNotificationsEnabled: boolean;
  digestTime: string;
  updatedAt: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  imageUrl?: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  author?: string;
  category?: string;
  readingTimeMinutes: number;
  aiSummary?: string;
  relevanceScore?: number;
  provider: NewsProvider;
}

export type NewsProvider = 'google-news-rss' | 'gnews' | 'newsapi' | 'rss';

export interface AIBriefing {
  executiveSummary: string;
  topHeadlines: string[];
  keyTakeaways: string[];
  relatedTopics: string[];
  suggestedReading: string[];
  generatedAt: string;
  language: SupportedLanguage;
}

export interface SearchResult {
  query: string;
  summary: string;
  articles: NewsArticle[];
  relatedSearches: string[];
  searchedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  articleId: string;
  article: NewsArticle;
  createdAt: string;
}

export interface ReadingHistoryEntry {
  id: string;
  userId: string;
  articleId: string;
  article: NewsArticle;
  readAt: string;
  readDurationSeconds?: number;
  completed: boolean;
}

export interface SearchHistoryEntry {
  id: string;
  userId: string;
  query: string;
  resultCount: number;
  searchedAt: string;
}

export interface DailyDigest {
  id: string;
  userId: string;
  date: string;
  executiveSummary: string;
  topStories: NewsArticle[];
  personalizedNews: NewsArticle[];
  aiInsights: string[];
  trendingTopics: string[];
  sentAt?: string;
  deliveryMethod: 'email' | 'push' | 'both';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'digest' | 'breaking' | 'system' | 'recommendation';
  read: boolean;
  data?: Record<string, string>;
  createdAt: string;
}

export interface AdminLog {
  id: string;
  action: string;
  adminId: string;
  targetId?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface AnalyticsSnapshot {
  id: string;
  date: string;
  totalUsers: number;
  activeUsers: number;
  totalSearches: number;
  totalArticlesRead: number;
  popularInterests: Array<{ interest: string; count: number }>;
  popularSearches: Array<{ query: string; count: number }>;
  aiUsageTokens: number;
  errorCount: number;
}

export interface PersonalizationWeights {
  interests: number;
  profession: number;
  age: number;
  country: number;
  readingHistory: number;
  trendingTopics: number;
}

export const DEFAULT_PERSONALIZATION_WEIGHTS: PersonalizationWeights = {
  interests: 0.4,
  profession: 0.2,
  age: 0.15,
  country: 0.1,
  readingHistory: 0.1,
  trendingTopics: 0.05,
};

export const INTEREST_CATEGORIES = [
  'Technology',
  'Artificial Intelligence',
  'Programming',
  'Finance',
  'Business',
  'Healthcare',
  'Education',
  'Cybersecurity',
  'Gaming',
  'Sports',
  'Movies',
  'Science',
  'Travel',
  'Automotive',
  'Music',
  'Space',
  'World News',
  'Politics',
  'Food',
  'Lifestyle',
] as const;

export type InterestCategory = (typeof INTEREST_CATEGORIES)[number];

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  articleContext?: NewsArticle[];
}

export interface AIAssistantRequest {
  message: string;
  articleIds?: string[];
  language: SupportedLanguage;
}

export interface AIAssistantResponse {
  message: string;
  sources?: NewsArticle[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface OnboardingData {
  firstName: string;
  lastName: string;
  age: number;
  country: string;
  language: SupportedLanguage;
  profession: string;
  interests: string[];
  customInterests: string[];
}

export interface GreetingInfo {
  greeting: string;
  firstName: string;
  date: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  firestore: boolean;
  openai: boolean;
  newsProviders: Record<NewsProvider, boolean>;
  lastChecked: string;
}

export interface AIChatSession {
  id: string;
  userId: string;
  title: string;
  messages: AIAssistantMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface NewsCacheEntry {
  id: string;
  query: string;
  articles: NewsArticle[];
  aiSummary?: string;
  cachedAt: string;
  expiresAt: string;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  score: number;
  articleCount: number;
  updatedAt: string;
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warn';
  message: string;
  stack?: string;
  path?: string;
  userId?: string;
  timestamp: string;
}

export interface SystemHealthRecord {
  id: string;
  status: 'healthy' | 'degraded' | 'down';
  checks: Record<string, boolean>;
  timestamp: string;
}

export interface BookmarkFolder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface EnhancedBookmark extends Bookmark {
  folderId?: string;
  tags?: string[];
}

export interface ReadingStats {
  totalArticlesRead: number;
  totalReadTimeSeconds: number;
  completionRate: number;
  readingStreak: number;
  favoriteCategories: Array<{ category: string; count: number }>;
}

export interface AISummaryResult {
  executiveSummary: string;
  bulletSummary: string[];
  keyTakeaways: string[];
  trendingTopics: string[];
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  relatedCompanies: string[];
  relatedPeople: string[];
  relatedTechnologies: string[];
  suggestedSearches: string[];
}

export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  pageSize: number;
}
