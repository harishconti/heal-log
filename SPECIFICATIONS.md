# Specifications

This document outlines the specifications for the Clinic OS Lite application, including the Android production checklist, analysis, database schema, and deployment guide.

## Android Production Checklist

This document outlines the verification results for the Android build configuration to ensure its readiness for a production release.

### Build Configuration Verification

| Item | Status | Notes |
|---|---|---|
| **`app/build.gradle`** | | |
| Signing Configuration | :x: Needs Attention | The `release` build is currently using the `debug` signing key. A new release keystore must be generated and configured for a production release. **This is not a blocker for the beta.** |
| `minSdkVersion` | :white_check_mark: OK | Using value from root project properties. |
| `targetSdkVersion` | :white_check_mark: OK | Using value from root project properties. |
| Proguard | :question: Needs Verification | Proguard is enabled for release builds. The rules in `proguard-rules.pro` need to be reviewed to ensure they are sufficient for WatermelonDB and other dependencies. |
| **`build.gradle` (root)** | | |
| Kotlin Version | :white_check_mark: OK | Managed by the Expo and React Native Gradle plugins. |
| Gradle Version | :white_check_mark: OK | Managed by the Expo and React Native Gradle plugins. |
| NDK Version | :white_check_mark: OK | Managed by the Expo and React Native Gradle plugins. |
| **`app.json`** | | |
| Package Name | :x: Needs Attention | The `package` is set to `com.anonymous.frontend` and needs to be changed to `com.clinicoslite.app` for a production release. **This is not a blocker for the beta.** |
| `versionCode` | :white_check_mark: OK | Set to `1`. |
| `version` | :white_check_mark: OK | Set to `1.0.0`. |
| Android Permissions | :question: Needs Verification | No permissions are explicitly defined. A review of the app's functionality is needed to determine if any permissions are required. |

### Configuration Warnings and Recommendations

*   **Critical:** The release signing configuration must be fixed before building a release APK.
*   **High:** The package name in `app.json` must be updated to the production package name.
*   **Medium:** The Proguard rules should be reviewed to prevent any runtime issues in the release build.
*   **Low:** A review of the app's required permissions should be conducted.

### Production Readiness Score

**2/5**

The current configuration is not production-ready due to critical issues with the signing configuration and package name. However, the build is functional for beta testing.

### Steps Needed Before Building Release APK

1.  Generate a new release keystore.
2.  Update `app/build.gradle` to use the new release keystore for release builds.
3.  Update the `package` in `app.json` to `com.clinicoslite.app`.
4.  Review and update `proguard-rules.pro` as needed.
5.  Conduct a review of the app's required Android permissions.

## Analysis of the Clinic OS Lite Repository

This document provides a comprehensive analysis of the Clinic OS Lite repository, covering its project structure, tech stack, production readiness, missing features for beta release, and code quality issues.

### 1. Project Structure and Architecture

The repository is a monorepo containing a `frontend` React Native application and a `backend` FastAPI application.

*   **`frontend/`**: Contains the React Native application built with Expo. It follows a standard Expo project structure, with components, contexts, models, services, and screens. The `app/` directory uses Expo Router for file-based routing.
*   **`backend/`**: Contains the FastAPI application. It has a modular structure, with code organized into `api`, `core`, `db`, `models`, `schemas`, and `services` directories. This separation of concerns makes the backend code easy to maintain and extend.

### 2. Tech Stack Inventory

#### Frontend

*   **Framework**: React Native with Expo
*   **Navigation**: Expo Router
*   **State Management**: Zustand
*   **Offline Storage**: WatermelonDB with an SQLite adapter
*   **Forms**: `react-hook-form` and `zod` for validation
*   **API Communication**: `axios`
*   **Error Monitoring**: Sentry

#### Backend

*   **Framework**: FastAPI with Uvicorn/Gunicorn
*   **Database**: MongoDB, accessed via `motor` and the `beanie` ODM
*   **Authentication**: JWT-based, using `python-jose`, `passlib`, and `PyJWT`
*   **Error Monitoring**: Sentry
*   **Caching**: `fastapi-cache2` with a Redis backend
*   **Rate Limiting**: `slowapi`
*   **Data Validation**: `pydantic`

### 3. Identified Gaps for Production Readiness

*   **Frontend Testing**: The frontend has no test suite, which is a major gap for production readiness. This makes it difficult to catch regressions and ensure the quality of the user interface.
*   **CI/CD**: There is no CI/CD pipeline configured for the project. A CI/CD pipeline would automate the process of testing, building, and deploying the application.
*   **Logging**: While the backend has error monitoring, there is no structured logging system in place. A logging system would make it easier to debug issues in production.

### 4. Missing Features for Beta Release

Based on the project's memory, the following features are missing for the beta release:

*   **In-app feedback form**: There is no way for users to provide feedback from within the app.
*   **User onboarding flow**: There is no onboarding flow to guide new users through the app's features.

### 5. Code Quality Issues and Technical Debt

*   **Hardcoded Values**:
    *   The `checkout_session_url` in `backend/app/api/payments.py` is hardcoded.
    *   The `MEDICAL_GROUPS` and `LOCATIONS` arrays in `frontend/components/forms/PatientForm.tsx` are hardcoded.
*   **Large Components**: The `PatientForm.tsx` component is very large and could be broken down into smaller, more manageable components.
*   **Lack of Frontend Tests**: As mentioned earlier, the lack of frontend tests is a significant source of technical debt.

## Database Schema Documentation

This document outlines the MongoDB database schema for Clinic OS Lite. The schema is defined using `beanie` ODM.

### `users` Collection

Stores user information, including authentication details and subscription status.

| Field                   | Type      | Description                               |
| ----------------------- | --------- | ----------------------------------------- |
| `_id`                   | `UUID`    | **Primary Key.** The unique identifier for the user. |
| `email`                 | `String`  | The user's email address (must be unique). |
| `phone`                 | `String`  | The user's phone number.                  |
| `full_name`             | `String`  | The user's full name.                     |
| `medical_specialty`     | `String`  | The user's medical specialty.             |
| `password_hash`         | `String`  | The user's hashed password.               |
| `plan`                  | `String`  | The user's subscription plan (`basic` or `pro`). |
| `role`                  | `String`  | The user's role (`DOCTOR` or `ADMIN`).    |
| `subscription_status`   | `String`  | The status of the user's subscription.    |
| `subscription_end_date` | `Date`    | The date the user's subscription ends.      |
| `status`                | `String`  | The user's account status (`active`, etc.). |
| `created_at`            | `Date`    | The timestamp when the user was created.    |
| `updated_at`            | `Date`    | The timestamp when the user was last updated.|

### `patients` Collection

Stores patient records, linked to a specific user.

| Field               | Type     | Description                                      |
| ------------------- | -------- | ------------------------------------------------ |
| `_id`               | `UUID`   | **Primary Key.** The unique identifier for the patient. |
| `patient_id`        | `String` | A user-specific identifier for the patient.      |
| `user_id`           | `UUID`   | **Foreign Key.** The ID of the user who owns this patient record. |
| `name`              | `String` | The patient's full name.                         |
| `phone`             | `String` | The patient's phone number.                      |
| `email`             | `String` | The patient's email address.                     |
| `address`           | `String` | The patient's physical address.                  |
| `location`          | `String` | The location of the patient's visit.             |
| `initial_complaint` | `String` | The patient's initial complaint.                 |
| `initial_diagnosis` | `String` | The initial diagnosis for the patient.           |
| `photo`             | `String` | A base64-encoded string of the patient's photo.  |
| `group`             | `String` | The medical group the patient belongs to.        |
| `is_favorite`       | `Boolean`| Whether the patient is marked as a favorite.     |
| `created_at`        | `Date`   | The timestamp when the patient was created.      |
| `updated_at`        | `Date`   | The timestamp when the patient was last updated. |

**Indexes:**
*   `user_id`, `patient_id` (unique)
*   `user_id`, `created_at`

### `clinical_notes` Collection

Stores clinical notes for patients, linked to a specific patient and user.

| Field        | Type     | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| `_id`        | `UUID`   | **Primary Key.** The unique identifier for the note. |
| `patient_id` | `UUID`   | **Foreign Key.** The ID of the patient this note belongs to. |
| `user_id`    | `UUID`   | **Foreign Key.** The ID of the user who wrote this note. |
| `content`    | `String` | The content of the clinical note.                |
| `visit_type` | `String` | The type of visit (`regular`, `follow-up`, `emergency`). |
| `created_at` | `Date`   | The timestamp when the note was created.         |
| `updated_at` | `Date`   | The timestamp when the note was last updated.    |

**Indexes:**
*   `patient_id`
*   `user_id`

## Deployment Guide

This document provides a template for deploying the Clinic OS Lite application to a production environment.

### Backend Deployment

#### 1. Build the Docker Image

The backend includes a `Dockerfile` that can be used to build a production-ready Docker image.

```bash
docker build -t clinic-os-lite-backend:latest backend
```

#### 2. Configure Environment Variables

Create a `.env.production` file with the following environment variables:

```
ENV=production
SECRET_KEY=your_production_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MONGO_URL=your_production_mongo_url
DB_NAME=your_production_db_name
REDIS_URL=your_production_redis_url
ALLOWED_ORIGINS=https://your-frontend-domain.com
SENTRY_DSN=your_sentry_dsn
```

#### 3. Run the Docker Container

Run the Docker container, passing in the production environment variables.

```bash
docker run -d -p 8000:8000 --env-file .env.production --name clinic-os-lite-backend clinic-os-lite-backend:latest
```

### Frontend Deployment

#### 1. Configure Environment Variables

Create a `.env.production` file in the `frontend` directory with the following environment variables:

```
EXPO_PUBLIC_BACKEND_URL=https://your-backend-api-domain.com
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### 2. Build for Web

To build the web application, run the following command from the `frontend` directory:

```bash
npx expo export:web
```

The output will be in the `frontend/dist` directory. You can then deploy this directory to any static hosting service (e.g., Netlify, Vercel, AWS S3).

#### 3. Build for Android

To build a standalone Android app, run the following command from the `frontend` directory:

```bash
eas build -p android --profile production
```

This will create a production build of the Android app, which you can then submit to the Google Play Store.

#### 4. Build for iOS

To build a standalone iOS app, run the following command from the `frontend` directory:

```bash
eas build -p ios --profile production
```

This will create a production build of the iOS app, which you can then submit to the Apple App Store.

### DNS and SSL

*   **DNS:** Point your domain names to the IP addresses of your backend and frontend servers.
*   **SSL:** Use a service like Let's Encrypt to obtain and install SSL certificates for your domains to enable HTTPS.

## MongoDB Atlas Free Tier Setup Guide

This guide provides a comprehensive walkthrough for setting up a free M0 tier MongoDB Atlas cluster for the Clinic OS Lite application.

### 1. Account Creation

1.  Navigate to the [MongoDB Atlas website](https://www.mongodb.com/cloud/atlas/register).
2.  Fill in the registration form to create a new account.
3.  Verify your email address to complete the registration.

*(Screenshot: MongoDB Atlas registration page)*

### 2. Creating an M0 Free Tier Cluster

1.  After logging in, you will be prompted to create a new cluster.
2.  Select the **"M0"** free tier option.
3.  Choose a cloud provider and region. We recommend selecting a region that is geographically closest to your users for lower latency.
4.  Give your cluster a name (e.g., `clinicos-lite-cluster`).
5.  Click **"Create Cluster"**.

*(Screenshot: MongoDB Atlas cluster creation page)*

### 3. Database User Configuration

1.  In the cluster dashboard, navigate to **"Database Access"** under the **"Security"** section.
2.  Click **"Add New Database User"**.
3.  Enter a username (e.g., `clinicos_lite_user`).
4.  Generate a strong, secure password and store it safely.
5.  Under **"Database User Privileges"**, select **"Read and write to any database"**.
6.  Click **"Add User"**.

*(Screenshot: MongoDB Atlas database user creation page)*

### 4. Network Access / IP Whitelist Setup

1.  Navigate to **"Network Access"** under the **"Security"** section.
2.  Click **"Add IP Address"**.
3.  To allow access from your local machine, click **"Add My Current IP Address"**.
4.  For production deployments, you will need to add the IP address of your application server.
5.  Click **"Confirm"**.

*(Screenshot: MongoDB Atlas network access page)*

### 5. Connection String Format

1.  In the cluster dashboard, click the **"Connect"** button.
2.  Select **"Connect your application"**.
3.  Choose the **"Python"** driver and the latest version.
4.  Copy the provided connection string. It will look something like this:
    ```
    mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
    ```
5.  Replace `<username>` and `<password>` with the credentials you created in step 3.
6.  Add this connection string to your `.env` file as `MONGO_URL`.

### 6. Database Initialization Requirements

To populate the database with initial data, run the following command from the root of the project:

```bash
python3 run_init_db.py
```

This script will create the necessary collections and seed the database with initial data.

### 7. Index Creation for Collections

The application's schemas define the following indexes that are crucial for performance:

*   **Users Collection:**
    *   A unique index on the `email` field to ensure that each user has a unique email address.
*   **Patients Collection:**
    *   A compound unique index on `(user_id, patient_id)` to ensure that each patient has a unique ID per user.
    *   A compound index on `(user_id, created_at)` to optimize queries for fetching patients for a specific user, sorted by creation date.
*   **Clinical Notes Collection:**
    *   An index on `patient_id` to quickly retrieve all notes for a specific patient.
    *   An index on `user_id` to quickly retrieve all notes for a specific user.

These indexes are automatically created by the application when it starts up.

### 8. Monitoring and Alerts Setup

1.  In the cluster dashboard, navigate to the **"Metrics"** tab to monitor the performance of your cluster.
2.  Go to the **"Alerts"** section to configure basic alerts for metrics like CPU usage, memory usage, and disk space.

*(Screenshot: MongoDB Atlas monitoring page)*

### 9. Backup Configuration

The M0 free tier includes daily backups. You can view and restore backups from the **"Backup"** tab in the cluster dashboard.

*(Screenshot: MongoDB Atlas backup page)*

### 10. Storage Limit Warnings

The M0 free tier has a storage limit of 512MB. It is important to monitor your storage usage to avoid hitting this limit. You can set up an alert to be notified when your storage usage reaches a certain threshold (e.g., 80%).

## Sentry Monitoring Setup

This document outlines the process for setting up and verifying Sentry error monitoring for the FastAPI backend.

### 1. Prerequisites

- A Sentry account and a project created for this application.

### 2. Configuration

1.  **Find your DSN:** In your Sentry project settings, navigate to "Client Keys (DSN)" and copy the DSN value.

2.  **Create a `.env` file:** The application loads environment variables from a `.env` file located in the project's root directory. If you don't have one, create it by copying from the example:
    ```bash
    cp backend/.env.example .env
    ```

3.  **Update `.env`:** Add the following variables to your `.env` file, replacing `your_sentry_dsn_here` with the DSN you copied.

    ```
    SENTRY_DSN=your_sentry_dsn_here
    SENTRY_ENVIRONMENT=beta
    ```

    - `SENTRY_DSN`: The unique identifier for your Sentry project.
    - `SENTRY_ENVIRONMENT`: The environment tag for the errors (e.g., `development`, `beta`, `production`).

### 3. Testing the Integration

To verify that Sentry is correctly capturing errors, a test endpoint has been created.

1.  **Run the backend server.**

2.  **Send a request to the test endpoint:** You can use `curl` or any API client to send a GET request to the following endpoint:
    ```bash
    curl -X GET "http://127.0.0.1:8000/api/debug/sentry-test"
    ```

3.  **Check your Sentry Dashboard:** After sending the request, you should see a new issue appear in your Sentry project's dashboard corresponding to the `Sentry Test Exception`.

### 4. Example Error Capture

The test endpoint `/api/debug/sentry-test` is designed to raise a `ZeroDivisionError` to confirm that Sentry is working.

```python
# From backend/app/api/debug.py
@router.get("/sentry-test")
async def sentry_test():
    """
    Raises an exception to test Sentry error reporting.
    """
    try:
        1 / 0
    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise APIException(status_code=500, detail="Sentry test exception captured.")
```

### 5. Troubleshooting

- **Errors not appearing in Sentry:**
    - Double-check that your `SENTRY_DSN` is correct in your `.env` file.
    - Ensure the backend server was restarted after setting the environment variables.
    - Check the server logs for any Sentry-related initialization errors.

- **Sensitive Data:**
    - Sentry's server-side scrubbing rules should be configured in the Sentry dashboard to prevent sensitive data (e.g., passwords, API keys) from being stored.

## Error Monitoring with Sentry (Frontend)

This document outlines the setup and usage of Sentry for error monitoring in the React Native frontend application.

### Setup

1.  **Sentry Account**: Ensure you have a Sentry account and a project created for this application.
2.  **DSN Configuration**:
    *   Create a `.env` file in the `frontend` directory by copying the `.env.example` file.
    *   Update the `EXPO_PUBLIC_SENTRY_DSN` in your `.env` file with the DSN from your Sentry project settings.

### How it Works

*   **Initialization**: Sentry is initialized at the application's root in `frontend/app/_layout.tsx`. The `initMonitoring` function from `frontend/utils/monitoring.ts` is called, which configures the Sentry SDK.
*   **Error Boundary**: A custom React `ErrorBoundary` component, located in `frontend/utils/monitoring.ts`, wraps the entire application. This component catches any rendering errors, displays a fallback UI to the user, and reports the error to Sentry.
*   **Manual Error Reporting**: The `captureException` helper function in `frontend/utils/monitoring.ts` can be used to manually report errors to Sentry. This is useful for catching errors in `try...catch` blocks.
*   **Breadcrumbs**: Sentry breadcrumbs are used to log key user actions, providing context for errors. Breadcrumbs are added for:
    *   Login attempts (`frontend/app/login.tsx`)
    *   Patient creation (`frontend/app/add-patient.tsx`)
    *   Data synchronization (`frontend/services/sync.ts`)

### Testing

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

### Viewing Errors by Platform

Sentry automatically tags issues with the platform (e.g., `android`, `ios`, `javascript` for web). You can filter issues by these tags in the Sentry UI to view errors specific to each platform.
