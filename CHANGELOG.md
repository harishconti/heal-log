# Changelog

All notable changes to PatientLog are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Frontend telemetry integration with backend endpoint
- Dynamic user name for clinical note author

### Fixed
- Telemetry API endpoint path corrected
- Hardcoded note author replaced with authenticated user

---

## [3.0.0] - 2025-12-30

### Added
- Advanced search filtering with date range support
- Patient list pagination with configurable limits
- Clinical notes pagination
- CSV export endpoints (patients, notes, all data)
- Security headers middleware (CSP, HSTS, X-Frame-Options)
- Rate limiting on all API endpoints
- Input sanitization for search queries (NoSQL injection prevention)
- Admin role requirement for debug endpoints
- Stripe webhook signature verification

### Changed
- Token storage on web uses sessionStorage instead of localStorage
- CORS configuration uses explicit allowed origins
- Analytics endpoints require PRO subscription

### Fixed
- Division by zero in analytics service
- Timezone handling in sync service
- N+1 query issues in sync service (batch queries)

### Security
- NoSQL regex injection vulnerability patched
- Debug endpoints require admin authentication
- Webhook verification for Stripe payments
- Security headers on all responses

---

## [2.0.0] - 2025-12-24

### Added
- OTP email verification for new registrations
- Password reset via email
- Beta feedback submission endpoint
- Known issues endpoint for beta users
- Telemetry and analytics infrastructure
- Patient groups and favorites
- Document management (PRO feature)
- Sentry error monitoring integration

### Changed
- Authentication flow requires email verification
- User schema includes subscription fields
- API response format standardized

### Fixed
- Auth context response parsing
- Token refresh mechanism
- Sync conflict resolution

---

## [1.0.0] - 2025-12-01

### Added
- Initial release
- User registration and authentication (JWT)
- Patient CRUD operations
- Clinical notes management
- Offline-first sync with WatermelonDB
- Cross-platform support (iOS, Android, Web)
- MongoDB backend with Beanie ODM
- FastAPI REST API
- React Native frontend with Expo

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 3.0.0 | 2025-12-30 | Security hardening, pagination, export |
| 2.0.0 | 2025-12-24 | OTP verification, beta features |
| 1.0.0 | 2025-12-01 | Initial release |
