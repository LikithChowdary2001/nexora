# Deployment Guide

## Architecture

Firebase Hosting serves the React PWA. The Express API runs separately on Cloud Run (or similar). Cloud Functions handle scheduled jobs.

**Important:** Set `VITE_API_URL` to your API URL when building the frontend.

## Deploy Steps

```bash
npm ci
npm run build
npm run build:functions

firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
firebase deploy --only hosting
```

Deploy the backend to Cloud Run with all variables from `.env.example`.

## GitHub Secrets

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_*` | Client config (6 secrets) |
| `ADMIN_EMAIL` | Admin user email |

## Post-Deploy Verification

```bash
curl https://api.yourdomain.com/api/health
curl https://api.yourdomain.com/api/health/ready
curl https://api.yourdomain.com/api/health/version
```
