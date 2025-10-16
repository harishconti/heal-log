# API Documentation

This document provides detailed information about the API endpoints, including authentication, user management, and other relevant features.

## Authentication

Authentication is handled via JWT (JSON Web Tokens). The following endpoints are used for user registration, login, and token management.

### Register

*   **Endpoint:** `POST /api/auth/register`
*   **Content-Type:** `application/json`
*   **Description:** Registers a new user.
*   **Password Complexity:**
    *   Minimum 8 characters
    *   At least one letter
    *   At least one number

### Login

*   **Endpoint:** `POST /api/auth/login`
*   **Content-Type:** `application/x-www-form-urlencoded`
*   **Description:** Authenticates a user and returns an access token. The `username` field should contain the user's email address.
*   **Fields:**
    *   `username` (string)
    *   `password` (string)

### Get Current User

*   **Endpoint:** `GET /api/users/me`
*   **Description:** Retrieves the profile of the currently authenticated user.
*   **Authentication:** Requires a valid access token.

## Frontend Notes

### WatermelonDB Adapter

The `useIncrementalIndexedDB` option for the `LokiJSAdapter` is correctly configured in `frontend/models/adapters/index.ts`. No further action is required for this issue.