import type { Request, Response, NextFunction } from 'express';
import { getAuth, getFirestore } from '../firebase/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { parseClientProfileHeader } from '../utils/client-profile.js';
import type { UserProfile } from '@nexora/shared';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  uid?: string;
}

async function loadProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  const userDoc = await getFirestore().collection('users').doc(uid).get();
  if (!userDoc.exists) return null;
  return userDoc.data() as UserProfile;
}

async function buildMinimalProfile(uid: string): Promise<UserProfile | null> {
  try {
    const authUser = await getAuth().getUser(uid);
    const now = new Date().toISOString();
    return {
      uid,
      email: authUser.email ?? '',
      firstName: '',
      lastName: '',
      age: 25,
      country: 'United States',
      language: 'en',
      profession: 'Other',
      interests: ['Technology', 'World News'],
      customInterests: [],
      role: 'user',
      emailVerified: authUser.emailVerified,
      onboardingCompleted: true,
      timezone: 'UTC',
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
    };
  } catch {
    return null;
  }
}

/** Load req.user from Firestore when the token is valid but profile was not attached yet. */
export async function resolveUserProfile(req: AuthenticatedRequest): Promise<UserProfile | null> {
  if (req.user) return req.user;
  if (!req.uid) return null;

  const clientProfile = parseClientProfileHeader(req);
  if (clientProfile) {
    req.user = clientProfile;
    return clientProfile;
  }

  try {
    const profile = await loadProfileFromFirestore(req.uid);
    if (profile) {
      req.user = profile;
      return profile;
    }
  } catch (error) {
    logger.warn('Failed to resolve user profile from Firestore', {
      uid: req.uid,
      message: error instanceof Error ? error.message : 'unknown',
      code: (error as { code?: string | number }).code,
      projectId: config.firebase.projectId,
    });
  }

  const minimal = await buildMinimalProfile(req.uid);
  if (minimal) req.user = minimal;
  return minimal;
}

export async function requireProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const profile = await resolveUserProfile(req);
  if (!profile) {
    res.status(403).json({
      success: false,
      error: 'Profile not found. Please complete onboarding first.',
    });
    return;
  }
  next();
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await getAuth().verifyIdToken(token);
    req.uid = decoded.uid;

    try {
      req.user = (await loadProfileFromFirestore(decoded.uid)) ?? undefined;
    } catch (error) {
      logger.warn('Authenticated but Firestore profile lookup failed', {
        uid: decoded.uid,
        message: error instanceof Error ? error.message : 'unknown',
        code: (error as { code?: string | number }).code,
        projectId: config.firebase.projectId,
      });
    }

    if (!req.user) {
      const clientProfile = parseClientProfileHeader(req);
      if (clientProfile) req.user = clientProfile;
    }

    next();
  } catch (error) {
    logger.warn('Token verification failed', {
      message: error instanceof Error ? error.message : 'unknown',
      code: (error as { code?: string | number }).code,
      projectId: config.firebase.projectId,
    });
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
}

export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const profile = await resolveUserProfile(req);
  if (!profile) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const isAdmin =
    profile.role === 'admin' || profile.email === config.adminEmail;

  if (!isAdmin) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  next();
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  authenticate(req, res, next).catch(next);
}
