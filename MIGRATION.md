# Migration: Firebase Cloud Functions → Render + GitHub Actions Cron

## Summary

Nexora no longer uses Firebase Cloud Functions (which required the Blaze plan). All server-side logic now runs on the **Express backend** deployed to **Render Free Tier**, with scheduled jobs triggered by **GitHub Actions**.

## What Moved Where

| Former Cloud Function | New Location |
|----------------------|--------------|
| `sendDailyDigest` | `POST /api/cron/daily-digest` → `cron.service.ts` |
| `onUserCreate` | `POST /api/users/bootstrap` (called after signup) |
| `syncAnalytics` | `POST /api/cron/sync-analytics` |
| `refreshTrendingTopics` | `POST /api/cron/refresh-trending` |
| `cleanupExpiredCache` | `POST /api/cron/cleanup-cache` |
| `recordSystemHealth` | `POST /api/cron/record-health` |

## Architecture (Free Tier)

```
Firebase Hosting (Spark)     Render Web Service (Free)
        │                              │
        │  VITE_API_URL                │
        └──────────────────────────────┘
                       │
              Firebase (Spark)
              ├── Auth
              ├── Firestore
              └── Storage

GitHub Actions (cron.yml) ──► /api/cron/* (CRON_SECRET)
```

## Breaking Changes

- **None for end users.** Sign-up now calls `/api/users/bootstrap` instead of an Auth trigger.
- **Deploy:** Remove `firebase deploy --only functions`. Deploy backend to Render instead.

## Required New Secrets

| Secret | Where |
|--------|-------|
| `CRON_SECRET` | Render env + GitHub Actions secret |
| `RENDER_API_URL` | GitHub Actions (e.g. `https://nexora-api.onrender.com`) |
| `VITE_API_URL` | GitHub Actions + frontend build (Render API URL) |

## Verification Checklist

- [ ] `npm ci && npm run build` passes
- [ ] `npm run dev` — frontend + backend locally
- [ ] Sign up creates Firestore user via `/api/users/bootstrap`
- [ ] Render service health: `GET /api/health/live`
- [ ] Cron manual test: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" $API/api/cron/record-health`
- [ ] Firebase Hosting deploy with `VITE_API_URL` pointing to Render
- [ ] GitHub Actions cron workflow enabled
