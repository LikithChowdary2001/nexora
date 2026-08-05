import type { UserProfile, UserPreferences } from '@nexora/shared';
import { Collections, getFirestore } from '../firebase/index.js';

export class UserRepository {
  private db = getFirestore();
  private collectionName = Collections.USERS;

  private col() {
    return this.db.collection(this.collectionName);
  }

  async findByUid(uid: string): Promise<UserProfile | null> {
    const doc = await this.col().doc(uid).get();
    if (!doc.exists) return null;
    return doc.data() as UserProfile;
  }

  async upsert(uid: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const now = new Date().toISOString();
    await this.col().doc(uid).set({ ...data, uid, updatedAt: now }, { merge: true });
    const updated = await this.findByUid(uid);
    return updated!;
  }

  async updateLastLogin(uid: string): Promise<void> {
    await this.col().doc(uid).update({ lastLogin: new Date().toISOString() });
  }

  async getAll(limit = 100): Promise<UserProfile[]> {
    const snapshot = await this.col().limit(limit).get();
    return snapshot.docs.map((d) => d.data() as UserProfile);
  }

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const doc = await this.db.collection(Collections.PREFERENCES).doc(userId).get();
    return doc.exists ? (doc.data() as UserPreferences) : null;
  }

  async upsertPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<void> {
    await this.db.collection(Collections.PREFERENCES).doc(userId).set(
      { userId, ...prefs, updatedAt: new Date().toISOString() },
      { merge: true }
    );
  }
}

export const userRepository = new UserRepository();
