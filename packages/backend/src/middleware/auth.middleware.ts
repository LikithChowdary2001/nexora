import type { Request, Response, NextFunction } from 'express';
import { getAuth, getFirestore } from '../firebase/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import type { UserProfile } from '@nexora/shared';

export interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  uid?: string;
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

    const userDoc = await getFirestore().collection('users').doc(decoded.uid).get();
    if (userDoc.exists) {
      req.user = userDoc.data() as UserProfile;
    }

    next();
  } catch (error) {
    logger.warn('Token verification failed', {
      message: error instanceof Error ? error.message : 'unknown',
      code: (error as { code?: string }).code,
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
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  const isAdmin =
    req.user.role === 'admin' || req.user.email === config.adminEmail;

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
