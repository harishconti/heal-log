# API Documentation

This document provides an overview of the Clinic OS Lite API endpoints.

## Authentication

### `POST /api/auth/register`

Register a new user.

- **Request Body:**
  - `email` (string, required): The user's email address.
  - `password` (string, required): The user's password.
  - `full_name` (string, required): The user's full name.
  - `phone` (string, optional): The user's phone number.
  - `medical_specialty` (string, optional): The user's medical specialty.
  - `role` (string, optional): The user's role (e.g., "doctor", "patient").

- **Response:**
  - `success` (boolean): Whether the registration was successful.
  - `access_token` (string): The user's access token.
  - `refresh_token` (string): The user's refresh token.
  - `token_type` (string): The type of token (e.g., "bearer").
  - `user` (object): The user's information.

### `POST /api/auth/login`

Log in as an existing user.

- **Request Body:**
  - `username` (string, required): The user's email address.
  - `password` (string, required): The user's password.

- **Response:**
  - `success` (boolean): Whether the login was successful.
  - `access_token` (string): The user's access token.
  - `refresh_token` (string): The user's refresh token.
  - `token_type` (string): The type of token (e.g., "bearer").
  - `user` (object): The user's information.

### `POST /api/auth/refresh`

Refresh an access token.

- **Request Body:**
  - `refresh_token` (string, required): The user's refresh token.

- **Response:**
  - `access_token` (string): The user's new access token.
  - `refresh_token` (string): The user's refresh token.
  - `token_type` (string): The type of token (e.g., "bearer").

### `GET /api/users/me`

Get the current user's information.

- **Response:**
  - `success` (boolean): Whether the request was successful.
  - `user` (object): The user's information.

## Patients

### `POST /api/patients`

Create a new patient.

- **Request Body:**
  - `name` (string, required): The patient's name.
  - `phone` (string, optional): The patient's phone number.
  - `email` (string, optional): The patient's email address.
  - `address` (string, optional): The patient's address.
  - `location` (string, optional): The patient's location.
  - `initial_complaint` (string, optional): The patient's initial complaint.
  - `initial_diagnosis` (string, optional): The patient's initial diagnosis.
  - `group` (string, optional): The patient's group.
  - `is_favorite` (boolean, optional): Whether the patient is a favorite.

- **Response:**
  - The created patient object.

### `GET /api/patients`

Get all patients for the current user.

- **Query Parameters:**
  - `search` (string, optional): A search term to filter patients by.
  - `group` (string, optional): A group to filter patients by.
  - `favorites_only` (boolean, optional): Whether to return only favorite patients.

- **Response:**
  - A list of patient objects.

### `GET /api/patients/{id}`

Get a single patient by their ID.

- **Response:**
  - The patient object.

### `PUT /api/patients/{id}`

Update a patient's details.

- **Request Body:**
  - `name` (string, optional): The patient's name.
  - `phone` (string, optional): The patient's phone number.
  - `email` (string, optional): The patient's email address.
  - `address` (string, optional): The patient's address.
  - `location` (string, optional): The patient's location.
  - `initial_complaint` (string, optional): The patient's initial complaint.
  - `initial_diagnosis` (string, optional): The patient's initial diagnosis.
  - `group` (string, optional): The patient's group.
  - `is_favorite` (boolean, optional): Whether the patient is a favorite.

- **Response:**
  - The updated patient object.

### `DELETE /api/patients/{id}`

Delete a patient.

- **Response:**
  - `success` (boolean): Whether the deletion was successful.
  - `message` (string): A message indicating the result of the deletion.

## Debug

### `POST /api/debug/clear-all-caches`

Clear all application-level caches. This endpoint is intended for use in a testing environment only.

- **Response:**
  - `success` (boolean): Whether the caches were cleared successfully.
  - `message` (string): A message indicating the result of the cache clearing.