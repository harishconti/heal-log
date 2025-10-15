# Integration Testing and Issues

This document tracks the integration testing process and any issues or bugs found in the Clinic OS Lite application.

## Testing Environment
- **Backend:** FastAPI server running on `http://localhost:8000`
- **Frontend:** React Native app running on `http://localhost:8081`
- **Database:** MongoDB

## Testing Plan
1. Test backend endpoints directly.
2. Test frontend application functionality.
3. Document all issues found with steps to reproduce.

---

## Open Issues

### 1. API Convention: Password validation during registration
- **Issue:** The backend enforces password complexity rules, but these are not explicitly documented for the API user. The registration endpoint requires at least one number in the anumber in the password.
- **Status:** Identified. The long-term fix would be to document this requirement in the API specification.

### 4. API Convention: Incorrect `Content-Type` for Login Endpoint
- **Issue:** The `/api/auth/login` endpoint expects a `Content-Type` of `application/json`, but the common standard for token endpoints (OAuth2) is `application/x-www-form-urlencoded`. This can lead to confusion and integration errors.
- **Status:** Identified. The workaround is to send the login credentials as JSON. The long-term fix would be to align with the OAuth2 standard or clearly document the expected content type.

### 5. API Convention: Inconsistent Field Name for Login
- **Issue:** The `/api/auth/login` endpoint requires the username to be passed in a field named `email`, while the registration uses `email` and many systems use `username`. The API should be consistent.
- **Status:** Identified. The workaround is to use the `email` field. The long-term fix would be to accept both `username` and `email` or to be consistent across the API.

### 6. API Convention: User Endpoint is at `/api/auth/me`, not `/api/users/me`
- **Issue:** The endpoint to fetch the current user's data is located at `/api/auth/me`, which is not the conventional `/api/users/me`. This can cause confusion for developers integrating with the API.
- **Status:** Identified. The workaround is to use the correct endpoint. The long-term fix would be to move the endpoint to a more conventional path for better API design.

---

## Backend API Testing Summary
The backend API has been tested for the following functionalities:
- **User Registration:** Works as expected. New users are correctly assigned the `doctor` role.
- **User Login:** The login process works but has some minor inconsistencies in the API design (e.g., content type, field names).
- **User Data Retrieval:** The endpoint for fetching user data is non-standard (`/api/auth/me` instead of `/api/users/me`).
- **Patient CRUD:** All CRUD operations (Create, Read, Update, Delete) for patients are working correctly for authorized users (i.e., users with the `DOCTOR` role).

---

## Resolved Issues

### New Users are Assigned 'patient' Role Instead of 'doctor'
- **Status:** **Resolved.** Analysis of `backend/app/models/user.py` confirmed that the default role for new users is now correctly set to `UserRole.DOCTOR`.

### Incorrect WatermelonDB Adapter for Web Build
- **Status:** **Resolved.** Analysis of `frontend/models/adapters/index.ts` confirmed the web build correctly uses the `LokiJSAdapter`, not a native SQLite adapter.

### Missing `useIncrementalIndexedDB` Option in LokiJSAdapter
- **Status:** **Resolved.** Analysis of `frontend/models/adapters/index.ts` confirmed the `useIncrementalIndexedDB: true` option is correctly set for the `LokiJSAdapter`.

### Incorrect HOC Implementation Causes Infinite Loop
- **Status:** **Resolved.** Analysis of `frontend/app/index.tsx` confirmed the `withObservables` HOC is now implemented correctly, preventing the infinite loop.

### Infinite Loading Screen due to State Hydration Issue
- **Status:** **Resolved.** Analysis of `frontend/contexts/AuthContext.tsx` confirmed that `useAppStore.persist.rehydrate()` is called explicitly during app initialization, resolving the state hydration issue.

### Missing Backend Sync API Endpoints
- **Status:** **Resolved.** Implemented the entire synchronization API on the backend, including `/api/sync/pull` and `/api/sync/push` endpoints.

### Missing Validation File Causes Frontend Build to Fail
- **Status:** **Resolved.** Created the missing `frontend/lib/validation/index.ts` file with the correct Zod schema for patient validation.