# Database Schema Documentation

This document outlines the MongoDB database schema for Clinic OS Lite. The schema is defined using `beanie` ODM.

## `users` Collection

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

## `patients` Collection

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

## `clinical_notes` Collection

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
