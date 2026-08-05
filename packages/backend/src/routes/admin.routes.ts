import { Router } from 'express';
import { authenticate, requireAdmin, type AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { getFirestore } from '../firebase/index.js';
import { checkOpenAIHealth } from '../services/ai.service.js';
import { checkNewsProvidersHealth } from '../services/news.service.js';
import { syncAnalyticsToSheets } from '../services/sheets.service.js';
import type { AnalyticsSnapshot, SystemHealth } from '@nexora/shared';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', async (_req, res) => {
  try {
    const snapshot = await getFirestore().collection('users').limit(100).get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: users });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

router.get('/analytics', async (_req, res) => {
  try {
    const db = getFirestore();

    const [usersSnap, searchesSnap, readingSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('searchHistory').orderBy('searchedAt', 'desc').limit(500).get(),
      db.collection('readingHistory').orderBy('readAt', 'desc').limit(500).get(),
    ]);

    const interestCounts = new Map<string, number>();
    usersSnap.docs.forEach((doc) => {
      const interests = doc.data().interests as string[] ?? [];
      interests.forEach((i) => interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1));
    });

    const searchCounts = new Map<string, number>();
    searchesSnap.docs.forEach((doc) => {
      const query = doc.data().query as string;
      searchCounts.set(query, (searchCounts.get(query) ?? 0) + 1);
    });

    const popularInterests = [...interestCounts.entries()]
      .map(([interest, count]) => ({ interest, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const popularSearches = [...searchCounts.entries()]
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const today = new Date().toISOString().split('T')[0];
    const analytics: AnalyticsSnapshot = {
      id: today,
      date: today,
      totalUsers: usersSnap.size,
      activeUsers: usersSnap.size,
      totalSearches: searchesSnap.size,
      totalArticlesRead: readingSnap.size,
      popularInterests,
      popularSearches,
      aiUsageTokens: 0,
      errorCount: 0,
    };

    res.json({ success: true, data: analytics });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

router.post('/analytics/sync', async (_req, res) => {
  try {
    const db = getFirestore();
    const usersSnap = await db.collection('users').get();
    const today = new Date().toISOString().split('T')[0];

    const snapshot: AnalyticsSnapshot = {
      id: today,
      date: today,
      totalUsers: usersSnap.size,
      activeUsers: usersSnap.size,
      totalSearches: 0,
      totalArticlesRead: 0,
      popularInterests: [],
      popularSearches: [],
      aiUsageTokens: 0,
      errorCount: 0,
    };

    await syncAnalyticsToSheets(snapshot);
    await db.collection('analytics').doc(today).set(snapshot);

    res.json({ success: true, message: 'Analytics synced' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to sync analytics' });
  }
});

router.get('/logs', async (_req, res) => {
  try {
    const snapshot = await getFirestore()
      .collection('adminLogs')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const logs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: logs });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

router.get('/health', async (_req, res) => {
  try {
    const [openai, newsProviders] = await Promise.all([
      checkOpenAIHealth(),
      checkNewsProvidersHealth(),
    ]);

    let firestoreHealthy = false;
    try {
      await getFirestore().collection('users').limit(1).get();
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

    res.json({ success: true, data: health });
  } catch {
    res.status(500).json({ success: false, error: 'Health check failed' });
  }
});

router.post('/notifications', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, title, body, type } = req.body;
    if (!userId || !title || !body) {
      res.status(400).json({ success: false, error: 'Missing fields' });
      return;
    }

    await getFirestore().collection('notifications').add({
      userId,
      title,
      body,
      type: type ?? 'system',
      read: false,
      createdAt: new Date().toISOString(),
    });

    if (req.uid) {
      await getFirestore().collection('adminLogs').add({
        action: 'send_notification',
        adminId: req.uid,
        targetId: userId,
        details: { title, body },
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

export default router;
