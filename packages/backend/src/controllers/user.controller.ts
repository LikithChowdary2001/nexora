import type { Response } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { ValidationError, NotFoundError, ServiceUnavailableError, isFirestoreUnavailableError } from '../utils/errors.js';
import { sendSuccess } from '../utils/response.js';
import { userRepository } from '../repositories/user.repository.js';
import { config } from '../config/index.js';
import { getAuth } from '../firebase/index.js';
import { personalizationService } from '../services/personalization.service.js';
import type { OnboardingData, SupportedLanguage } from '@nexora/shared';

const onboardingSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  age: z.number().int().min(13).max(120),
  country: z.string().min(1),
  language: z.enum(['en', 'es', 'hi', 'te', 'fr', 'de', 'ja', 'zh']),
  profession: z.string().min(1),
  interests: z.array(z.string()).min(1).max(20),
  customInterests: z.array(z.string()).max(10).default([]),
  timezone: z.string().optional(),
});

export class UserController {
  async bootstrap(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');

    try {
      const existing = await userRepository.findByUid(req.uid);
      if (existing) {
        sendSuccess(res, existing);
        return;
      }

      const authUser = await getAuth().getUser(req.uid);
      const now = new Date().toISOString();
      const email = authUser.email ?? '';
      const isAdmin = !!config.adminEmail && email === config.adminEmail;

      const profile = await userRepository.upsert(req.uid, {
        uid: req.uid,
        email,
        firstName: '',
        lastName: '',
        age: 0,
        country: '',
        language: 'en',
        profession: '',
        role: isAdmin ? 'admin' : 'user',
        emailVerified: authUser.emailVerified,
        onboardingCompleted: false,
        interests: [],
        customInterests: [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        createdAt: now,
        lastLogin: now,
      });

      sendSuccess(res, profile, 201);
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        sendSuccess(res, {
          uid: req.uid,
          deferred: true,
          message: 'Firestore not ready — profile saved locally on device',
        });
        return;
      }
      throw error;
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');

    try {
      const profile = await userRepository.findByUid(req.uid);
      if (!profile) throw new NotFoundError('Profile not found');
      sendSuccess(res, profile);
    } catch (error) {
      if (isFirestoreUnavailableError(error)) {
        throw new ServiceUnavailableError(
          'Firestore is not enabled. Profile is available from local device cache.'
        );
      }
      throw error;
    }
  }

  async completeOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const data = onboardingSchema.parse(req.body) as OnboardingData & { timezone?: string };
    const now = new Date().toISOString();
    const email = req.user?.email ?? '';
    const isAdmin = email === config.adminEmail;

    const profile = await userRepository.upsert(req.uid, {
      ...data,
      email,
      role: isAdmin ? 'admin' : 'user',
      emailVerified: req.user?.emailVerified ?? false,
      onboardingCompleted: true,
      timezone: data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: req.user?.createdAt ?? now,
    });

    await userRepository.upsertPreferences(req.uid, {
      userId: req.uid,
      theme: 'dark',
      language: data.language,
      notificationsEnabled: true,
      emailDigestEnabled: true,
      pushNotificationsEnabled: true,
      digestTime: '09:00',
    });

    sendSuccess(res, profile, 201);
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const allowed = ['firstName', 'lastName', 'age', 'country', 'language', 'profession', 'interests', 'customInterests', 'avatarUrl', 'timezone', 'fcmToken'];
    const updates: Record<string, unknown> = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const profile = await userRepository.upsert(req.uid, updates);
    sendSuccess(res, profile);
  }

  async getRecommendedInterests(req: AuthenticatedRequest, res: Response): Promise<void> {
    const age = parseInt(req.query.age as string, 10) || req.user?.age || 25;
    const profession = (req.query.profession as string) || req.user?.profession || 'Other';
    const country = (req.query.country as string) || req.user?.country || 'United States';
    const language = (req.query.language as SupportedLanguage) || req.user?.language;
    const interests = personalizationService.recommendInterests(age, profession, country, language);
    sendSuccess(res, interests);
  }

  async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    const prefs = await userRepository.getPreferences(req.uid);
    sendSuccess(res, prefs);
  }

  async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.uid) throw new ValidationError('Unauthorized');
    await userRepository.upsertPreferences(req.uid, req.body);
    const prefs = await userRepository.getPreferences(req.uid);
    sendSuccess(res, prefs);
  }
}

export const userController = new UserController();
