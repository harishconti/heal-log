# Changelog

All notable changes to HealLog are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Delete clinical notes endpoint (`DELETE /api/patients/{id}/notes/{note_id}`)
  - Doctor-only access with rate limiting (20/minute)
  - Returns appropriate 404 errors for missing patient or note

### Fixed
- **Critical:** Notes sync validation error - added `initial` visit type to backend schema
  - Frontend was creating notes with `visit_type: "initial"` but backend only accepted `regular`, `follow-up`, `emergency`
  - This caused sync push failures, preventing notes from persisting after app reinstall
- **Critical:** Redis cache errors no longer crash patient create/delete operations
  - Cache invalidation now wrapped in try/except with graceful fallback
  - Errors logged as warnings instead of raising exceptions
- OTP schema updated to accept 8-digit codes (was incorrectly validating 6-digit)

### Removed
- Redundant "By:" author field from notes display (single-user context makes it unnecessary)
- Non-functional feature icons from login screen bottom

---

## [3.1.0] - 2025-12-31

### Added
- Web dashboard for Pro users (React + Vite)
  - Patient analytics and statistics
  - Usage metrics visualization
  - Subscription management
- Frontend telemetry integration with backend endpoint
- Dynamic user name for clinical note author

### Fixed
- All 14 integration audit issues resolved:
  - **Critical:** Token storage now uses sessionStorage consistently (security fix)
  - **Critical:** Password validation aligned with backend (12 char minimum)
  - **High:** Feedback API endpoint and import errors fixed
  - **High:** Feedback type mapping for 'other' -> 'general'
  - **High:** Clinical note schema fields aligned with backend
  - **High:** User role field added to frontend interface
  - **Medium:** Visit type enum validation added
  - **Medium:** Profile screen Patient import corrected
  - **Medium:** Duplicate feedback screens consolidated
  - **Low:** Analytics screen theme colors applied
  - **Low:** Unused BACKEND_URL variable removed
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
| 3.1.0 | 2025-12-31 | Web dashboard, integration fixes |
| 3.0.0 | 2025-12-30 | Security hardening, pagination, export |
| 2.0.0 | 2025-12-24 | OTP verification, beta features |
| 1.0.0 | 2025-12-01 | Initial release |
