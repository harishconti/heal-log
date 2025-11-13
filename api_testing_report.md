# API Testing Report

**Date:** 2025-11-11T07:20:52.710283Z
**Base URL (for testing):** `http://127.0.0.1:8000`
**Note:** URLs in the report use the production format for clarity, but tests were run locally against a test database.

### POST /api/patients/
**Request:**
```http
POST https://doctor-log-production.up.railway.app/api/patients/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjI4NDc0NTIsInN1YiI6IjQyMWE0OWIxLWRmNDMtNDY5NC1hNzJlLTBhMDQzZWU0YjljMCIsInBsYW4iOiJiYXNpYyIsInJvbGUiOiJkb2N0b3IifQ.EuOAwDRmNoGriz27HMiNz_kgJ6_3QBjNDiz0v5_dX9E

{
  "name": "John Doe",
  "date_of_birth": "1990-01-01",
  "gender": "Male",
  "phone": "1234567890",
  "email": "johndoe@example.com",
  "address": "123 Main St",
  "group": "A",
  "is_favorite": false
}
```

**Response:**
```json
Status Code: 201

{
  "id": "8c592967-7ee9-494f-b098-52b8ffbf1702",
  "patient_id": "PAT001",
  "user_id": "421a49b1-df43-4694-a72e-0a043ee4b9c0",
  "name": "John Doe",
  "phone": "1234567890",
  "email": "johndoe@example.com",
  "address": "123 Main St",
  "location": "",
  "initial_complaint": "",
  "initial_diagnosis": "",
  "photo": null,
  "group": "A",
  "is_favorite": false,
  "created_at": "2025-11-11T07:20:52.590208Z",
  "updated_at": "2025-11-11T07:20:52.590212Z"
}
```

---

### GET /api/patients/
**Request:**
```http
GET https://doctor-log-production.up.railway.app/api/patients/
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjI4NDc0NTIsInN1YiI6IjQyMWE0OWIxLWRmNDMtNDY5NC1hNzJlLTBhMDQzZWU0YjljMCIsInBsYW4iOiJiYXNpYyIsInJvbGUiOiJkb2N0b3IifQ.EuOAwDRmNoGriz27HMiNz_kgJ6_3QBjNDiz0v5_dX9E
```

**Response:**
```json
Status Code: 200

[
  {
    "id": "8c592967-7ee9-494f-b098-52b8ffbf1702",
    "patient_id": "PAT001",
    "user_id": "421a49b1-df43-4694-a72e-0a043ee4b9c0",
    "name": "John Doe",
    "phone": "1234567890",
    "email": "johndoe@example.com",
    "address": "123 Main St",
    "location": "",
    "initial_complaint": "",
    "initial_diagnosis": "",
    "photo": null,
    "group": "A",
    "is_favorite": false,
    "created_at": "2025-11-11T07:20:52.590000",
    "updated_at": "2025-11-11T07:20:52.590000"
  }
]
```

---

### GET /api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
**Request:**
```http
GET https://doctor-log-production.up.railway.app/api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjI4NDc0NTIsInN1YiI6IjQyMWE0OWIxLWRmNDMtNDY5NC1hNzJlLTBhMDQzZWU0YjljMCIsInBsYW4iOiJiYXNpYyIsInJvbGUiOiJkb2N0b3IifQ.EuOAwDRmNoGriz27HMiNz_kgJ6_3QBjNDiz0v5_dX9E
```

**Response:**
```json
Status Code: 200

{
  "id": "8c592967-7ee9-494f-b098-52b8ffbf1702",
  "patient_id": "PAT001",
  "user_id": "421a49b1-df43-4694-a72e-0a043ee4b9c0",
  "name": "John Doe",
  "phone": "1234567890",
  "email": "johndoe@example.com",
  "address": "123 Main St",
  "location": "",
  "initial_complaint": "",
  "initial_diagnosis": "",
  "photo": null,
  "group": "A",
  "is_favorite": false,
  "created_at": "2025-11-11T07:20:52.590000",
  "updated_at": "2025-11-11T07:20:52.590000"
}
```

---

### PUT /api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
**Request:**
```http
PUT https://doctor-log-production.up.railway.app/api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjI4NDc0NTIsInN1YiI6IjQyMWE0OWIxLWRmNDMtNDY5NC1hNzJlLTBhMDQzZWU0YjljMCIsInBsYW4iOiJiYXNpYyIsInJvbGUiOiJkb2N0b3IifQ.EuOAwDRmNoGriz27HMiNz_kgJ6_3QBjNDiz0v5_dX9E

{
  "phone": "0987654321",
  "email": "johndoe.updated@example.com",
  "is_favorite": true
}
```

**Response:**
```json
Status Code: 200

{
  "id": "8c592967-7ee9-494f-b098-52b8ffbf1702",
  "patient_id": "PAT001",
  "user_id": "421a49b1-df43-4694-a72e-0a043ee4b9c0",
  "name": "John Doe",
  "phone": "0987654321",
  "email": "johndoe.updated@example.com",
  "address": "123 Main St",
  "location": "",
  "initial_complaint": "",
  "initial_diagnosis": "",
  "photo": null,
  "group": "A",
  "is_favorite": true,
  "created_at": "2025-11-11T07:20:52.590000",
  "updated_at": "2025-11-11T07:20:52.658000"
}
```

---

### DELETE /api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
**Request:**
```http
DELETE https://doctor-log-production.up.railway.app/api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjI4NDc0NTIsInN1YiI6IjQyMWE0OWIxLWRmNDMtNDY5NC1hNzJlLTBhMDQzZWU0YjljMCIsInBsYW4iOiJiYXNpYyIsInJvbGUiOiJkb2N0b3IifQ.EuOAwDRmNoGriz27HMiNz_kgJ6_3QBjNDiz0v5_dX9E
```

**Response:**
```json
Status Code: 200

{
  "success": true,
  "message": "Patient deleted successfully"
}
```

---

### GET /api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
**Request:**
```http
GET https://doctor-log-production.up.railway.app/api/patients/8c592967-7ee9-494f-b098-52b8ffbf1702
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjI4NDc0NTIsInN1YiI6IjQyMWE0OWIxLWRmNDMtNDY5NC1hNzJlLTBhMDQzZWU0YjljMCIsInBsYW4iOiJiYXNpYyIsInJvbGUiOiJkb2N0b3IifQ.EuOAwDRmNoGriz27HMiNz_kgJ6_3QBjNDiz0v5_dX9E
```

**Response:**
```json
Status Code: 404

{
  "detail": "Patient not found"
}
```

---
