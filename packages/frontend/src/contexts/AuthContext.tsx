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
  };

  const refreshProfile = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setProfile(null);
      return;
    }

    try {
      const { data } = await api.get('/users/profile');
      if (data.success) {
        setProfile(data.data);
        return;
      }
    } catch {
      // fall through to bootstrap / Firestore
    }

    try {
      await api.post('/users/bootstrap');
      const { data } = await api.get('/users/profile');
      if (data.success) {
        setProfile(data.data);
        return;
      }
    } catch {
      // fall through to Firestore
    }

    try {
      const localProfile = await loadProfileFromFirestore(uid);
      setProfile(localProfile);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshProfile();
      } else {
        setProfile(null);
      }
      setLoading(false);
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
    await signOut(auth);
    setProfile(null);
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
