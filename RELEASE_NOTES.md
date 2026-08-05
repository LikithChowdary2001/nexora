# Nexora v1.0.0 Release Notes

**Release date:** August 4, 2026  
**Codename:** Launch Ready

## Overview

Nexora v1.0.0 is the first production release of the AI-powered personalized news assistant. This release delivers a complete end-to-end experience: onboarding, personalized feeds, search, bookmarks, AI assistant, daily digest, admin tools, and PWA support.

## Highlights

- **Personalization engine** scores articles using interests (40%), profession (20%), age (15%), country (10%), reading history (10%), and trending topics (5%)
- **Multi-source news** with deduplication, ranking, image fallbacks, and resilient feed handling
- **AI features** include article summaries (cached), search summaries, daily briefings, and contextual chat with source attribution
- **Enterprise backend** with clean architecture, Winston logging, health probes, and rate limiting
- **Firebase integration** for Auth, Firestore, Storage, Hosting, and scheduled Cloud Functions

## Known Limitations

- Express API must be deployed separately (Cloud Run recommended); Firebase Hosting serves the frontend only
- Lighthouse scores require production deployment with real API keys for full validation
- Test coverage is foundational (~25 tests); 90% coverage target is a post-launch goal
- Push notifications require FCM server key and user opt-in configuration in Firebase Console

## Manual Configuration Required

Before going live, configure:

1. Firebase project (Auth, Firestore, Storage, Hosting, Functions)
2. `ADMIN_EMAIL` in backend, functions, and GitHub secrets
3. OpenAI API key
4. NewsAPI and/or GNews keys
5. Google Sheets service account (optional)
6. SMTP credentials for email digest (optional)
7. Backend deployment target (Cloud Run) with `VITE_API_URL` pointing to API URL
8. Custom domain DNS (optional)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step instructions.
