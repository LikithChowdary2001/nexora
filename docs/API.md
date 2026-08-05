# Nexora Backend API Documentation

## Architecture

```
Controllers → Services → Repositories → Firebase
```

## Health Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Basic health check |
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe (Firestore) |
| GET | `/api/health/version` | API version |
| GET | `/api/health/metrics` | Request/error metrics |
| GET | `/api/health/detailed` | Full dependency health |

## User APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | Yes | Get user profile |
| POST | `/api/users/onboarding` | Yes | Complete onboarding |
| PUT | `/api/users/profile` | Yes | Update profile |
| GET | `/api/users/recommended-interests` | Yes | Get interest recommendations |
| GET | `/api/users/preferences` | Yes | Get preferences |
| PUT | `/api/users/preferences` | Yes | Update preferences |
| GET | `/api/users/reading-history` | Yes | Get reading history |
| GET | `/api/users/reading-history/stats` | Yes | Reading statistics |
| GET | `/api/users/notifications` | Yes | List notifications |
| PUT | `/api/users/notifications/:id/read` | Yes | Mark notification read |
| GET | `/api/users/digest` | Yes | List daily digests |
| GET | `/api/users/digest/today` | Yes | Today's digest |

## News APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/news/feed` | Yes | Personalized feed |
| GET | `/api/news/trending` | Yes | Trending news |
| GET | `/api/news/briefing` | Yes | AI daily briefing |
| GET | `/api/news/article/:id/summary` | Yes | AI article summary (cached) |
| POST | `/api/news/read` | Yes | Record reading history |
| GET | `/api/news/continue-reading` | Yes | Incomplete articles |

## Search APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/search` | Yes | Search with AI summary |
| GET | `/api/search/history` | Yes | Search history |
| DELETE | `/api/search/history/:id` | Yes | Delete search entry |

## AI APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | Yes | AI assistant chat |

## Bookmark APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/bookmarks` | Yes | List bookmarks (cursor pagination) |
| POST | `/api/bookmarks` | Yes | Create bookmark |
| DELETE | `/api/bookmarks/:id` | Yes | Delete bookmark |

## Admin APIs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/users` | Admin | List users |
| GET | `/api/admin/analytics` | Admin | Analytics snapshot |
| POST | `/api/admin/analytics/sync` | Admin | Sync to Google Sheets |
| GET | `/api/admin/logs` | Admin | Admin audit logs |
| GET | `/api/admin/health` | Admin | System health |
| POST | `/api/admin/notifications` | Admin | Send notification |

## Firestore Collections

- `users` — User profiles
- `bookmarks` — Saved articles (with folders/tags)
- `preferences` — User settings
- `readingHistory` — Read tracking
- `searchHistory` — Search queries
- `AIChats` — AI conversation sessions
- `dailyDigest` — Generated digests
- `notifications` — Push/in-app notifications
- `NewsCache` — Cached news + AI summaries
- `TrendingTopics` — Trending topic scores
- `analytics` — Daily analytics snapshots
- `adminLogs` — Admin audit trail
- `SystemHealth` — Health check records
- `ErrorLogs` — Application errors

## Personalization Weights

| Factor | Weight |
|--------|--------|
| Interests | 40% |
| Profession | 20% |
| Age | 15% |
| Country | 10% |
| Reading History | 10% |
| Trending Topics | 5% |

## Environment Variables

See `.env.example` in project root.
