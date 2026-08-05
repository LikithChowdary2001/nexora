import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

function configEnvIsProduction(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'production';
}

export const config = {
  env: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '3001'), 10),
  isDev: optionalEnv('NODE_ENV', 'development') === 'development',

  corsOrigin: optionalEnv('CORS_ORIGIN', 'http://localhost:5173'),
  appUrl: optionalEnv('VITE_APP_URL', 'http://localhost:5173'),
  adminEmail: optionalEnv('ADMIN_EMAIL', configEnvIsProduction() ? '' : 'admin@localhost.dev'),

  firebase: {
    projectId: optionalEnv('FIREBASE_PROJECT_ID'),
    clientEmail: optionalEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: optionalEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    storageBucket: optionalEnv('FIREBASE_STORAGE_BUCKET'),
  },

  openai: {
    apiKey: optionalEnv('OPENAI_API_KEY'),
    model: optionalEnv('OPENAI_MODEL', 'gpt-4o'),
  },

  news: {
    newsApiKey: optionalEnv('NEWSAPI_KEY'),
    gnewsApiKey: optionalEnv('GNEWS_API_KEY'),
  },

  googleSheets: {
    spreadsheetId: optionalEnv('GOOGLE_SHEETS_SPREADSHEET_ID'),
    serviceAccountEmail: optionalEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    privateKey: optionalEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },

  email: {
    host: optionalEnv('SMTP_HOST'),
    port: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
    user: optionalEnv('SMTP_USER'),
    pass: optionalEnv('SMTP_PASS'),
    from: optionalEnv('EMAIL_FROM', 'noreply@nexora.app'),
  },

  rateLimit: {
    windowMs: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),
  },
} as const;

export function validateConfig(): void {
  const requiredInProduction = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  if (config.env === 'production') {
    for (const key of [...requiredInProduction, 'ADMIN_EMAIL']) {
      if (!process.env[key]) {
        throw new Error(`Missing required production env: ${key}`);
      }
    }
  }
}
