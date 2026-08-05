import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile, SupportedLanguage } from '@nexora/shared';
import { db } from './firebase';

export interface OnboardingFormData {
  firstName: string;
  lastName: string;
  age: number;
  country: string;
  language: SupportedLanguage;
  profession: string;
  interests: string[];
  customInterests: string[];
}

export function buildProfileFromOnboarding(user: User, form: OnboardingFormData): UserProfile {
  const now = new Date().toISOString();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  return {
    uid: user.uid,
    email: user.email ?? '',
    firstName: form.firstName,
    lastName: form.lastName,
    age: form.age,
    country: form.country,
    language: form.language,
    profession: form.profession,
    interests: form.interests,
    customInterests: form.customInterests,
    role: 'user',
    emailVerified: user.emailVerified,
    onboardingCompleted: true,
    timezone,
    createdAt: now,
    updatedAt: now,
    lastLogin: now,
  };
}

/** Save profile directly to Firestore when the Render API is unavailable. */
export async function saveOnboardingToFirestore(
  user: User,
  form: OnboardingFormData
): Promise<UserProfile> {
  const profile = buildProfileFromOnboarding(user, form);
  const now = profile.updatedAt;

  await setDoc(doc(db, 'users', user.uid), profile, { merge: true });

  await setDoc(
    doc(db, 'preferences', user.uid),
    {
      userId: user.uid,
      theme: 'dark',
      language: form.language,
      notificationsEnabled: true,
      emailDigestEnabled: true,
      pushNotificationsEnabled: true,
      digestTime: '09:00',
      updatedAt: now,
    },
    { merge: true }
  );

  return profile;
}
