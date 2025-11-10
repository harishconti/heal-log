# API Documentation

This document provides detailed information about the Clinic OS Lite API endpoints.

## Authentication

Authentication is handled via JWT (JSON Web Tokens). The standard flow involves exchanging user credentials for an access token and a refresh token. The access token is used to authenticate subsequent requests, while the refresh token is used to obtain a new access token once the old one expires.

### Authentication Flow

The authentication process follows these steps:

1.  The client sends the user's email and password to the `/api/auth/login` endpoint.
2.  The server validates the credentials.
3.  If valid, the server generates a short-lived `access_token` and a long-lived `refresh_token` and returns them to the client.
4.  The client stores these tokens securely.
5.  For all subsequent requests to protected endpoints, the client includes the `access_token` in the `Authorization` header as a Bearer token.
6.  When the `access_token` expires, the client sends the `refresh_token` to the `/api/auth/refresh` endpoint to get a new pair of tokens.

Here is a diagram illustrating the flow:

```
   Client                           Server
     |                                |
     |----(1) POST /api/auth/login--->|
     |    (email, password)           |
     |                                |
     |<---(2) 200 OK------------------|
     | (access_token, refresh_token)  |
     |                                |
     |----(3) Request w/ Auth Header->|
     |    (Authorization: Bearer ..)  |
     |                                |
     |<---(4) 200 OK------------------|
     |      (Protected Data)          |
     |                                |
     |       ... time passes ...      |
     |                                |
     |----(5) Request w/ Expired----->|
     |         Access Token           |
     |                                |
     |<---(6) 401 Unauthorized-------|
     |                                |
     |                                |
     |----(7) POST /api/auth/refresh->|
     |      (refresh_token)           |
     |                                |
     |<---(8) 200 OK------------------|
     | (new access_token & refresh)   |
     |                                |
```

### `POST /api/auth/login`

Authenticates a user and returns an access token and a refresh token.

**Request Format:**

The request must be sent with a `Content-Type` of `application/x-www-form-urlencoded`.

**Request Body:**

*   `username` (string, required): The user's email address.
*   `password` (string, required): The user's password.

**Example cURL Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
-H "Content-Type: application/x-www-form-urlencoded" \
-d "username=user@example.com&password=your_password"
```

**Response:**

*   **200 OK:** Successful authentication.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer"
    }
    ```
*   **400 Bad Request:** If the request is malformed or missing required fields.
    ```json
    {
      "detail": "Missing username or password"
    }
    ```
*   **401 Unauthorized:** If the credentials are invalid.
    ```json
    {
      "detail": "Incorrect username or password"
    }
    ```

### `POST /api/auth/refresh`

Refreshes an expired access token using a valid refresh token.

**Request Body:**

*   `refresh_token` (string, required): The refresh token obtained during the initial login.

**Example cURL Request:**

```bash
curl -X POST "http://localhost:8000/api/auth/refresh" \
-H "Content-Type: application/json" \
-d '{"refresh_token": "your_refresh_token"}'
```

**Response:**

*   **200 OK:** Successful token refresh.
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer"
    }
    ```
*   **401 Unauthorized:** If the refresh token is invalid or expired.
    ```json
    {
      "detail": "Invalid refresh token"
    }
    ```

### `GET /api/auth/me`

Retrieves the currently authenticated user's information.

**Authentication:**

Requires a valid `access_token` in the `Authorization` header.

**Example cURL Request:**

```bash
curl -X GET "http://localhost:8000/api/auth/me" \
-H "Authorization: Bearer your_access_token"
```

**Response:**

*   **200 OK:** Returns the user object for the authenticated user.
    ```json
    {
      "id": "60d5ec49e77a7b001f8e8b45",
      "email": "user@example.com",
      "full_name": "Dr. John Doe",
      "is_active": true,
      "role": "DOCTOR",
      "plan": "PRO",
      "trial_ends_at": "2025-12-31T23:59:59Z"
    }
    ```
*   **401 Unauthorized:** If the access token is missing, invalid, or expired.
    ```json
    {
      "detail": "Not authenticated"
    }
```

## Error Codes

The API uses standard HTTP status codes to indicate the success or failure of a request. Here is a summary of the most common codes:

*   **200 OK:** The request was successful.
*   **201 Created:** The resource was successfully created.
*   **204 No Content:** The request was successful, but there is no content to return.
*   **400 Bad Request:** The server could not understand the request due to invalid syntax.
*   **401 Unauthorized:** The client must authenticate itself to get the requested response.
*   **403 Forbidden:** The client does not have access rights to the content.
*   **404 Not Found:** The server can not find the requested resource.
*   **422 Unprocessable Entity:** The request was well-formed but was unable to be followed due to semantic errors.
*   **500 Internal Server Error:** The server has encountered a situation it doesn't know how to handle.

Error responses will typically include a `detail` field with a more specific error message.

```json
{
  "detail": "A more specific error message."
}
    ```

## Rate Limiting

To ensure the stability and availability of the API for all users, we have implemented rate limiting.

*   **Default Limit:** All authenticated endpoints are subject to a rate limit of **100 requests per minute**.
*   **Login Endpoint:** The `/api/auth/login` endpoint has a stricter limit of **10 requests per minute** to prevent brute-force attacks.

If you exceed the rate limit, the API will return a `429 Too Many Requests` response. You should handle this by waiting for a period of time before making another request. The `Retry-After` header may be included in the response to indicate how many seconds to wait.

## Users

### `POST /api/users/`

Creates a new user. By default, new users are assigned the `DOCTOR` role and a `BASIC` plan with a 90-day trial.

**Request Body:**

*   `email` (string, required): The user's email address. Must be unique.
*   `password` (string, required): The user's password. Must be at least 8 characters long.
*   `full_name` (string, required): The user's full name.

**Example cURL Request:**

```bash
curl -X POST "http://localhost:8000/api/users/" \
-H "Content-Type: application/json" \
-d '{
  "email": "newdoctor@example.com",
  "password": "strongpassword123",
  "full_name": "Dr. Emily Carter"
}'
```

**Response:**

*   **201 Created:** Returns the newly created user object.
    ```json
    {
      "id": "60d5ec49e77a7b001f8e8b46",
      "email": "newdoctor@example.com",
      "full_name": "Dr. Emily Carter",
      "is_active": true,
      "role": "DOCTOR",
      "plan": "BASIC",
      "trial_ends_at": "..."
    }
    ```
*   **400 Bad Request:** If the email is already registered.
    ```json
    {
      "detail": "Email already registered"
    }
    ```
*   **422 Unprocessable Entity:** If the request body is invalid (e.g., missing fields, password too short).
    ```json
    {
      "detail": [
        {
          "loc": ["body", "password"],
          "msg": "ensure this value has at least 8 characters",
          "type": "value_error.any_str.min_length"
        }
      ]
    }
    ```

### `GET /api/users/me`

Retrieves the currently authenticated user's profile.

**Authentication:** Bearer Token

**Example cURL Request:**

```bash
curl -X GET "http://localhost:8000/api/users/me" \
-H "Authorization: Bearer your_access_token"
```

**Response:**

*   **200 OK:** Returns the user object for the authenticated user.
    ```json
    {
      "id": "60d5ec49e77a7b001f8e8b45",
      "email": "user@example.com",
      "full_name": "Dr. John Doe",
      "is_active": true,
      "role": "DOCTOR",
      "plan": "PRO",
      "trial_ends_at": "2025-12-31T23:59:59Z"
    }
    ```
*   **401 Unauthorized:** If the access token is missing, invalid, or expired.
    ```json
    {
      "detail": "Not authenticated"
    }
    ```

## Patients

### `POST /api/patients/`

Creates a new patient record for the currently authenticated user.

**Authentication:** Bearer Token

**Request Body:**

*   `name` (string, required): The patient's full name.
*   `phone` (string, optional): The patient's phone number.
*   `email` (string, optional): The patient's email address.
*   `address` (string, optional): The patient's address.
*   `location` (string, optional): The location where the patient was seen.
*   `initial_complaint` (string, optional): The patient's initial complaint.
*   `initial_diagnosis` (string, optional): The patient's initial diagnosis.
*   `group` (string, optional): The patient's group.

**Example cURL Request:**

```bash
curl -X POST "http://localhost:8000/api/patients/" \
-H "Authorization: Bearer your_access_token" \
-H "Content-Type: application/json" \
-d '{
  "name": "Jane Doe",
  "phone": "555-123-4567",
  "email": "jane.doe@example.com",
  "initial_complaint": "Sore throat"
}'
```

**Response:**

*   **201 Created:** Returns the newly created patient object.
    ```json
    {
      "id": "60d5ec49e77a7b001f8e8b47",
      "patient_id": "...",
      "name": "Jane Doe",
      "phone": "555-123-4567",
      "email": "jane.doe@example.com",
      "address": null,
      "location": null,
      "initial_complaint": "Sore throat",
      "initial_diagnosis": null,
      "group": null,
      "user_id": "60d5ec49e77a7b001f8e8b45",
      "created_at": "...",
      "updated_at": "..."
    }
    ```
*   **401 Unauthorized:** If the user is not authenticated.
*   **422 Unprocessable Entity:** If the request body is invalid.

### `GET /api/patients/`

Retrieves a list of patients for the currently authenticated user.

**Authentication:** Bearer Token

**Example cURL Request:**

```bash
curl -X GET "http://localhost:8000/api/patients/" \
-H "Authorization: Bearer your_access_token"
```

**Response:**

*   **200 OK:** Returns a list of patient objects.
    ```json
    [
      {
        "id": "60d5ec49e77a7b001f8e8b47",
        "patient_id": "...",
        "name": "Jane Doe",
        "phone": "555-123-4567",
        "email": "jane.doe@example.com",
        "user_id": "60d5ec49e77a7b001f8e8b45",
        "created_at": "...",
        "updated_at": "..."
      }
    ]
    ```
*   **401 Unauthorized:** If the user is not authenticated.

### `GET /api/patients/{patient_id}`

Retrieves a specific patient by their ID.

**Authentication:** Bearer Token

**Path Parameters:**

*   `patient_id` (string, required): The ID of the patient to retrieve.

**Example cURL Request:**

```bash
curl -X GET "http://localhost:8000/api/patients/60d5ec49e77a7b001f8e8b47" \
-H "Authorization: Bearer your_access_token"
```

**Response:**

*   **200 OK:** Returns the requested patient object.
    ```json
    {
      "id": "60d5ec49e77a7b001f8e8b47",
      "patient_id": "...",
      "name": "Jane Doe",
      "phone": "555-123-4567",
      "email": "jane.doe@example.com",
      "user_id": "60d5ec49e77a7b001f8e8b45",
      "created_at": "...",
      "updated_at": "..."
    }
    ```
*   **401 Unauthorized:** If the user is not authenticated.
*   **404 Not Found:** If a patient with the specified ID is not found.

### `PUT /api/patients/{patient_id}`

Updates a specific patient by their ID.

**Authentication:** Bearer Token

**Path Parameters:**

*   `patient_id` (string, required): The ID of the patient to update.

**Request Body:**

The request body can contain any of the patient fields that need to be updated.

**Example cURL Request:**

```bash
curl -X PUT "http://localhost:8000/api/patients/60d5ec49e77a7b001f8e8b47" \
-H "Authorization: Bearer your_access_token" \
-H "Content-Type: application/json" \
-d '{
  "phone": "555-987-6543",
  "address": "456 Oak Ave"
}'
```

**Response:**

*   **200 OK:** Returns the updated patient object.
    ```json
    {
      "id": "60d5ec49e77a7b001f8e8b47",
      "patient_id": "...",
      "name": "Jane Doe",
      "phone": "555-987-6543",
      "email": "jane.doe@example.com",
      "address": "456 Oak Ave",
      "user_id": "60d5ec49e77a7b001f8e8b45",
      "created_at": "...",
      "updated_at": "..."
    }
    ```
*   **401 Unauthorized:** If the user is not authenticated.
*   **404 Not Found:** If a patient with the specified ID is not found.
*   **422 Unprocessable Entity:** If the request body is invalid.

### `DELETE /api/patients/{patient_id}`

Deletes a specific patient by their ID.

**Authentication:** Bearer Token

**Path Parameters:**

*   `patient_id` (string, required): The ID of the patient to delete.

**Example cURL Request:**

```bash
curl -X DELETE "http://localhost:8000/api/patients/60d5ec49e77a7b001f8e8b47" \
-H "Authorization: Bearer your_access_token"
```

**Response:**

*   **200 OK:**
    ```json
    {
      "message": "Patient deleted successfully"
    }
    ```
*   **401 Unauthorized:** If the user is not authenticated.
*   **404 Not Found:** If a patient with the specified ID is not found.

## Clinical Notes

### `POST /api/patients/{patient_id}/notes`

Creates a new clinical note for a specific patient.

**Authentication:** Bearer Token

**Path Parameters:**

*   `patient_id` (string, required): The ID of the patient for whom the note is being created.

**Request Body:**

*   `content` (string, required): The content of the clinical note.

**Example cURL Request:**

```bash
curl -X POST "http://localhost:8000/api/patients/60d5ec49e77a7b001f8e8b47/notes" \
-H "Authorization: Bearer your_access_token" \
-H "Content-Type: application/json" \
-d '{
  "content": "Patient reports feeling much better. No more sore throat."
}'
```

**Response:**

*   **201 Created:** Returns the newly created clinical note object.
    ```json
    {
      "id": "60d5ec49e77a7b001f8e8b48",
      "note_id": "...",
      "content": "Patient reports feeling much better. No more sore throat.",
      "patient_id": "60d5ec49e77a7b001f8e8b47",
      "user_id": "60d5ec49e77a7b001f8e8b45",
      "created_at": "...",
      "updated_at": "..."
    }
    ```
*   **401 Unauthorized:** If the user is not authenticated.
*   **404 Not Found:** If the patient is not found.
*   **422 Unprocessable Entity:** If the request body is invalid.

### `GET /api/patients/{patient_id}/notes`

Retrieves a list of clinical notes for a specific patient.

**Authentication:** Bearer Token

**Path Parameters:**

*   `patient_id` (string, required): The ID of the patient whose notes are to be retrieved.

**Example cURL Request:**

```bash
curl -X GET "http://localhost:8000/api/patients/60d5ec49e77a7b001f8e8b47/notes" \
-H "Authorization: Bearer your_access_token"
```

**Response:**

*   **200 OK:** Returns a list of clinical note objects.
    ```json
    [
      {
        "id": "60d5ec49e77a7b001f8e8b48",
        "note_id": "...",
        "content": "Patient reports feeling much better. No more sore throat.",
        "patient_id": "60d5ec49e77a7b001f8e8b47",
        "user_id": "60d5ec49e77a7b001f8e8b45",
        "created_at": "...",
        "updated_at": "..."
      }
    ]
    ```
*   **401 Unauthorized:** If the user is not authenticated.
*   **404 Not Found:** If the patient is not found.

## Sync

### `POST /api/sync/pull`

Pulls changes from the server. This endpoint is designed to be used by the client to stay in sync with the server's data.

**Authentication:** Bearer Token

**Request Body:**

*   `last_pulled_at` (integer, optional): A Unix timestamp (in milliseconds) of the last time the client successfully pulled changes. If this is the first sync, this value should be `0` or `null`.

**Example cURL Request:**

```bash
curl -X POST "http://localhost:8000/api/sync/pull" \
-H "Authorization: Bearer your_access_token" \
-H "Content-Type: application/json" \
-d '{"last_pulled_at": 1672531199000}'
```

**Response:**

The response contains a `changes` object with arrays of created, updated, and deleted records for each collection, and a `timestamp` that the client should store and send back in the next pull request.

*   **200 OK:**
    ```json
    {
      "changes": {
        "patients": {
          "created": [
            { "id": "pat_1", "name": "New Patient", "created_at": "...", "updated_at": "..." }
          ],
          "updated": [
            { "id": "pat_2", "name": "Updated Patient Name", "updated_at": "..." }
          ],
          "deleted": [ "pat_3" ]
        },
        "clinical_notes": {
          "created": [],
          "updated": [],
          "deleted": []
        }
      },
      "timestamp": 1672531200000
    }
    ```

### `POST /api/sync/push`

Pushes local changes to the server. This endpoint is used by the client to send its local changes to the server.

**Authentication:** Bearer Token

**Request Body:**

The request body should contain a `changes` object with arrays of created, updated, and deleted records for each collection.

*   `created` (array): An array of new records to be created on the server.
*   `updated` (array): An array of records that have been updated locally and should be updated on the server.
*   `deleted` (array): An array of record IDs that have been deleted locally and should be deleted on the server.

**Example cURL Request:**

```bash
curl -X POST "http://localhost:8000/api/sync/push" \
-H "Authorization: Bearer your_access_token" \
-H "Content-Type: application/json" \
-d '{
  "changes": {
    "patients": {
      "created": [
        { "id": "local_pat_1", "name": "New Patient From Client" }
      ],
      "updated": [
        { "id": "pat_2", "name": "Updated Name From Client" }
      ],
      "deleted": [ "pat_3" ]
    }
  }
}'
```

**Response:**

*   **200 OK:** Indicates that the push was successful.
    ```json
    {
      "status": "success"
    }
    ```
*   **400 Bad Request:** If the request is malformed or there are validation errors. The response will contain a list of errors.
    ```json
    {
      "detail": [
        {
          "loc": ["body", "changes", "patients", "created", 0, "name"],
          "msg": "field required",
          "type": "value_error.missing"
        }
      ]
    }
    ```
