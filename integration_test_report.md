# Integration Test Report

## Summary

### Step 1: User Creation
Registering user: jeremybryan@example.com
Registration successful. Response: {
  "success": true,
  "message": "Registration successful. Please verify your email with the OTP sent.",
  "requires_verification": true,
  "email": "jeremybryan@example.com"
}
### Step 2: OTP Verification
Fetched OTP from DB: 177454
OTP Verified. Tokens received.
### Step 3: Login / Me
Logged in as: {
  "success": true,
  "user": {
    "id": "e3e3addf-89e1-45f9-9cfb-92a25959032c",
    "email": "jeremybryan@example.com",
    "phone": "7947042459",
    "full_name": "Joann Dodson",
    "medical_specialty": "General Practice",
    "plan": "basic",
    "role": "doctor",
    "subscription_status": "trialing",
    "subscription_end_date": "2026-03-23T09:10:15.029000",
    "is_verified": true
  }
}
### Step 4: Create 2 Patients
Created patient: Jonathan Bradshaw (ID: 75339fb4-5f52-40d7-91c1-e03e29a819b2, PID: PAT001)
Created patient: Nathan Williams (ID: 274d2aeb-0fa7-475e-93d5-2e054d1c34f4, PID: PAT002)
### Step 5: Create Notes
Created note for Jonathan Bradshaw: f80b7fba-ae74-4ff3-9d3d-fd724b0200fd
Created note for Nathan Williams: fac35a7f-0198-4531-9c3a-dd746e564681
### Step 6: Sync Check 1 (Full Sync)
Sync Response (Summary):
Fetched Patients: 2
Fetched Notes: 2
### Step 7: Create 2 More Patients
Created patient: Nicole Stephens (ID: 20cc45f6-11aa-4afb-948a-7d4eda4f6127, PID: PAT003)
Created patient: Jill Briggs (ID: cddaa678-d850-4fb1-9abb-b41b529d78b9, PID: PAT004)
Created note for Nicole Stephens: 81e2fc20-17da-4454-99e8-3d245e77eb13
Created note for Jill Briggs: 75957cee-74af-49da-a012-be390579cc8c
### Step 8: Sync Check 2 (Full Sync Check)
Total Fetched Patients: 4
Total Fetched Notes: 4
SUCCESS: All 4 patients and 4 notes returned.
### Step 9: Verify Standard REST Endpoints
GET /patients returned 4 patients.
SUCCESS: Standard API returns all patients.
GET /patients/cddaa678-d850-4fb1-9abb-b41b529d78b9 returned: {
  "id": "cddaa678-d850-4fb1-9abb-b41b529d78b9",
  "patient_id": "PAT004",
  "user_id": "e3e3addf-89e1-45f9-9cfb-92a25959032c",
  "name": "Jill Briggs",
  "phone": "(504)292-1322",
  "email": "jamesgarcia@example.com",
  "address": "08521 Patel Ridge Suite 948\nWest Crystalmouth, AR 06482",
  "location": "New Shirley",
  "initial_complaint": "Because be send situation other those agency Democrat.",
  "initial_diagnosis": "",
  "photo": null,
  "group": "General",
  "is_favorite": false,
  "created_at": "2025-12-23T09:10:26.593000",
  "updated_at": "2025-12-23T09:10:29.037000"
}
GET /patients/cddaa678-d850-4fb1-9abb-b41b529d78b9/notes returned 1 notes.