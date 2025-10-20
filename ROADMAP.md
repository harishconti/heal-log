# Project Roadmap: Clinic OS Lite
**Version:** 2.3
**Date:** 2025-10-20

This document outlines the development status and future roadmap for all components of the Clinic OS Lite application. It serves as the single source of truth for tracking progress toward the beta release and beyond.

**CURRENT STATUS: BLOCKED.** All forward progress is currently blocked by two critical issues: the Frontend Infinite Loading Screen and the Android Build Failure. Refer to `testing_and_issues.md` for details.

---

## 1. Cross-Platform App (React Native for iOS & Web)

### ✅ Completed Features
- **Core Subscription & Auth:**
  - [x] Integrated Zustand for global state management (user, plan, status).
  - [x] Login flow correctly hydrates state from the backend JWT.
  - [x] Fixed critical state hydration issue to prevent infinite loading screens.
- **Conditional UI:**
  - [x] Profile screen displays the user's current plan and trial status.
  - [x] Pro-level features (e.g., Document Uploads) are visually locked for Basic/Trial users.
  - [x] UI elements like "Upgrade" buttons are displayed conditionally.
- **Payment Integration:**
  - [x] A dedicated "Upgrade" screen outlines Pro plan benefits.
  - [x] The checkout flow is implemented, securely calling the backend to create a payment session.
- **Data Layer & Offline-First:**
  - [x] **WatermelonDB:** Fully configured for both iOS and Web, providing a robust offline-first data layer.
  - [x] **Data Synchronization:** The app now correctly uses the backend's `/api/sync/pull` and `/api/sync/push` endpoints to keep local and remote data in sync.
- **Forms & Validation:**
    - [x] Implemented `react-hook-form` and `zod` for robust, schema-based validation on patient forms.

### ⏳ Pending Features (All Blocked)
- **Document Management (Pro Feature):** *(Blocked by: Frontend Infinite Loading Screen)*
  - [ ] Implement the document upload UI on the patient detail screen.
  - [ ] Implement a view to list and manage a patient's uploaded documents.
- **General Improvements:** *(Blocked by: Frontend Infinite Loading Screen)*
  - [ ] **UI/UX:** Add haptic feedback and more advanced loading skeletons.

---

## 2. Web Dashboard (React.js) - *New Build*

This is a new, Pro-exclusive application to be built from scratch.

### ⏳ Pending Features (All Blocked)

- **Core Architecture:** *(Blocked by: Frontend Infinite Loading Screen)*
  - [ ] Set up a new React.js project (e.g., with Next.js).
  - [ ] Implement shared authentication logic to connect to the existing backend.
  - [ ] Implement a "Pro User" route guard to protect the entire dashboard.
- **Feature Development:** *(Blocked by: Frontend Infinite Loading Screen)*
  - [ ] **Analytics Dashboard:** Develop components to visualize key practice metrics from the `/api/analytics` endpoints.
  - [ ] **Advanced Patient Management:** Build a comprehensive data grid (e.g., MUI X, AG Grid) for searching, sorting, and filtering patients.
  - [ ] **Appointment Calendar:** Implement a full-featured calendar for appointment management using a library like FullCalendar. *(Depends on: Backend Appointments API)*

---

## 3. Backend (FastAPI)

### ✅ Completed Features

- **Core APIs:**
  - [x] User Authentication and Registration.
  - [x] Patient and Clinical Note Management (CRUD).
- **Subscription & Payments:**
  - [x] Payment gateway integration for creating checkout sessions.
  - [x] Webhook endpoint to handle payment status updates.
- **Pro-Tier APIs:**
  - [x] API endpoints for `Documents` and `Analytics` are implemented and protected.
- **Security & Stability:**
  - [x] **RBAC:** Finalized and polished Role-Based Access Control. New users are correctly assigned the `DOCTOR` role.
  - [x] **Rate Limiting:** Implemented rate limiting across all major API endpoints.
  - [x] **Server-Side Validation:** Enhanced validation for patient and clinical note data.
  - [x] **Caching:** Implemented a debug endpoint to clear all caches, resolving a critical data access issue in the test environment.

- **Data Synchronization API:**
  - [x] Implemented `/api/sync/pull` and `/api/sync/push` endpoints required by the frontend's WatermelonDB client.

### ⏳ Pending Features
- **Core Functionality:**
  - [ ] **Appointments:** Develop API endpoints for appointment management.
  - [ ] **Image Storage:** Integrate with a cloud storage service (e.g., AWS S3, Cloudinary) for document files.

---

## 4. General / Cross-Cutting Concerns (All Blocked)

- [ ] **Error Handling:** Integrate a monitoring service like Sentry or Firebase Crashlytics across both frontend and backend.
- [ ] **Performance:** Conduct performance analysis and implement optimizations like code splitting.
- [ ] **Accessibility:** Enhance accessibility to meet standard guidelines (WCAG).
