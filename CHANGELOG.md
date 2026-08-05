# Changelog

All notable changes to Nexora are documented in this file.

## [1.0.0] - 2026-08-04

### Added
- Full-stack AI news platform (React PWA + Express API + Firebase)
- 9-step onboarding with personalization engine (40/20/15/10/10/5 weighting)
- Multi-provider news pipeline (Google News RSS, GNews, NewsAPI)
- OpenAI summaries, briefings, and AI assistant with chat persistence
- Admin dashboard with analytics, health monitoring, and user management
- Firebase Cloud Functions for daily digest, trending topics, cache cleanup
- PWA with offline support, service worker, and push notification hooks
- Health endpoints: `/api/health`, `/api/health/live`, `/api/health/ready`, `/api/health/version`, `/api/health/metrics`
- Structured Winston logging and error tracking
- GitHub Actions CI/CD with hosting, functions, and Firestore rules deployment

### Security
- Firestore rules hardened against role escalation
- Notification mark-read IDOR fix in backend controller
- Production requires `ADMIN_EMAIL` environment variable (no hardcoded fallback)
- Secure headers on Firebase Hosting
- Rate limiting on API and AI endpoints

### Performance
- Route-level code splitting and manual vendor chunks
- AI summary caching via NewsCache collection
- OpenAI retry logic with timeout handling

### Fixed
- Removed broken `/api/**` Firebase Hosting rewrite to non-existent Cloud Function
- Removed duplicate user sub-routes (`/api/users/bookmarks`, etc.)
- Added missing Firestore composite indexes
- Wired error metrics via `incrementErrorCount`
- Frontend test suite for CI compatibility

### Fixed
- Removed Firebase Cloud Functions dependency (Blaze plan no longer required)
- Migrated scheduled jobs to Express `/api/cron/*` + GitHub Actions
- Replaced Auth trigger with `/api/users/bootstrap`
- Backend deploys to Render free tier

### Documentation
- SETUP.md, DEPLOYMENT.md, CONTRIBUTING.md, SECURITY.md
- Production readiness report
