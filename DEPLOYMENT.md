# Deployment Guide (Free Tier)

Nexora runs entirely on **free-tier services** — no Firebase Blaze plan required.

## Stack

| Component | Platform | Plan |
|-----------|----------|------|
| Frontend PWA | Firebase Hosting | Spark (free) |
| Auth, Firestore, Storage | Firebase | Spark (free) |
| Express API | Render | Free web service |
| Scheduled jobs | GitHub Actions | Free |

## 1. Deploy Backend to Render

### Option A: Blueprint (recommended)

1. Push this repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect the Nexora repository — Render reads `render.yaml`.
4. Set environment variables marked `sync: false` in the Render dashboard:
   - Firebase Admin credentials (`FIREBASE_*`)
   - `ADMIN_EMAIL`
   - `CORS_ORIGIN` — your Firebase Hosting URLs, comma-separated
   - `OPENAI_API_KEY`, news API keys, SMTP credentials (optional)
5. Deploy. Note your service URL, e.g. `https://nexora-api.onrender.com`.

### Option B: Manual Web Service

Create a **Web Service** on Render with these exact settings:

| Setting | Value |
|---------|-------|
| **Root Directory** | *(leave blank — repo root)* |
| **Environment** | Node |
| **Build Command** | `npm ci && npm run render:build` |
| **Start Command** | `npm run render:start` |
| **Health Check Path** | `/api/health/live` |

> **Critical:** Do **not** set Root Directory to `packages/backend`. This is an npm workspace monorepo — Render must build from the repository root so `@nexora/shared` resolves correctly.

Copy all variables from `.env.example` into Render environment settings.

### Firebase Admin credentials (fixes `Invalid token` / 401)

If API calls return `{"success":false,"error":"Invalid token"}` and  
`https://your-api.onrender.com/api/health/ready` returns **503**, Firebase Admin is misconfigured on Render.

**Easiest fix — one env var:**

1. Open your Firebase service account JSON (Firebase Console → Project settings → Service accounts → Generate new private key).
2. Minify it to **one line** (no line breaks in the JSON).
3. In Render → your service → **Environment**, add:

| Key | Value |
|-----|-------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Entire JSON on one line |

**Or set three separate vars:**

| Key | Value |
|-----|-------|
| `FIREBASE_PROJECT_ID` | `nexora-28cf4` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-...@nexora-28cf4.iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n` (one line, literal `\n`) |
| `FIREBASE_STORAGE_BUCKET` | `nexora-28cf4.firebasestorage.app` |

Do **not** wrap the private key in extra quotes. After saving, Render redeploys automatically.

Verify: `GET /api/health/ready` should return `{"success":true,"status":"ready"}`.

### Enable Firestore (fixes `PERMISSION_DENIED` / Cloud Firestore API)

If Render logs show `Cloud Firestore API has not been used in project ... or it is disabled`:

1. [Firebase Console](https://console.firebase.google.com/project/nexora-28cf4/firestore) → **Build** → **Firestore Database** → **Create database**
2. Choose **Production mode** (rules are in `firestore.rules`) and a region (e.g. `us-central1`)
3. If needed, enable the API: [Cloud Firestore API](https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=nexora-28cf4) → **Enable**
4. Wait 2–5 minutes, then hit `/api/health/ready` again

Also deploy Firestore rules from the repo:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 2. Configure GitHub Secrets

| Secret | Value |
|--------|-------|
| `VITE_API_URL` | `https://nexora-api.onrender.com/api` |
| `RENDER_API_URL` | `https://nexora-api.onrender.com` |
| `CRON_SECRET` | Same value as Render `CRON_SECRET` |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service account JSON |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_*` | Firebase client config (6 values) |
| `ADMIN_EMAIL` | Admin user email |

## 3. Deploy Frontend to Firebase Hosting

```bash
# Build with production API URL
VITE_API_URL=https://nexora-api.onrender.com/api npm run build -w @nexora/frontend

firebase deploy --only hosting,firestore:rules,firestore:indexes,storage
```

Or push to `main` — GitHub Actions deploys hosting automatically when secrets are configured.

## 4. Enable Scheduled Jobs

The workflow `.github/workflows/cron.yml` triggers cron endpoints on schedule. Ensure:

- `RENDER_API_URL` and `CRON_SECRET` are set in GitHub repository secrets.
- Render service is awake (free tier sleeps after 15 min inactivity; cron requests wake it).

## 5. Post-Deploy Verification

```bash
# Backend health
curl https://nexora-api.onrender.com/api/health/live

# Cron (replace secret)
curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://nexora-api.onrender.com/api/cron/record-health

# Frontend loads and API calls succeed (browser network tab)
```

## Local Development

```bash
cp .env.example .env
# Fill in Firebase + OpenAI keys
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001/api

## CORS

Set `CORS_ORIGIN` on Render to include all frontend origins:

```
https://nexora-28cf4.web.app,https://nexora-28cf4.firebaseapp.com,http://localhost:5173
```

## Notes

- Render free tier spins down after inactivity; first request may take ~30s (cold start).
- Email digest requires SMTP credentials in Render env vars.
- No Cloud Functions or Blaze plan needed.
