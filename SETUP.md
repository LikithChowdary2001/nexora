# Setup Guide

## Prerequisites

- **Node.js 20+**
- **npm 9+**
- **Firebase CLI:** `npm install -g firebase-tools`

## 1. Clone and Install

```bash
git clone <repo-url> nexora
cd nexora
npm install
```

## 2. Environment Configuration

```bash
cp .env.example .env
```

Required for local development:

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Frontend Firebase client config |
| `FIREBASE_PROJECT_ID` | Backend Admin SDK |
| `FIREBASE_CLIENT_EMAIL` | Service account email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `ADMIN_EMAIL` | Email that receives admin role on signup |
| `OPENAI_API_KEY` | AI summaries and assistant |

## 3. Run Development Servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

## 4. Run Tests

```bash
npm run test
npm run typecheck
npm run build
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment.
