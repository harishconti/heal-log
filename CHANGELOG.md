# Changelog

All notable changes to HealLog are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.49] - 2026-01-01 (Current)

### Fixed
- **Critical:** Fixed 'Unknown Date' issue - backend now correctly serializes datetimes to milliseconds for WatermelonDB sync
- **Critical:** Fixed notes sync validation error - added `initial` visit type to backend schema
  - Frontend was creating notes with `visit_type: "initial"` but backend only accepted `regular`, `follow-up`, `emergency`
  - This caused sync push failures, preventing notes from persisting after app reinstall
- **Critical:** Redis cache errors no longer crash patient create/delete operations
  - Cache invalidation now wrapped in try/except with graceful fallback
  - Errors logged as warnings instead of raising exceptions
- **Critical:** Fixed remaining patient_notes references in patient detail screen - now uses clinical_notes
- **Critical:** Fixed app crash 'Cannot read property query of null' - added null safety check for database collection
- Fixed OTP schema validation mismatch - changed from 6-digit to 8-digit to match OTP service
- Fixed database migration error on fresh installs - removed SQL copy from non-existent patient_notes table
- Fixed sync push 409 error: Empty email strings now converted to None
- Convert string ID to MongoDB ObjectId() before querying database
- Fixed user lookup to handle both _id (ObjectId) and id (UUID) fields
- Fixed profile update 500 error
- Added retry logic with exponential backoff
- Added database indexes for performance

### Added
- Delete clinical notes endpoint (`DELETE /api/patients/{id}/notes/{note_id}`)
  - Doctor-only access with rate limiting (20/minute)
  - Returns appropriate 404 errors for missing patient or note
- Web dashboard for Pro users (React + Vite)
  - Patient analytics and statistics
  - Usage metrics visualization
  - Subscription management
- **Google Contacts sync integration**
  - OAuth flow for connecting Google accounts
  - Initial and incremental sync support
  - Duplicate detection with manual resolution
  - Background sync with progress tracking
  - Offline queue support for failed sync operations
  - Batch duplicate resolution
- Push notifications support
- Biometric authentication (fingerprint/face) for mobile
- Frontend telemetry integration with backend endpoint
- Dynamic user name for clinical note author
- Schema migration to v2 to preserve existing notes data

### Changed
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

### Removed
- Redundant "By:" author field from notes display (single-user context makes it unnecessary)
- Non-functional feature icons from login screen bottom

---

## [1.0.0] - 2025-12-01

### Added
- Initial release
- User registration and authentication (JWT)
- Email OTP verification for new registrations (8-digit codes)
- Password reset via email with secure token
- Patient CRUD operations with search, filtering, grouping
- Clinical notes management with visit types (initial, regular, follow-up, emergency)
- Offline-first sync with WatermelonDB
- Cross-platform support (iOS, Android, Web)
- MongoDB backend with Beanie ODM
- FastAPI REST API with 16 routers
- React Native frontend with Expo
- Advanced search filtering with date range support
- Patient list pagination with configurable limits
- CSV export endpoints (patients, notes, all data)
- Security headers middleware (CSP, HSTS, X-Frame-Options)
- Rate limiting on all API endpoints
- Input sanitization for search queries (NoSQL injection prevention)
- Beta feedback submission and known issues endpoint
- Telemetry and analytics infrastructure
- Document management (PRO feature)
- Sentry error monitoring integration
- Stripe webhook signature verification and payments integration

### Security
- JWT tokens with 30-minute access token expiry
- 7-day refresh tokens for session renewal
- Password hashing with bcrypt (12+ chars required)
- NoSQL regex injection vulnerability prevention
- Debug endpoints require admin authentication
- Security headers on all responses

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.49 | 2026-01-01 | Sync fixes, web dashboard, integration fixes |
| 1.0.0 | 2025-12-01 | Initial release with full feature set |
