import type { Request } from 'express';
import type { UserProfile } from '@nexora/shared';

export function parseClientProfileHeader(req: Pick<Request, 'headers'> & { uid?: string }): UserProfile | null {
  const raw = req.headers['x-client-profile'];
  if (!raw || !req.uid || typeof raw !== 'string') return null;

  try {
    const profile = JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as UserProfile;
    if (profile.uid !== req.uid) return null;
    return profile;
  } catch {
    return null;
  }
}
