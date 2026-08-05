# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | -------------------- |
| 1.0.x   | Yes                  |

## Reporting a Vulnerability

If you discover a security vulnerability, please email the project maintainer privately. Do **not** open a public GitHub issue for security-sensitive reports.

## Security Architecture

### Authentication
- Firebase Authentication (email/password) on the frontend via Web SDK
- Backend verifies ID tokens via Firebase Admin SDK
- Admin role assigned only via `ADMIN_EMAIL` on user creation (Cloud Function) or by existing admins

### Authorization
- Firestore security rules enforce owner-based access
- Users cannot modify `role` or `uid` fields on their profile
- Admin-only collections: `adminLogs`, `analytics`, `SystemHealth`, `ErrorLogs`
- Backend Admin SDK bypasses rules — all IDOR checks enforced in controllers

### API Hardening
- Helmet security headers on Express
- CORS restricted to configured origin
- Rate limiting on general and AI endpoints
- Input validation via Zod schemas

## Remaining Recommendations

1. Enable Firebase App Check for production
2. Add WAF / Cloud Armor if using Cloud Run publicly
3. Rotate API keys on a schedule
4. Enable Firebase audit logging
5. Add CSP headers once inline script audit is complete
