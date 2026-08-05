import type { UserProfile } from '@nexora/shared';

let cachedProfile: UserProfile | null = null;

export function setClientProfile(profile: UserProfile | null): void {
  cachedProfile = profile;
}

export function getClientProfile(): UserProfile | null {
  return cachedProfile;
}

export function encodeClientProfile(profile: UserProfile): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(profile))));
}
