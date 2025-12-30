# API Documentation

Complete API reference for the HealLog backend.

**Base URL:** `https://your-domain.com/api`
**API Version:** 3.0
**Authentication:** JWT Bearer Token

---

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Patients](#patients)
- [Clinical Notes](#clinical-notes)
- [Sync](#sync)
- [Export](#export)
- [Analytics](#analytics)
- [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Register

Create a new user account. Sends OTP to email for verification.

```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "phone": "+1234567890",
  "full_name": "Dr. John Doe",
  "medical_specialty": "Cardiology",
  "password": "StrongPass123!"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "requires_verification": true,
  "email": "doctor@example.com"
}
```

### Verify OTP

Verify email with the OTP code sent during registration.

```
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "email": "doctor@example.com",
  "otp_code": "12345678"
}
```

**Response (200):**
```json
{
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "doctor@example.com",
    "full_name": "Dr. John Doe"
  }
}
```

### Login

Authenticate with email and password.

```
POST /auth/login
Content-Type: application/x-www-form-urlencoded
```

**Request Body:**
```
username=doctor@example.com&password=StrongPass123!
```

**Response (200):**
```json
{
  "success": true,
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "doctor@example.com",
    "full_name": "Dr. John Doe",
    "plan": "basic",
    "role": "doctor"
  }
}
```

### Refresh Token

Get a new access token using the refresh token.

```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Forgot Password

Request a password reset email.

```
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "doctor@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "If an account exists, a reset email has been sent."
}
```

### Reset Password

Reset password using the token from email.

```
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "NewStrongPass123!"
}
```

### Get Current User

```
GET /auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "doctor@example.com",
    "phone": "+1234567890",
    "full_name": "Dr. John Doe",
    "medical_specialty": "Cardiology",
    "plan": "basic",
    "role": "doctor",
    "subscription_status": "trialing",
    "is_verified": true
  }
}
```

---

## Users

### Update Profile

```
PUT /users/me
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "full_name": "Dr. Jane Doe",
  "phone": "+1234567890",
  "medical_specialty": "Pediatrics"
}
```

### Change Password

```
POST /users/me/password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass123!"
}
```

---

## Patients

### Create Patient

```
POST /patients/
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+1234567890",
  "email": "patient@example.com",
  "address": "123 Main St",
  "location": "New York",
  "initial_complaint": "Chest pain",
  "initial_diagnosis": "Suspected angina",
  "group": "cardiology",
  "is_favorite": false
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "patient_id": "PAT001",
  "user_id": "doctor_uuid",
  "name": "John Smith",
  "phone": "+1234567890",
  "email": "patient@example.com",
  "address": "123 Main St",
  "location": "New York",
  "initial_complaint": "Chest pain",
  "initial_diagnosis": "Suspected angina",
  "group": "cardiology",
  "is_favorite": false,
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:00:00Z"
}
```

### List Patients

```
GET /patients/
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by name, ID, phone, email |
| `group` | string | - | Filter by group |
| `favorites_only` | boolean | false | Only favorites |
| `date_from` | datetime | - | Created after date |
| `date_to` | datetime | - | Created before date |
| `sort_by` | string | created_at | name, created_at, updated_at |
| `sort_order` | string | desc | asc, desc |
| `skip` | integer | 0 | Pagination offset |
| `limit` | integer | 100 | Max results (max: 500) |

**Example:**
```
GET /patients/?search=john&group=cardiology&sort_by=name&limit=20
```

### Get Patient

```
GET /patients/{id}
Authorization: Bearer <token>
```

### Update Patient

```
PUT /patients/{id}
Authorization: Bearer <token>
```

### Delete Patient

```
DELETE /patients/{id}
Authorization: Bearer <token>
```

### Get Patient Groups

```
GET /patients/groups/
Authorization: Bearer <token>
```

**Response (200):**
```json
["cardiology", "general", "pediatrics"]
```

### Get Statistics

```
GET /patients/stats/
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "total_patients": 150,
  "favorite_patients": 12,
  "groups": [
    {"_id": "cardiology", "count": 45},
    {"_id": "general", "count": 80}
  ]
}
```

---

## Clinical Notes

### Create Note

```
POST /patients/{patient_id}/notes
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "Patient presents with chest discomfort...",
  "visit_type": "regular"
}
```

**Visit Types:** `regular`, `follow-up`, `emergency`

**Response (201):**
```json
{
  "id": "uuid",
  "patient_id": "patient_uuid",
  "user_id": "doctor_uuid",
  "content": "Patient presents with chest discomfort...",
  "visit_type": "regular",
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:00:00Z"
}
```

### List Notes

```
GET /patients/{patient_id}/notes
Authorization: Bearer <token>
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | integer | 0 | Pagination offset |
| `limit` | integer | 100 | Max results (max: 500) |

---

## Sync

Offline-first synchronization for mobile clients.

### Pull Changes

Get all changes since last sync.

```
POST /sync/pull
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "last_pulled_at": 1735556400000
}
```

**Response (200):**
```json
{
  "changes": {
    "patients": {
      "created": [...],
      "updated": [...],
      "deleted": ["id1", "id2"]
    },
    "clinical_notes": {
      "created": [...],
      "updated": [...],
      "deleted": []
    }
  },
  "timestamp": 1735560000000
}
```

### Push Changes

Push local changes to server.

```
POST /sync/push
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "changes": {
    "patients": {
      "created": [...],
      "updated": [...],
      "deleted": ["id1"]
    },
    "clinical_notes": {
      "created": [...],
      "updated": [...],
      "deleted": []
    }
  }
}
```

---

## Export

### Export Patients (CSV)

```
GET /export/patients
Authorization: Bearer <token>
```

**Response:** CSV file download

### Export Clinical Notes (CSV)

```
GET /export/clinical-notes
Authorization: Bearer <token>
```

**Response:** CSV file download

### Export All Data (GDPR)

```
GET /export/all
Authorization: Bearer <token>
```

**Response:** CSV file with all user data

---

## Analytics

*Requires PRO subscription*

### Patient Growth

```
GET /analytics/patient-growth
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {"date": "2025-12-01", "count": 5, "cumulative": 42},
  {"date": "2025-12-02", "count": 3, "cumulative": 45}
]
```

### Notes Activity

```
GET /analytics/notes-activity
Authorization: Bearer <token>
```

### Weekly Activity

```
GET /analytics/weekly-activity
Authorization: Bearer <token>
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Descriptive error message"
  },
  "request_id": "unique_request_id"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Duplicate resource |
| 422 | Validation Error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

### Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/register` | 5/minute |
| `/auth/login` | 5/minute |
| `/auth/forgot-password` | 3/minute |
| `/patients/` POST | 20/minute |
| `/patients/` GET | 60/minute |
| `/sync/*` | 30/minute |
| `/export/*` | 5/minute |

---

## Health Check

```
GET /health
```

**Response (200):**
```json
{
  "status": "ok",
  "details": {
    "api": "ok",
    "mongodb": "ok",
    "cache": "ok"
  }
}
```

---

## Version

```
GET /version
```

**Response (200):**
```json
{
  "status": "ok",
  "version": "3.0.0",
  "build_date": "2025-12-30"
}
```
