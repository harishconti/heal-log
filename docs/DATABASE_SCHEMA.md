# HealLog Database Schema Documentation

This document describes all database collections and their schemas for the HealLog application.

## Overview

HealLog uses MongoDB Atlas as its primary database. The application follows a multi-tenant architecture where each user (doctor) has their own isolated data.

## ID Formats

### Patient ID Format
```
PTYYYYMM001
```
- **PT**: Prefix for patient
- **YYYY**: 4-digit year (e.g., 2025)
- **MM**: 2-digit month (01-12)
- **001**: 3-digit sequential number (resets each month)

**Examples:**
- `PT202501001` - First patient registered in January 2025
- `PT202501002` - Second patient registered in January 2025
- `PT202502001` - First patient registered in February 2025

### Other Entity IDs
All other entities use UUID v4 for primary IDs.

---

## Collections

### 1. users

Stores doctor/user account information.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `email` | string (EmailStr) | Yes | Unique, indexed |
| `phone` | string | No | Max 25 chars |
| `full_name` | string | Yes | 2-100 chars |
| `medical_specialty` | string | No | Default: "general", max 100 chars |
| `password_hash` | string | No | Hashed password |
| `plan` | enum | Yes | `basic` \| `pro` |
| `role` | enum | Yes | `admin` \| `doctor` \| `patient` |
| `subscription_status` | enum | Yes | `trialing` \| `active` \| `canceled` \| `past_due` |
| `subscription_end_date` | datetime | Yes | UTC timestamp |
| `status` | string | Yes | Default: "active" |
| `is_beta_tester` | boolean | Yes | Default: false |
| `is_verified` | boolean | Yes | Default: false |
| `otp_code` | string | No | Email verification OTP |
| `otp_expires_at` | datetime | No | OTP expiration time |
| `otp_attempts` | integer | Yes | Default: 0 |
| `password_reset_token` | string | No | Password reset token |
| `password_reset_expires_at` | datetime | No | Reset token expiration |
| `created_at` | datetime | Yes | UTC timestamp |
| `updated_at` | datetime | Yes | UTC timestamp |

**Indexes:**
- `email` (unique)

---

### 2. patients

Stores patient records for each doctor.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `patient_id` | string | Yes | Format: PTYYYYMM001 |
| `user_id` | string | Yes | Reference to users._id, indexed |
| `name` | string | Yes | 2-100 chars |
| `phone` | string | No | Max 25 chars |
| `email` | string (EmailStr) | No | Patient email |
| `address` | string | No | Max 255 chars |
| `location` | string | No | Max 100 chars |
| `initial_complaint` | string | No | Max 5000 chars |
| `initial_diagnosis` | string | No | Max 5000 chars |
| `photo` | string | No | Base64 encoded image |
| `group` | string | No | Default: "general", max 50 chars |
| `is_favorite` | boolean | Yes | Default: false |
| `created_at` | datetime | Yes | UTC timestamp |
| `updated_at` | datetime | Yes | UTC timestamp |

**Indexes:**
- `(user_id, patient_id)` - unique composite index
- `(user_id, created_at)` - for sorting

---

### 3. clinical_notes

Stores medical notes for patient visits.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `patient_id` | string | Yes | Reference to patients._id, indexed |
| `user_id` | string | Yes | Reference to users._id, indexed |
| `content` | string | Yes | 1-5000 chars |
| `visit_type` | enum | Yes | `initial` \| `regular` \| `follow-up` \| `emergency` |
| `created_at` | datetime | Yes | UTC timestamp |
| `updated_at` | datetime | Yes | UTC timestamp |

**Indexes:**
- `patient_id`
- `user_id`

---

### 4. documents

Stores uploaded medical documents metadata.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `patient_id` | string | Yes | Reference to patients._id, indexed |
| `user_id` | string | Yes | Reference to users._id, indexed |
| `file_name` | string | Yes | Name of uploaded file |
| `storage_url` | string | Yes | Google Cloud Storage URL |
| `uploaded_at` | datetime | Yes | UTC timestamp |

**Indexes:**
- `patient_id`
- `user_id`

---

### 5. feedback

Stores user feedback submissions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `feedback_type` | enum | Yes | `bug` \| `feature` \| `other` |
| `description` | string | Yes | Max 1000 chars |
| `email` | string (EmailStr) | No | Contact email |
| `user_id` | string | No | Reference to users._id |
| `device_info` | object | No | Device metadata |
| `created_at` | datetime | Yes | UTC timestamp |

---

### 6. beta_feedback

Stores beta testing feedback with detailed device info.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary key (auto-generated) |
| `feedback_type` | enum | Yes | `bug` \| `suggestion` \| `general` |
| `description` | string | Yes | 10-500 chars |
| `steps_to_reproduce` | string | No | Reproduction steps |
| `device_info` | DeviceInfo | Yes | Device metadata object |
| `screenshot_url` | string | No | URL to uploaded screenshot |
| `created_at` | datetime | Yes | UTC timestamp |

**DeviceInfo Schema:**
```json
{
  "os_version": "string (optional)",
  "app_version": "string (optional)",
  "device_model": "string (optional)"
}
```

---

### 7. telemetry

Stores analytics events.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `user_id` | string | Yes | Reference to users._id, indexed |
| `event_type` | string | Yes | 1-50 chars |
| `payload` | object | No | Event-specific data |
| `created_at` | datetime | Yes | UTC timestamp |

**Indexes:**
- `user_id`

---

### 8. error_events

Stores application error logs.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `user_id` | string | No | Reference to users._id, indexed |
| `request_id` | string | No | Request correlation ID |
| `path` | string | Yes | API endpoint path |
| `method` | string | Yes | HTTP method |
| `status_code` | integer | Yes | HTTP status code |
| `error` | string | Yes | Error message |
| `created_at` | datetime | Yes | UTC timestamp |

---

### 9. query_performance_events

Stores database query performance metrics.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `query` | string | Yes | Query description |
| `execution_time` | float | Yes | Time in milliseconds |
| `created_at` | datetime | Yes | UTC timestamp |

---

### 10. sync_events

Tracks offline sync operations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `user_id` | string | Yes | Reference to users._id, indexed |
| `success` | boolean | Yes | Sync success status |
| `created_at` | datetime | Yes | UTC timestamp |

**Indexes:**
- `user_id`

---

### 11. google_contacts_sync_jobs

Tracks Google Contacts synchronization jobs.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `user_id` | string | Yes | Reference to users._id, indexed |
| `job_type` | enum | Yes | `initial` \| `incremental` |
| `status` | enum | Yes | `pending` \| `running` \| `completed` \| `failed` \| `cancelled` |
| `total_contacts` | integer | No | Total contacts to sync |
| `processed_contacts` | integer | No | Contacts processed so far |
| `created_patients` | integer | No | New patients created |
| `updated_patients` | integer | No | Existing patients updated |
| `duplicate_count` | integer | No | Duplicates found |
| `error_message` | string | No | Error message if failed |
| `google_sync_token` | string | No | Token for incremental sync |
| `created_at` | datetime | Yes | UTC timestamp |
| `completed_at` | datetime | No | UTC timestamp when finished |

**Indexes:**
- `user_id`

---

### 12. duplicate_records

Stores potential duplicate patient records for review.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | string (UUID) | Yes | Primary key |
| `user_id` | string | Yes | Reference to users._id, indexed |
| `sync_job_id` | string | Yes | Reference to google_contacts_sync_jobs._id |
| `google_contact` | object | Yes | Original Google contact data |
| `existing_patient_id` | string | Yes | Reference to patients._id |
| `match_reason` | string | Yes | Why flagged as duplicate (phone, email, name) |
| `match_confidence` | float | Yes | Confidence score (0-1) |
| `status` | enum | Yes | `pending` \| `resolved` \| `skipped` |
| `resolution` | enum | No | `keep_existing` \| `replace` \| `merge` \| `create_new` |
| `created_at` | datetime | Yes | UTC timestamp |
| `resolved_at` | datetime | No | UTC timestamp when resolved |

**Indexes:**
- `user_id`
- `status`

---

## Frontend Local Database (WatermelonDB/SQLite)

The mobile app uses WatermelonDB with SQLite for offline-first functionality.

### patients (local)

| Column | Type | Indexed | Description |
|--------|------|---------|-------------|
| `id` | string | Yes | WatermelonDB auto-generated |
| `patient_id` | string | Yes | Format: PTYYYYMM001 |
| `name` | string | No | Patient name |
| `phone` | string | No | Phone number |
| `email` | string | No | Email address |
| `address` | string | No | Address |
| `location` | string | No | Location |
| `initial_complaint` | string | No | Initial complaint |
| `initial_diagnosis` | string | No | Initial diagnosis |
| `photo` | string | No | Base64 image (optional) |
| `group` | string | No | Patient group (optional) |
| `is_favorite` | boolean | No | Favorite status |
| `created_at` | number | No | Unix timestamp |
| `updated_at` | number | No | Unix timestamp |

### clinical_notes (local)

| Column | Type | Indexed | Description |
|--------|------|---------|-------------|
| `id` | string | Yes | WatermelonDB auto-generated |
| `patient_id` | string | Yes | Reference to patients.id |
| `content` | string | No | Note content |
| `timestamp` | number | No | Unix timestamp |
| `visit_type` | string | No | Visit type |
| `created_by` | string | No | Creator user ID |

---

## Enums

### UserPlan
```typescript
type UserPlan = 'basic' | 'pro';
```

### UserRole
```typescript
type UserRole = 'admin' | 'doctor' | 'patient';
```

### SubscriptionStatus
```typescript
type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due';
```

### FeedbackType
```typescript
type FeedbackType = 'bug' | 'feature' | 'other';
```

### BetaFeedbackType
```typescript
type BetaFeedbackType = 'bug' | 'suggestion' | 'general';
```

### VisitType
```typescript
type VisitType = 'initial' | 'regular' | 'follow-up' | 'emergency';
```

### SyncJobType
```typescript
type SyncJobType = 'initial' | 'incremental';
```

### SyncJobStatus
```typescript
type SyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

### DuplicateStatus
```typescript
type DuplicateStatus = 'pending' | 'resolved' | 'skipped';
```

### DuplicateResolution
```typescript
type DuplicateResolution = 'keep_existing' | 'replace' | 'merge' | 'create_new';
```

---

## Data Validation Rules

### Password Requirements
- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*(),.?":{}|<>`)

### Phone Number (Indian Mobile)
- 10 digits
- Must start with 6-9

### Patient ID Validation
```regex
^PT\d{6}\d{3}$
```

---

## Timestamps

All timestamps are stored in UTC using `datetime.now(timezone.utc)` format.

---

## Notes

1. **Multi-tenancy**: All patient data is scoped to a `user_id` for data isolation.
2. **Offline-first**: Mobile app syncs with backend, local WatermelonDB is source of truth on device.
3. **Soft deletes**: Not implemented - records are hard deleted.
4. **Audit trail**: `created_at` and `updated_at` fields track record history.
