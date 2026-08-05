import admin from 'firebase-admin';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

let initialized = false;

export async function verifyFirebaseAdmin(): Promise<boolean> {
  try {
    initializeFirebase();
    await getAuth().listUsers(1);
    return true;
  } catch (error) {
    logger.error('Firebase Admin verification failed', {
      message: error instanceof Error ? error.message : 'unknown',
      code: (error as { code?: string }).code,
      projectId: config.firebase.projectId,
    });
    return false;
  }
}

export function initializeFirebase(): admin.app.App {
  if (initialized && admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
      storageBucket: config.firebase.storageBucket || undefined,
    });
    logger.info('Firebase Admin initialized');
  } else if (config.isDev) {
    admin.initializeApp({ projectId: 'nexora-dev' });
    logger.warn('Firebase Admin initialized in dev mode without credentials');
  } else {
    throw new Error('Firebase credentials not configured');
  }

  initialized = true;
  return admin.apps[0]!;
}

export function getFirestore(): admin.firestore.Firestore {
  initializeFirebase();
  return admin.firestore();
}

export function getAuth(): admin.auth.Auth {
  initializeFirebase();
  return admin.auth();
}

export function getStorage(): admin.storage.Storage {
  initializeFirebase();
  return admin.storage();
}

export function getMessaging(): admin.messaging.Messaging {
  initializeFirebase();
  return admin.messaging();
}

export { admin };

export const Collections = {
  USERS: 'users',
  BOOKMARKS: 'bookmarks',
  PREFERENCES: 'preferences',
  READING_HISTORY: 'readingHistory',
  SEARCH_HISTORY: 'searchHistory',
  AI_CHATS: 'AIChats',
  DAILY_DIGEST: 'dailyDigest',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  NEWS_CACHE: 'NewsCache',
  TRENDING_TOPICS: 'TrendingTopics',
  ADMIN_LOGS: 'adminLogs',
  SYSTEM_HEALTH: 'SystemHealth',
  ERROR_LOGS: 'ErrorLogs',
} as const;
