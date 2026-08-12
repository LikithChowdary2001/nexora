import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import api from '@/lib/api';
import { loadProfileFromFirestore } from '@/lib/profile-fallback';
import { saveProfileLocally, loadProfileLocally, clearProfileLocally } from '@/lib/profile-storage';
import { setClientProfile } from '@/lib/client-profile';
import type { UserProfile } from '@nexora/shared';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  applyProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const applyProfile = (profile: UserProfile) => {
    setProfile(profile);
    setClientProfile(profile);
    saveProfileLocally(profile);
  };

  const refreshProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setProfile(null);
      setClientProfile(null);
      return;
    }

    const cached = loadProfileLocally(uid);
    if (cached) {
      setProfile(cached);
      setClientProfile(cached);
    }

    try {
      const { data } = await api.get('/users/profile');
      if (data.success) {
        applyProfile(data.data);
        return;
      }
    } catch {
      // fall through
    }

    try {
      await api.post('/users/bootstrap');
      const { data } = await api.get('/users/profile');
      if (data.success) {
        applyProfile(data.data);
        return;
      }
    } catch {
      // fall through
    }

    try {
      const localProfile = await loadProfileFromFirestore(uid);
      if (localProfile) {
        applyProfile(localProfile);
        return;
      }
    } catch {
      // fall through
    }

    // Never wipe a profile that exists in localStorage (avoids race after onboarding)
    const persisted = loadProfileLocally(uid);
    if (persisted) {
      applyProfile(persisted);
      return;
    }

    setProfile(null);
    setClientProfile(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const cached = loadProfileLocally(firebaseUser.uid);
        if (cached) {
          setProfile(cached);
          setClientProfile(cached);
        }
        // Don't block the UI on slow/failing profile API calls
        setLoading(false);
        void refreshProfile();
      } else {
        setProfile(null);
        setClientProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(credential.user);
    try {
      await api.post('/users/bootstrap');
    } catch (error) {
      console.warn('Profile bootstrap failed — will retry on onboarding', error);
    }
    await refreshProfile();
  };

  const logout = async () => {
    const uid = auth.currentUser?.uid;
    await signOut(auth);
    if (uid) clearProfileLocally(uid);
    setProfile(null);
    setClientProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, logout, resetPassword, refreshProfile, applyProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
