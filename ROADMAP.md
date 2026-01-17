# HealLog Product Roadmap

This document outlines the planned features and improvements for HealLog. Items are subject to change based on user feedback and priorities.

---

## Current Version: 1.3.9

### Released Features
- User registration and authentication with JWT
- Email OTP verification (8-digit codes)
- Password reset via secure token
- Patient management (CRUD with search, filtering, grouping)
- Clinical notes with visit types
- Offline-first data storage (WatermelonDB)
- Cloud sync (push/pull)
- Profile management with photo upload
- Dark mode support
- Web dashboard for Pro users (React + Vite)
- CSV data export (patients, notes, all data)
- Beta feedback system
- Telemetry and analytics
- Stripe payment integration
- Rate limiting and security headers
- Input sanitization (NoSQL injection prevention)
- Google Contacts sync integration with duplicate detection
- Biometric authentication (fingerprint/Face ID)
- Push notifications support
- **NEW (v1.3.x):** Architecture improvements
  - Redis-backed token blacklist for distributed deployments
  - Unified AuthMiddleware with single JWT processing
  - Async-safe locks in account lockout service
  - Standardized error responses with machine-readable codes
  - Structured logging with sensitive data masking
  - Centralized rate limit constants

---

## Phase 1: Beta Release

**Status:** Complete (v1.3.9)

### Critical (Must Have)
- [x] Core authentication flow
- [x] Patient management
- [x] Clinical notes
- [x] Offline sync
- [x] Enhanced error handling
- [x] Security hardening
- [x] 48 backend tests passing
- [x] Push notifications
- [x] Biometric authentication
- [x] Google Contacts sync integration
- [ ] Device compatibility testing
- [ ] Play Store submission

### High Priority
- [x] Rate limiting
- [x] Security headers
- [x] Input validation/sanitization
- [ ] Performance optimization for large datasets
- [x] Comprehensive testing
- [x] Documentation

---

## Phase 2: Production Release (v1.0)

**Target:** Q1 2026

### Features
- [ ] **Appointment Scheduling**
  - Calendar view
  - Appointment reminders
  - Recurring appointments

- [ ] **Enhanced Search**
  - Full-text search across patients and notes
  - Filter by date, diagnosis
  - Recent searches

- [ ] **Export & Reports**
  - Export patient data to PDF
  - Visit summary reports
  - Prescription printing

- [x] **Biometric Login** (Implemented)
  - Fingerprint authentication
  - Face unlock support

### Improvements
- [ ] Performance optimization (large datasets)
- [ ] Improved offline indicators
- [ ] Better sync conflict resolution
- [ ] Enhanced error messages

---

## Phase 3: Pro Features (v1.5)

**Target:** Q2 2026

### Subscription Features (Implemented)
- [x] **Multi-device Sync**
  - Unlimited devices
  - Offline-first sync

- [x] **Advanced Analytics** (Pro only)
  - Patient growth charts
  - Notes activity metrics
  - Weekly activity reports
  - Demographics breakdown

- [x] **Document Management**
  - Medical document upload
  - Patient file attachments

- [x] **Google Contacts Integration**
  - OAuth flow for connecting Google accounts
  - Initial and incremental sync
  - Duplicate detection with manual resolution
  - Background sync with progress tracking

- [ ] **Templates** (Planned)
  - Note templates
  - Prescription templates
  - Custom form fields

### Web Dashboard (Implemented)
- [x] Full patient management
- [x] Analytics dashboard with charts
- [x] Patient search and filtering
- [x] Profile management
- [ ] Bulk import/export
- [ ] User management (for clinics)

---

## Phase 4: Clinic Edition (v2.0)

**Target:** Q3 2026

### Multi-User Support
- [ ] **Team Management**
  - Add staff members
  - Role-based access
  - Activity logs

- [ ] **Shared Patients**
  - Patient handoffs
  - Collaborative notes
  - Team notifications

- [ ] **Clinic Dashboard**
  - Overview of all patients
  - Staff performance
  - Appointment calendar

### Integrations
- [x] Google Contacts sync (Implemented in v1.0.9)
- [ ] Calendar sync (Google, Apple)
- [ ] SMS notifications
- [ ] Lab system integration
- [ ] Insurance verification

---

## Phase 5: Platform Expansion (v2.5)

**Target:** Q4 2026

### iOS App
- [ ] Native iOS app
- [ ] Apple Watch companion
- [ ] iCloud backup option

### Telemedicine
- [ ] Video consultations
- [ ] Chat with patients
- [ ] Digital prescriptions

### AI Features
- [ ] Smart note suggestions
- [ ] Diagnosis assistance
- [ ] Drug interaction warnings

---

## Future Considerations

These items are being considered but not scheduled:

### Patient Portal
- Patient app for viewing records
- Appointment booking
- Secure messaging
- Prescription refill requests

### Compliance & Security
- HIPAA certification
- SOC 2 compliance
- Audit logging
- Data residency options

### Enterprise Features
- SSO integration
- Custom branding
- API access
- SLA guarantees

---

## Feature Request Process

Have a feature idea? Here's how to submit it:

1. **Check existing requests** on GitHub Issues
2. **Create a new issue** with the Feature Request template
3. **Vote on existing features** by adding a reaction
4. Features with most votes are prioritized

---

## Feedback Channels

- **GitHub Issues:** https://github.com/harishconti/heal-log/issues
- **Email:** support@heallog.com
- **In-App:** Settings > Send Feedback

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.3.9 | Jan 2026 | Current stable - Architecture improvements complete |
| 1.3.0 | Jan 2026 | Phase 1 security fixes, middleware improvements |
| 1.2.2 | Jan 2026 | Android UI/UX improvements |
| 1.2.1 | Jan 2026 | Landing page redesign |
| 1.0.9 | Jan 2026 | Web dashboard, sync fixes, Google Contacts integration |
| 1.0.0 | Dec 2025 | Initial release with core features |
| 1.5.0 | Q2 2026 | Pro features (planned) |
| 2.0.0 | Q3 2026 | Clinic edition (planned) |

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.

---

*Last Updated: January 2026*
*This roadmap is subject to change based on user feedback and business priorities.*
