import type { DailyDigest, UserProfile, AnalyticsSnapshot, SystemHealth } from '@nexora/shared';
import { config } from '../config/index.js';
import { getFirestore, getMessaging, Collections } from '../firebase/index.js';
import {
  dailyDigestRepository,
  notificationRepository,
  trendingTopicsRepository,
} from '../repositories/index.js';
import { newsCacheRepository } from '../repositories/newsCache.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { fetchNewsFromAllProviders, fetchTrendingNews } from './news.service.js';
import { generateBriefing, checkOpenAIHealth } from './ai.service.js';
import { checkNewsProvidersHealth } from './news.service.js';
import { sendDailyDigestEmail } from './email.service.js';
import { logger } from '../utils/logger.js';

function getUserLocalHour(timezone: string): number {
  try {
    const local = new Date().toLocaleString('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(local, 10);
  } catch {
    return new Date().getUTCHours();
  }
}

function getUserLocalDate(timezone: string): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  if (hour >= 17 && hour < 21) return 'Good Evening';
  return 'Good Night';
}

export async function runDailyDigestJob(): Promise<{ processed: number; sent: number }> {
  const db = getFirestore();
  const usersSnap = await db.collection(Collections.USERS)
    .where('onboardingCompleted', '==', true)
    .get();

  let processed = 0;
  let sent = 0;

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data() as UserProfile;
    const timezone = userData.timezone || 'UTC';
    const localHour = getUserLocalHour(timezone);

    if (localHour !== 9) continue;

    const prefs = await userRepository.getPreferences(userDoc.id);
    if (prefs && !prefs.emailDigestEnabled && !prefs.pushNotificationsEnabled) continue;

    const today = getUserLocalDate(timezone);
    const exists = await dailyDigestRepository.existsForUserDate(userDoc.id, today);
    if (exists) continue;

    processed++;

    const articles = await fetchNewsFromAllProviders(
      userData.interests.slice(0, 3).join(' OR ') || 'latest news',
      userData
    );

    let executiveSummary = `Your personalized briefing for ${today} based on your interests in ${(userData.interests || []).slice(0, 3).join(', ')}.`;
    let aiInsights = ['Stay informed with AI-curated news tailored to your profile.'];
    let topStories = articles.slice(0, 5);

    if (config.openai.apiKey) {
      try {
        const briefing = await generateBriefing(articles, userData, userData.language || 'en');
        executiveSummary = briefing.executiveSummary;
        aiInsights = briefing.keyTakeaways.length ? briefing.keyTakeaways : aiInsights;
      } catch (error) {
        logger.warn('Digest briefing generation failed', { userId: userDoc.id, error });
      }
    }

    const digestData: Omit<DailyDigest, 'id'> = {
      userId: userDoc.id,
      date: today,
      executiveSummary,
      topStories,
      personalizedNews: articles.slice(0, 10),
      aiInsights,
      trendingTopics: (userData.interests || []).slice(0, 5),
      deliveryMethod: 'both',
      sentAt: new Date().toISOString(),
    };

    const digestId = await dailyDigestRepository.create(digestData);
    const digest: DailyDigest = { id: digestId, ...digestData };

    const emailEnabled = prefs?.emailDigestEnabled !== false;
    const pushEnabled = prefs?.pushNotificationsEnabled !== false;

    if (emailEnabled) {
      const emailed = await sendDailyDigestEmail(userData, digest);
      if (emailed) sent++;
    }

    if (pushEnabled && userData.fcmToken) {
      try {
        await getMessaging().send({
          token: userData.fcmToken,
          notification: {
            title: `${getGreeting(localHour)} — Your Digest is Ready`,
            body: executiveSummary.substring(0, 100),
          },
          data: { type: 'digest', date: today },
        });
        if (!emailEnabled) sent++;
      } catch (error) {
        logger.warn('FCM digest push failed', { userId: userDoc.id, error });
      }
    }

    await notificationRepository.create({
      userId: userDoc.id,
      title: 'Daily Digest Ready',
      body: 'Your personalized news digest is available.',
      type: 'digest',
      read: false,
      createdAt: new Date().toISOString(),
    });
  }

  return { processed, sent };
}

export async function runSyncAnalyticsJob(): Promise<AnalyticsSnapshot> {
  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0];

  const [usersSnap, searchesSnap, readingSnap] = await Promise.all([
    db.collection(Collections.USERS).get(),
    db.collection(Collections.SEARCH_HISTORY).orderBy('searchedAt', 'desc').limit(500).get(),
    db.collection(Collections.READING_HISTORY).orderBy('readAt', 'desc').limit(500).get(),
  ]);

  const interestCounts = new Map<string, number>();
  usersSnap.docs.forEach((doc) => {
    const interests = (doc.data().interests as string[]) ?? [];
    interests.forEach((i) => interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1));
  });

  const searchCounts = new Map<string, number>();
  searchesSnap.docs.forEach((doc) => {
    const query = doc.data().query as string;
    if (query) searchCounts.set(query, (searchCounts.get(query) ?? 0) + 1);
  });

  const snapshot: AnalyticsSnapshot = {
    id: today,
    date: today,
    totalUsers: usersSnap.size,
    activeUsers: usersSnap.size,
    totalSearches: searchesSnap.size,
    totalArticlesRead: readingSnap.size,
    popularInterests: [...interestCounts.entries()]
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    popularSearches: [...searchCounts.entries()]
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    aiUsageTokens: 0,
    errorCount: 0,
  };

  await db.collection(Collections.ANALYTICS).doc(today).set(snapshot);
  return snapshot;
}

export async function runRefreshTrendingTopicsJob(): Promise<number> {
  const articles = await fetchTrendingNews();
  const topicScores = new Map<string, { score: number; count: number }>();

  const defaults = [
    { topic: 'Artificial Intelligence', score: 95 },
    { topic: 'Technology', score: 88 },
    { topic: 'Finance', score: 75 },
    { topic: 'Climate', score: 70 },
    { topic: 'Space', score: 65 },
  ];

  for (const d of defaults) {
    topicScores.set(d.topic, { score: d.score, count: 0 });
  }

  for (const article of articles.slice(0, 30)) {
    for (const interest of defaults) {
      if (article.title.toLowerCase().includes(interest.topic.toLowerCase().split(' ')[0])) {
        const current = topicScores.get(interest.topic)!;
        current.count += 1;
        current.score = Math.min(100, current.score + 1);
      }
    }
  }

  let updated = 0;
  for (const [topic, { score, count }] of topicScores) {
    await trendingTopicsRepository.upsertTopic(topic, score, Math.max(count, 10));
    updated++;
  }

  return updated;
}

export async function runCleanupExpiredCacheJob(): Promise<number> {
  return newsCacheRepository.deleteExpired(500);
}

export async function runRecordSystemHealthJob(): Promise<SystemHealth> {
  const [openai, newsProviders] = await Promise.all([
    checkOpenAIHealth(),
    checkNewsProvidersHealth(),
  ]);

  let firestoreHealthy = false;
  try {
    await getFirestore().collection(Collections.USERS).limit(1).get();
    firestoreHealthy = true;
  } catch {
    firestoreHealthy = false;
  }

  const allProvidersUp = Object.values(newsProviders).some(Boolean);
  const health: SystemHealth = {
    status: firestoreHealthy && (openai || allProvidersUp) ? 'healthy' : 'degraded',
    uptime: process.uptime(),
    firestore: firestoreHealthy,
    openai,
    newsProviders,
    lastChecked: new Date().toISOString(),
  };

  await getFirestore().collection(Collections.SYSTEM_HEALTH).add({
    ...health,
    checks: { firestore: firestoreHealthy, openai, backend: true },
    timestamp: health.lastChecked,
  });

  return health;
}
