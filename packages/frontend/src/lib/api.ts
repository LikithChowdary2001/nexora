import axios from 'axios';
import { auth } from './firebase';
import { getClientProfile, encodeClientProfile } from './client-profile';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;

    const profile = getClientProfile();
    if (profile?.uid === user.uid) {
      config.headers['X-Client-Profile'] = encodeClientProfile(profile);
    }
  }
  return config;
});

export default api;
