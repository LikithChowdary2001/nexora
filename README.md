# Nexora

**AI Powered Personalized News Assistant**

Nexora is an enterprise-grade, AI-powered personalized news platform that learns user interests, profession, age, country, language, and reading history to deliver intelligent, curated news feeds.

## Architecture

```
nexora/
├── packages/
│   ├── shared/          # Shared TypeScript types & utilities
│   ├── backend/         # Express REST API (Node.js + TypeScript)
│   └── frontend/        # React + Vite + Tailwind + ShadCN UI
├── functions/           # Firebase Cloud Functions (daily digest, FCM)
├── firebase.json        # Firebase hosting, Firestore, functions config
├── firestore.rules      # Security rules
└── .github/workflows/   # CI/CD pipeline
```



### Tech Stack


| Layer    | Technology                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| Frontend | React, Vite, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion, React Query, PWA |
| Backend  | Node.js, Express, TypeScript, Firebase Admin SDK                                  |
| Database | Firebase Firestore                                                                |
| Auth     | Firebase Authentication                                                           |
| Storage  | Firebase Storage                                                                  |
| AI       | OpenAI GPT-4o                                                                     |
| Hosting  | Firebase Hosting                                                                  |
| CI/CD    | GitHub Actions                                                                    |




## Quick Start



### Prerequisites

- Node.js 18+
- Firebase project with Auth, Firestore, Storage, Hosting enabled
- OpenAI API key
- NewsAPI and/or GNews API keys (optional)



### Setup

```bash
# Clone and install
git clone <repo-url> nexora
cd nexora
npm install

# Configure environment
cp .env.example .env
# Fill in all values in .env

# Build shared types
npm run build -w @nexora/shared

# Start development
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)  
Backend API: [http://localhost:3001/api](http://localhost:3001/api)

### Firebase Setup

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id>
firebase deploy
```



## Environment Variables

See `.env.example` for the complete list. Key variables:


| Variable                | Description                       |
| ----------------------- | --------------------------------- |
| `VITE_FIREBASE_*`       | Firebase client config (frontend) |
| `FIREBASE_PROJECT_ID`   | Firebase Admin project ID         |
| `FIREBASE_CLIENT_EMAIL` | Service account email             |
| `FIREBASE_PRIVATE_KEY`  | Service account private key       |
| `OPENAI_API_KEY`        | OpenAI API key                    |
| `NEWSAPI_KEY`           | NewsAPI.org key                   |
| `GNEWS_API_KEY`         | GNews API key                     |
| `ADMIN_EMAIL`           | Admin dashboard access email      |
| `SMTP_*`                | Email digest configuration        |




## Features

- **Premium Login** — Animated AI background, glassmorphism, particle effects
- **Smart Onboarding** — Profile collection with interest recommendations
- **Personalized Feed** — Weighted scoring engine (interests 40%, profession 20%, etc.)
- **AI Briefing** — Daily executive summaries powered by GPT
- **Multi-source News** — Google News RSS, GNews, NewsAPI with deduplication
- **Search** — AI-summarized search across all providers
- **AI Assistant** — Floating chat for news Q&A
- **8 Languages** — English, Spanish, Hindi, Telugu, French, German, Japanese, Chinese
- **Admin Dashboard** — User management, analytics, system health
- **Daily Digest** — 9 AM local timezone via email + push notifications
- **PWA** — Offline support, installable app
- **Dark/Light Mode** — Theme switching



## API Endpoints


| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| GET    | `/api/health`           | Health check           |
| GET    | `/api/users/profile`    | Get user profile       |
| POST   | `/api/users/onboarding` | Complete onboarding    |
| GET    | `/api/news/feed`        | Personalized feed      |
| GET    | `/api/news/briefing`    | AI daily briefing      |
| POST   | `/api/search`           | Search with AI summary |
| POST   | `/api/ai/chat`          | AI assistant chat      |
| GET    | `/api/bookmarks`        | List bookmarks         |
| GET    | `/api/admin/analytics`  | Admin analytics        |




## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full instructions. The Express API deploys separately (Cloud Run); Firebase Hosting serves the frontend.

Push to `main` triggers GitHub Actions: build, test, deploy Firestore rules, functions, and hosting.

Required GitHub Secrets: `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`, `ADMIN_EMAIL`, `VITE_FIREBASE_*`

## Documentation


| Document                                                                     | Description             |
| ---------------------------------------------------------------------------- | ----------------------- |
| [SETUP.md](./SETUP.md)                                                       | Local development setup |
| [DEPLOYMENT.md](./DEPLOYMENT.md)                                             | Production deployment   |
| [docs/API.md](./docs/API.md)                                                 | API reference           |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)                               | System architecture     |
| [docs/PRODUCTION_READINESS_REPORT.md](./docs/PRODUCTION_READINESS_REPORT.md) | Launch audit report     |
| [SECURITY.md](./SECURITY.md)                                                 | Security policy         |
| [CHANGELOG.md](./CHANGELOG.md)                                               | Version history         |




## Security

- Firebase Security Rules for role-based access (admin/user)
- Rate limiting on all API endpoints
- Input validation with Zod schemas
- HTTPS enforced via Firebase Hosting headers
- No secrets in source code — all via environment variables



## License

# MIT — see [LICENSE](./LICENSE).



# nexora

> > > > > > > 19770aef00a204d9f1892c5b9d78da00b767bce8

