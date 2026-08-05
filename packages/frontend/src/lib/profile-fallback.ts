import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@nexora/shared';
import { db } from './firebase';

export async function loadProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as UserProfile;
}
