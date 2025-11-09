# Android Beta MVP Scope
**Objective:** Define the minimum viable feature set for a stable and successful Android beta release in 10-14 days.

---

## 1. Beta MVP Feature List (Minimum Viable)
This list represents the core functionality that must be stable and working for the beta release.

- **Authentication & User Management:**
  - [x] User registration and login
  - [x] Secure session management (JWT)
  - [x] Profile screen displaying plan/trial status
- **Patient Management:**
  - [x] Create, Read, Update, Delete (CRUD) patients
- **Clinical Notes:**
  - [x] Add and view clinical notes for each patient
- **Offline Synchronization:**
  - [x] Robust data sync between the device (WatermelonDB) and the backend server
- **UI/UX:**
  - [x] Dark Mode support
  - [x] Basic responsive layout for different Android screen sizes

---

## 2. Deferred to v1.1 (Post-Beta)
To ensure a focused and stable beta, the following features will be deferred.

- **Document Management (Pro Feature):**
  - Document uploads, viewing, and management.
- **Appointments System:**
  - API and UI for scheduling and managing appointments.
- **Web Dashboard:**
  - The entire web-based dashboard for Pro users.
- **Advanced Analytics:**
  - Detailed analytics and visualizations.
- **UI/UX Enhancements:**
  - Advanced animations, haptic feedback, and loading skeletons.

---

## 3. Beta-Specific Additions Needed
These features are critical for managing the beta program effectively.

- **🔴 In-App Feedback Form:** A simple form to allow beta users to submit feedback and bug reports directly within the app.
- **✅ Error Reporting Integration:** Integrated Sentry for error monitoring.
- **🟡 Beta User Welcome Screen:** A one-time welcome screen that thanks users for participating and provides key information.
- **🟡 Known Issues Disclaimer:** A small, accessible screen or notice that lists known issues to manage user expectations.
- **🟡 "Report a Bug" Button:** A persistent, easily accessible button (e.g., in the app settings) that links to the feedback form.

---

## 4. Pre-Launch Checklist
A final checklist to ensure all critical tasks are completed before the launch.

- [ ] **Android Build:** Confirm the Android release build is working and can be installed on test devices.
- [ ] **Demo Accounts:** Test the entire user flow with all provided demo/beta accounts.
- [ ] **Backend Tests:** Ensure all backend tests are passing (100% coverage on critical paths).
- [ ] **Security Audit:** Perform a final review of authentication, authorization, and data handling.
- [ ] **API Configuration:** Verify API rate limits and production environment settings are correctly configured.
- [ ] **Database Backups:** Confirm that the automated database backup mechanism is active and tested.
- [x] **Error Monitoring:** Ensure the selected error monitoring service is active and correctly configured.
- [ ] **Feedback Mechanism:** Verify the in-app feedback form is functional and sending data to the expected destination.

---

## 5. Proposed Timeline
A high-level timeline to guide the final push to beta.

- **Days 1-3:** **Blocker Resolution (Android Build & Stability)**
  - Final testing and confirmation of the Android build process.
  - Address any remaining critical stability issues.
- **Days 4-5:** **Beta-Specific Features**
  - Implement the in-app feedback form and error reporting integration.
- **Days 6-7:** **Intensive Testing & Security Review**
  - Conduct a full regression test of all MVP features.
  - Complete the security audit.
- **Days 8-9:** **Deployment & Configuration**
  - Deploy the production-ready backend.
  - Configure all required services (database, error monitoring, etc.).
- **Days 10-11:** **Beta User Onboarding Preparation**
  - Prepare welcome emails, documentation, and test accounts for beta users.
- **Days 12-14:** **Soft Launch & Monitoring**
  - Distribute the app to the beta group and closely monitor for issues.
