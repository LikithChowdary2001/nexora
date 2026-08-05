import type { UserProfile } from '@nexora/shared';

const key = (uid: string) => `nexora_profile_${uid}`;

export function saveProfileLocally(profile: UserProfile): void {
  try {
    localStorage.setItem(key(profile.uid), JSON.stringify(profile));
  } catch {
    // ignore quota / private mode
  }
}

export function loadProfileLocally(uid: string): UserProfile | null {
  try {
    const raw = localStorage.getItem(key(uid));
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function clearProfileLocally(uid: string): void {
  try {
    localStorage.removeItem(key(uid));
  } catch {
    // ignore
  }
}
