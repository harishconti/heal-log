# Changelog

This document outlines the improvements made to the Clinic OS Lite application.

## Frontend Improvements

### State Management

*   **Prop Drilling**: The `PatientForm` component has been refactored to use `react-hook-form` and a centralized Zod schema for validation, which eliminates prop drilling and improves state management.
*   **Over-reliance on useState**: The `LoginScreen` has been refactored to use the global `useAppStore` for loading state, which is more consistent with the rest of the application.

### Performance

*   **Large Component Renders**: The patient list in `frontend/app/index.tsx` has been refactored to use `FlashList`, which virtualizes the list and improves performance, especially when dealing with a large number of patients.

### User Experience

*   **No Loading Indicators on Button Presses**: Loading indicators have been added to button presses in the `LoginScreen`, which provides visual feedback to the user and makes the app feel more responsive.
*   **Lack of Input Validation**: Robust client-side form validation has been implemented using `zod` and `react-hook-form`, which improves the user experience and reduces the number of invalid requests to the backend.
*   **Theme-Aware Components**: The `ControlledInput` and `LoginScreen` components have been refactored to be theme-aware, which ensures that they are displayed correctly in both light and dark modes.

## Backend Improvements

### Security

*   **Hardcoded Secret Key**: The `SECRET_KEY` in `backend/app/core/config.py` was hardcoded. This has been moved to an environment variable to mitigate security risks.
*   **Broad Exception Handling**: The broad `try...except` blocks in `backend/app/api/patients.py` have been refactored to catch more specific exceptions, which improves error handling and debugging.

### Database

*   **Connection Pooling**: The database session management in `backend/app/db/session.py` now explicitly configures connection pooling, which can improve performance under heavy load.
*   **Manual Indexing**: The manual database indexing in `backend/app/db/indexing.py` has been replaced with `beanie`, a modern Object-Document Mapper, which simplifies schema management and automates index creation.

### Code Quality

*   **Unit and Integration Tests**: A comprehensive suite of unit and integration tests has been added to the backend to ensure code quality and prevent regressions.
*   **Generic Base Service**: The `user_service.py` and `patient_service.py` have been refactored to use a generic `BaseService`, which reduces code duplication and improves maintainability.
