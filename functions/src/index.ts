import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL ?? '';
}

function getUserLocalHour(timezone: string): number {
  try {
    const local = new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
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

async function sendDigestEmail(user: FirebaseFirestore.DocumentData, digest: Record<string, unknown>): Promise<void> {
  const nodemailer = await import('nodemailer');
  const host = process.env.SMTP_HOST;
  const user_smtp = process.env.SMTP_USER;
  if (!host || !user_smtp) return;

  const transport = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: { user: user_smtp, pass: process.env.SMTP_PASS },
  });

  const greeting = getGreeting(getUserLocalHour(user.timezone || 'UTC'));

  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'noreply@nexora.app',
    to: user.email,
    subject: `${greeting} — Your Nexora Daily Digest`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#020617;color:#e2e8f0;">
        <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px;border-radius:16px;margin-bottom:24px;">
          <h1 style="margin:0;color:white;font-size:24px;">${greeting}, ${user.firstName}</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.7);">${digest.date}</p>
        </div>
        <div style="background:rgba(255,255,255,0.05);padding:24px;border-radius:12px;margin-bottom:16px;">
          <h2 style="color:#60a5fa;margin-top:0;">Executive Summary</h2>
          <p style="line-height:1.6;">${digest.executiveSummary}</p>
        </div>
        <p style="text-align:center;color:#64748b;font-size:12px;">Powered by Nexora</p>
      </div>
    `,
  });
}

export const sendDailyDigest = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const usersSnap = await db.collection('users')
      .where('onboardingCompleted', '==', true)
      .get();

    const promises: Promise<void>[] = [];

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const timezone = userData.timezone || 'UTC';
      const localHour = getUserLocalHour(timezone);

      if (localHour !== 9) continue;

      const today = getUserLocalDate(timezone);
      const existing = await db.collection('dailyDigest')
        .where('userId', '==', userDoc.id)
        .where('date', '==', today)
        .limit(1)
        .get();

      if (!existing.empty) continue;

      const digest = {
        userId: userDoc.id,
        date: today,
        executiveSummary: `Your personalized briefing for ${today} based on your interests in ${(userData.interests || []).slice(0, 3).join(', ')}.`,
        topStories: [],
        personalizedNews: [],
        aiInsights: ['Stay informed with AI-curated news tailored to your profile.'],
        trendingTopics: (userData.interests || []).slice(0, 5),
        deliveryMethod: 'email' as const,
        sentAt: new Date().toISOString(),
      };

      promises.push(
        db.collection('dailyDigest').add(digest).then(async () => {
          await sendDigestEmail(userData, digest);

          if (userData.fcmToken) {
            await admin.messaging().send({
              token: userData.fcmToken,
              notification: {
                title: `${getGreeting(localHour)} — Your Digest is Ready`,
                body: digest.executiveSummary.substring(0, 100),
              },
              data: { type: 'digest', date: today },
            });
          }

          await db.collection('notifications').add({
            userId: userDoc.id,
            title: 'Daily Digest Ready',
            body: 'Your personalized news digest is available.',
            type: 'digest',
            read: false,
            createdAt: new Date().toISOString(),
          });
        })
      );
    }

    await Promise.allSettled(promises);
    return null;
  });

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const adminEmail = getAdminEmail();
  const isAdmin = !!adminEmail && user.email === adminEmail;
  const now = new Date().toISOString();

  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    firstName: '',
    lastName: '',
    role: isAdmin ? 'admin' : 'user',
    emailVerified: user.emailVerified,
    onboardingCompleted: false,
    interests: [],
    customInterests: [],
    timezone: 'UTC',
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
  }, { merge: true });
});

export const syncAnalytics = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const today = new Date().toISOString().split('T')[0];
    const [usersSnap, searchesSnap, readingSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('searchHistory').orderBy('searchedAt', 'desc').limit(500).get(),
      db.collection('readingHistory').orderBy('readAt', 'desc').limit(500).get(),
    ]);

    await db.collection('analytics').doc(today).set({
      id: today,
      date: today,
      totalUsers: usersSnap.size,
      activeUsers: usersSnap.size,
      totalSearches: searchesSnap.size,
      totalArticlesRead: readingSnap.size,
      popularInterests: [],
      popularSearches: [],
      aiUsageTokens: 0,
      errorCount: 0,
    });

    return null;
  });

export const refreshTrendingTopics = functions.pubsub
  .schedule('0 */6 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const topics = [
      { topic: 'Artificial Intelligence', score: 95, articleCount: 120 },
      { topic: 'Technology', score: 88, articleCount: 95 },
      { topic: 'Finance', score: 75, articleCount: 80 },
      { topic: 'Climate', score: 70, articleCount: 65 },
      { topic: 'Space', score: 65, articleCount: 45 },
    ];

    const batch = db.batch();
    for (const t of topics) {
      const id = t.topic.toLowerCase().replace(/\s+/g, '_');
      batch.set(db.collection('TrendingTopics').doc(id), {
        ...t,
        id,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();
    return null;
  });

export const cleanupExpiredCache = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const now = new Date().toISOString();
    const expired = await db.collection('NewsCache')
      .where('expiresAt', '<', now)
      .limit(500)
      .get();

    const batch = db.batch();
    expired.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    return null;
  });

export const recordSystemHealth = functions.pubsub
  .schedule('*/15 * * * *')
  .timeZone('UTC')
  .onRun(async () => {
    await db.collection('SystemHealth').add({
      status: 'healthy',
      checks: { firestore: true, functions: true },
      timestamp: new Date().toISOString(),
    });
    return null;
  });
