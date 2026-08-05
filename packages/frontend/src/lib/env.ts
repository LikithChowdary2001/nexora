export const REQUIRED_FIREBASE_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function getMissingFirebaseEnv(): string[] {
  return REQUIRED_FIREBASE_ENV.filter((key) => !import.meta.env[key]);
}

export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || '/api';
}
