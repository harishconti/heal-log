# Clinic OS Lite

Clinic OS Lite is a patient management system with a FastAPI backend and a React Native frontend designed for Web, iOS, and Android platforms.

## Technical Architecture

The application uses a decoupled, three-tier architecture. The core is a **FastAPI backend** that serves as the single source of truth and handles all business logic. It communicates with a **cross-platform React Native client** that targets iOS, Android, and Web, providing a consistent user experience across devices.

### Backend

The backend is a FastAPI application with a modular structure. The main entrypoint is `backend/main.py`.

-   **`api/`**: API endpoint definitions (routers).
-   **`core/`**: Core application logic, configuration, and security.
-   **`db/`**: Database session management and initialization.
-   **`models/`**: Pydantic models for database collections.
-   **`schemas/`**: Pydantic schemas for API request/response validation.
-   **`services/`**: Business logic, separated from the API layer.

### Frontend

The frontend is a React Native application built with Expo. The main entrypoint is `frontend/app/index.tsx`.

-   **`app/`**: Uses Expo Router for file-based routing.
-   **`components/`**: Reusable React Native components.
-   **`contexts/`**: React contexts for state management.
-   **`models/`**: WatermelonDB models for offline data storage.
-   **`services/`**: Services for interacting with the backend API.

## API Documentation

### Authentication

#### `POST /api/auth/register`

Registers a new user.

#### `POST /api/auth/login`

Authenticates a user.

#### `POST /api/auth/refresh`

Refreshes an expired access token.

#### `GET /api/auth/me`

Retrieves the currently authenticated user's information.

### Users

#### `POST /api/users/`

Creates a new user.

#### `GET /api/users/me`

Retrieves the currently authenticated user's profile.

### Patients

#### `POST /api/patients/`

Creates a new patient.

#### `GET /api/patients/`

Retrieves a list of patients for the current user.

#### `GET /api/patients/{patient_id}`

Retrieves a specific patient by ID.

#### `PUT /api/patients/{patient_id}`

Updates a specific patient by ID.

#### `DELETE /api/patients/{patient_id}`

Deletes a specific patient by ID.

### Clinical Notes

#### `POST /api/patients/{patient_id}/notes`

Creates a new clinical note for a patient.

#### `GET /api/patients/{patient_id}/notes`

Retrieves a list of clinical notes for a patient.

### Sync

#### `POST /api/sync/pull`

Pulls changes from the server since the last sync.

#### `POST /api/sync/push`

Pushes local changes to the server..
