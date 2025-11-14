# Integration Testing and Issues
**Version:** 2.5
**Date:** 2025-10-21

This document tracks the major open issues and the overall testing status for the Clinic OS Lite application.

## Testing Environment
- **Backend:** FastAPI server running on `http://localhost:8000`
- **Frontend:** React Native app (iOS/Android/Web) running on `http://localhost:8081`
- **Database:** Local MongoDB instance
- **Backend Tests:** `pytest` running from the project root

---

## 1. Open Issues
- **Frontend testing is not yet implemented.** The project does not have a configured test script for running automated frontend tests. All attempts to set up Playwright for the React Native web application have been unsuccessful.

---

## 2. Testing Summary

### Backend API
- **Status:** **Partially Stable.**
- **Details:** The backend API is partially stable, but there are a number of failing tests that need to be addressed.

### Known Backend Test Failures
*   `test_api_users.py::test_read_users_success_for_admin`: Fails with an `AttributeError`, indicating an issue with the user object being returned from the API.
*   `test_auth_flow.py::test_refresh_token_returns_new_refresh_token`: Fails with a `KeyError`, indicating an issue with the refresh token response.
*   `test_core_functionality.py::test_expired_token_access`: Fails with a `401 Unauthorized` error, but the test expects a `403 Forbidden` error.
*   `test_core_functionality.py::test_create_duplicate_patient`: Fails with a `404 Not Found` error, but the test expects a `201 Created` error.
*   `test_core_functionality.py::test_database_error_handling`: Fails with a `404 Not Found` error, but the test expects a `500 Internal Server Error` error.
*   `test_core_functionality.py::test_update_patient`: Fails with a `404 Not Found` error, but the test expects a `200 OK` error.
*   `test_core_functionality.py::test_delete_patient`: Fails with a `404 Not Found` error, but the test expects a `200 OK` error.
*   `test_sync_edge_cases.py::test_sync_conflict_resolution`: Fails with an `AssertionError`, indicating an issue with the sync conflict resolution.

### Frontend (iOS, Android & Web)
- **Status:** **Operational.**
- **Details:** The frontend is now rendering and operational after fixing the infinite loading screen issue. The Android build is now functional.
- **Testing:** The project does not have a configured test script for running automated frontend tests. All attempts to set up Playwright for the React Native web application have been unsuccessful.

---

## 3. Resolved Issues Summary
Numerous issues have been resolved to reach the current stable state, including:
- **Android Build Failure:** Resolved the critical blocker that prevented the Android build from compiling. The solution involved:
    - Correcting the Babel configuration to support WatermelonDB's decorators.
    - Installing and configuring a complete Android SDK and NDK.
    - Resolving a complex dependency conflict with `react-native-reanimated` by enabling the React Native New Architecture.
- **Frontend Infinite Loading Screen:** Resolved the critical blocker that prevented the frontend from rendering. The fix involved multiple steps:
    - Corrected the `AuthContext` to properly fetch user data when a token is loaded from storage, which fixed the primary cause of the loading screen hang.
    - Added the missing `lib/validation/index.ts` file with `zod` schemas, which was causing a module resolution crash in the Metro bundler.
    - Implemented the `useInitializeTheme` hook to correctly load fonts and initialize the application theme.
- **Data Access and Caching Issues:** Resolved a critical bug where the backend caching layer (`@alru_cache`) caused stale data to be served during tests. The fix involved creating a debug endpoint (`/api/debug/clear-all-caches`) and adding a new test to the suite that clears the cache before each run, ensuring a clean state.
- **Critical Frontend Bugs:**
    - Fixed an infinite loading screen (state hydration) and an infinite loop caused by an incorrect HOC implementation.
    - Corrected the login API call to send `application/x-www-form-urlencoded` data instead of `JSON`.
- **API and Data Integrity:** Corrected API conventions, fixed a user role assignment bug, and implemented robust server-side validation.
- **Data Synchronization:** Implemented the full backend sync API and resolved multiple configuration issues with the WatermelonDB setup (adapters, options).
- **Demo User Login:** Resolved a critical login failure for the primary demo user (`dr.sarah@clinic.com`).

### Comprehensive Backend Functional Tests
- **Status:** **Complete.**
- **Details:** A comprehensive suite of functional tests for the backend has been implemented, covering authentication, session handling, CRUD operations, and data synchronization. This test suite has significantly improved the stability and reliability of the backend.
- **Bugs Fixed:**
    - **`DuplicateKeyError`:** Resolved a critical bug where the `patient_id` was not unique per user, causing database errors. The fix involved changing the unique index on the `patients` collection to be a compound index on both `user_id` and `patient_id`.
    - **`OperationFailure`:** Fixed a bug where the `BaseService.get` method was passing `user_id` as a keyword argument to a database find method that doesn't accept it, instead of including it in the filter dictionary.
    - **`ResponseValidationError`:** Resolved a bug where the sync endpoint was not serializing the `_id` field to `id`, causing a validation error.

## Running the Tests

To run all of the tests, run the following command from the root of the project:

```bash
SECRET_KEY=test MONGO_URL=mongodb://localhost:27017 DB_NAME=test_db PYTHONPATH=backend python3 -m pytest backend/tests/
```

## Load Testing

To run the load test, run the following command from the root of the project:

```bash
locust -f backend/tests/load_test.py
```

This will start the Locust web UI on port 8089. You can then open a browser to http://localhost:8089 and start the test.
