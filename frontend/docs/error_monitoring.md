# Error Monitoring with Sentry

This document outlines the setup and usage of Sentry for error monitoring in the React Native frontend application.

## Setup

1.  **Sentry Account**: Ensure you have a Sentry account and a project created for this application.
2.  **DSN Configuration**:
    *   Create a `.env` file in the `frontend` directory by copying the `.env.example` file.
    *   Update the `EXPO_PUBLIC_SENTRY_DSN` in your `.env` file with the DSN from your Sentry project settings.

## How it Works

*   **Initialization**: Sentry is initialized at the application's root in `frontend/app/_layout.tsx`. The `initMonitoring` function from `frontend/utils/monitoring.ts` is called, which configures the Sentry SDK.
*   **Error Boundary**: A custom React `ErrorBoundary` component, located in `frontend/utils/monitoring.ts`, wraps the entire application. This component catches any rendering errors, displays a fallback UI to the user, and reports the error to Sentry.
*   **Manual Error Reporting**: The `captureException` helper function in `frontend/utils/monitoring.ts` can be used to manually report errors to Sentry. This is useful for catching errors in `try...catch` blocks.
*   **Breadcrumbs**: Sentry breadcrumbs are used to log key user actions, providing context for errors. Breadcrumbs are added for:
    *   Login attempts (`frontend/app/login.tsx`)
    *   Patient creation (`frontend/app/add-patient.tsx`)
    *   Data synchronization (`frontend/services/sync.ts`)

## Testing

To verify that Sentry is working correctly, you can trigger a test error.

1.  **Create a Test Button**: Add a button to any component that, when pressed, throws an error.

    ```tsx
    import { Button } from 'react-native';
    import { captureException } from '../utils/monitoring';

    const TestSentryButton = () => (
      <Button
        title="Test Sentry"
        onPress={() => {
          try {
            throw new Error('This is a test error from the frontend.');
          } catch (error) {
            captureException(error);
            alert('Test error sent to Sentry!');
          }
        }}
      />
    );
    ```

2.  **Trigger the Error**: Run the application and press the "Test Sentry" button.

3.  **Verify in Sentry**: Go to your Sentry project's "Issues" page. You should see a new issue with the title "This is a test error from the frontend.". The issue details should include the user's device information, breadcrumbs, and a stack trace.

## Viewing Errors by Platform

Sentry automatically tags issues with the platform (e.g., `android`, `ios`, `javascript` for web). You can filter issues by these tags in the Sentry UI to view errors specific to each platform.
