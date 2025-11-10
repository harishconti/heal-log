# API Documentation

This document provides detailed information about the Clinic OS Lite API endpoints.

## Authentication

### `POST /api/auth/register`

Registers a new user and returns an access token, refresh token, and user info.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "your_password",
  "full_name": "New User Name",
  "phone": "(555) 555-1234",
  "medical_specialty": "General Practice"
}
```

**Response:**
```json
{
  "success": true,
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "token_type": "bearer",
  "user": {
    "id": "new_user_id",
    "email": "newuser@example.com",
    "full_name": "New User Name",
    "phone": "(555) 555-1234",
    "medical_specialty": "General Practice",
    "role": "DOCTOR",
    "plan": "BASIC",
    "subscription_status": "TRIALING",
    "subscription_end_date": "YYYY-MM-DDTHH:MM:SS.ffffff+00:00"
  }
}
```

### `POST /api/auth/login`

Authenticates a user and returns an access token and a refresh token.

**Request Body:**
```json
{
  "username": "user@example.com",
  "password": "your_password"
}
```

**Response:**
```json
{
  "access_token": "your_access_token",
  "refresh_token": "your_refresh_token",
  "token_type": "bearer"
}
```

### `POST /api/auth/refresh`

Refreshes an expired access token using a valid refresh token.

**Request Body:**
```json
{
  "refresh_token": "your_refresh_token"
}
```

**Response:**
```json
{
  "access_token": "new_access_token",
  "refresh_token": "new_refresh_token",
  "token_type": "bearer"
}
```

### `GET /api/auth/me`

Retrieves the currently authenticated user's information.

**Authentication:** Bearer Token

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "DOCTOR",
  "plan": "PRO"
}
```

## Users

### `POST /api/users/`

Creates a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "new_password",
  "full_name": "New User"
}
```

**Response:**
```json
{
  "id": "new_user_id",
  "email": "newuser@example.com",
  "full_name": "New User"
}
```

### `GET /api/users/me`

Retrieves the currently authenticated user's profile.

**Authentication:** Bearer Token

**Response:**
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "full_name": "User Name",
  "role": "DOCTOR",
  "plan": "PRO"
}
```

## Patients

### `POST /api/patients/`

Creates a new patient.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "123-456-7890",
  "email": "john.doe@example.com",
  "address": "123 Main St",
  "location": "Clinic",
  "initial_complaint": "Headache",
  "initial_diagnosis": "Migraine",
  "group": "general"
}
```

**Response:** The created patient object.

### `GET /api/patients/`

Retrieves a list of patients for the current user.

**Authentication:** Bearer Token

**Response:** A list of patient objects.

### `GET /api/patients/{patient_id}`

Retrieves a specific patient by ID.

**Authentication:** Bearer Token

**Response:** The requested patient object.

### `PUT /api/patients/{patient_id}`

Updates a specific patient by ID.

**Authentication:** Bearer Token

**Request Body:** The fields to update.

**Response:** The updated patient object.

### `DELETE /api/patients/{patient_id}`

Deletes a specific patient by ID.

**Authentication:** Bearer Token

**Response:**
```json
{
  "message": "Patient deleted successfully"
}
```

## Clinical Notes

### `POST /api/patients/{patient_id}/notes`

Creates a new clinical note for a patient.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "content": "Patient is feeling better."
}
```

**Response:** The created clinical note object.

### `GET /api/patients/{patient_id}/notes`

Retrieves a list of clinical notes for a patient.

**Authentication:** Bearer Token

**Response:** A list of clinical note objects.

## Sync

### `POST /api/sync/pull`

Pulls changes from the server since the last sync.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "last_pulled_at": "timestamp"
}
```

**Response:**
```json
{
  "changes": {
    "patients": { "created": [], "updated": [], "deleted": [] },
    "clinical_notes": { "created": [], "updated": [], "deleted": [] }
  },
  "timestamp": "new_timestamp"
}
```

### `POST /api/sync/push`

Pushes local changes to the server.

**Authentication:** Bearer Token

**Request Body:**
```json
{
  "changes": {
    "patients": { "created": [], "updated": [], "deleted": [] },
    "clinical_notes": { "created": [], "updated": [], "deleted": [] }
  }
}
```

**Response:**
```json
{
  "status": "success"
}
```
