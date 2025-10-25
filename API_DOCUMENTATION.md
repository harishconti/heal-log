# API Documentation
**Version:** 2.0
**Date:** 2025-10-25

This document provides an overview of the Clinic OS Lite API endpoints.

## Authentication

### `POST /api/auth/register`
Register a new user. New users are automatically assigned the `DOCTOR` role and placed on a 90-day trial of the `BASIC` plan.

- **Request Body:**
  - `email` (string, required): The user's email address.
  - `password` (string, required): The user's password.
  - `full_name` (string, required): The user's full name.
  - `phone` (string, optional): The user's phone number.
  - `medical_specialty` (string, optional): The user's medical specialty.
- **Response (201 Created):**
  - `success`: `true`
  - `access_token` (string): JWT access token.
  - `refresh_token` (string): JWT refresh token.
  - `token_type`: "bearer"
  - `user` (UserResponse object): The newly created user's information.

### `POST /api/auth/login`
Log in as an existing user. The request must be `application/x-www-form-urlencoded`.

- **Request Body (form-data):**
  - `username` (string, required): The user's email address.
  - `password` (string, required): The user's password.
- **Response:**
  - `success`: `true`
  - `access_token` (string): JWT access token.
  - `refresh_token` (string): JWT refresh token.
  - `token_type`: "bearer"
  - `user` (UserResponse object): The user's information.

### `POST /api/auth/refresh`
Refresh an access token using a valid refresh token.

- **Request Body:**
  - `refresh_token` (string, required): The user's refresh token.
- **Response:**
  - `access_token` (string): The new JWT access token.
  - `refresh_token` (string): The new JWT refresh token.
  - `token_type`: "bearer"

### `GET /api/auth/me`
Get the currently authenticated user's information.

- **Response:**
  - `success`: `true`
  - `user` (UserResponse object): The current user's information.

---

## Users

### `GET /api/users/`
Get a list of all users.
- **Permissions:** `ADMIN` role required.
- **Response:** A list of UserResponse objects.

---

## Patients

### `POST /api/patients/`
Create a new patient record.
- **Permissions:** `DOCTOR` role required.
- **Request Body:** `PatientCreate` schema.
- **Response (201 Created):** The created `PatientResponse` object.

### `GET /api/patients/`
Get all patients for the current user, with optional filters.

- **Query Parameters:**
  - `search` (string, optional): A search term to filter patients by name, email, etc.
  - `group` (string, optional): Filter patients by their assigned group.
  - `favorites_only` (boolean, optional): If true, return only favorite patients.
- **Response:** A list of `PatientResponse` objects.

### `GET /api/patients/{id}`
Get a single patient by their ID.

- **Response:** The `PatientResponse` object.

### `PUT /api/patients/{id}`
Update a patient's details.
- **Permissions:** `DOCTOR` role required.
- **Request Body:** `PatientUpdate` schema.
- **Response:** The updated `PatientResponse` object.

### `DELETE /api/patients/{id}`
Delete a patient record.
- **Permissions:** `DOCTOR` role required.
- **Response:**
  - `success`: `true`
  - `message`: "Patient deleted successfully"

### `POST /api/patients/{id}/notes`
Add a new clinical note to a patient's record.
- **Permissions:** `DOCTOR` role required.
- **Request Body:** `NoteCreate` schema.
- **Response (201 Created):** The created `ClinicalNoteResponse` object.

### `GET /api/patients/{id}/notes`
Get all clinical notes for a specific patient.

- **Response:** A list of `ClinicalNoteResponse` objects.

### `GET /api/patients/groups/`
Get a list of unique patient groups for the current user.

- **Response:**
  - `success`: `true`
  - `groups` (list of strings): A list of unique group names.

### `GET /api/patients/stats/`
Get user-specific statistics (total patients, favorites, etc.).

- **Response:**
  - `success`: `true`
  - `stats` (object): An object containing user statistics.

---

## Analytics (Pro Feature)

### `GET /api/analytics/patient-growth`
Get patient growth analytics data.
- **Permissions:** `PRO` plan required.
- **Response:** A list of data points for patient growth.

---

## Documents (Pro Feature)

### `POST /api/documents/`
Create a new document record.
- **Permissions:** `PRO` plan required.
- **Request Body:** `DocumentCreate` schema.
- **Response (201 Created):** The created `Document` object.

### `GET /api/documents/{patient_id}`
Get all documents for a specific patient.
- **Permissions:** `PRO` plan required.
- **Response:** A list of `Document` objects.

---

## Payments

### `POST /api/payments/create-checkout-session`
Creates a checkout session for a user to upgrade to the PRO plan.

- **Response:**
  - `checkout_url` (string): The URL for the payment checkout page.

---

## Data Synchronization

### `POST /api/sync/pull`
Handles the "pull" part of the synchronization process. The client sends the last time it pulled, and the server returns all changes since then.

- **Request Body:** `SyncRequest` schema with `last_pulled_at` timestamp.
- **Response:** `PullChangesResponse` object containing a `changes` object and a `timestamp`.

### `POST /api/sync/push`
Handles the "push" part of the synchronization process. The client sends its local changes, and the server applies them.

- **Request Body:** `SyncRequest` schema with a `changes` object.
- **Response:**
  - `status`: "ok"

---

## Webhooks

### `POST /api/webhooks/stripe`
Handles incoming webhooks from a payment provider like Stripe to update subscription status.

- **Response (200 OK):** An empty response to acknowledge receipt.

---

## Debug

### `POST /api/debug/clear-all-caches`
Clear all application-level caches. This endpoint is intended for use in a testing environment only.

- **Response:**
  - `success`: `true`
  - `message`: "All caches have been cleared."
