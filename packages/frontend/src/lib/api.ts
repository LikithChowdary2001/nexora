import axios from 'axios';
import { auth } from './firebase';
import { getClientProfile, encodeClientProfile } from './client-profile';
import { loadProfileLocally } from './profile-storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 90_000,
});

/** Ping Render so the first real request is not a 30–60s cold start. */
export function warmBackend(): void {
  const base = import.meta.env.VITE_API_URL || '/api';
  fetch(`${base.replace(/\/$/, '')}/health/live`, { method: 'GET' }).catch(() => {});
}

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;

    const profile = getClientProfile() ?? loadProfileLocally(user.uid);
    if (profile?.uid === user.uid) {
      config.headers['X-Client-Profile'] = encodeClientProfile(profile);
    }
  }
  return config;
});

export default api;
