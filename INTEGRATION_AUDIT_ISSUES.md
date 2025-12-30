# HealLog Integration Audit Report

**Audit Date:** December 30, 2025
**Auditor:** Claude Code Integration Audit
**Status:** Issues Identified - Action Required

---

## Executive Summary

This document outlines discrepancies found between the frontend (React Native/Expo) and backend (FastAPI/Python) of the HealLog application. These issues range from **critical** (security vulnerabilities, broken functionality) to **minor** (code quality, dead code).

---

## Critical Issues

### 1. Token Storage Inconsistency (Security Risk)
**Location:** `frontend/app/verify-otp.tsx:101-107`
**Severity:** Critical

**Problem:** The OTP verification screen uses `localStorage` for web token storage, while the rest of the application uses `sessionStorage`.

```typescript
// verify-otp.tsx (INCORRECT)
if (Platform.OS === 'web') {
    window.localStorage.setItem('token', response.access_token);
    window.localStorage.setItem('refresh_token', response.refresh_token);
}
```

```typescript
// AuthContext.tsx and api.ts (CORRECT)
if (Platform.OS === 'web') {
    window.sessionStorage.setItem(key, value);
}
```

**Impact:**
- `localStorage` persists across browser sessions (security risk)
- `sessionStorage` clears on tab close (more secure)
- Inconsistent token storage can cause authentication state issues

**Fix Required:** Update `verify-otp.tsx` to use `sessionStorage` or the `SecureStorageAdapter` from `AuthContext.tsx`.

---

### 2. Password Validation Mismatch
**Location:**
- Frontend: `frontend/lib/validation.ts:88-90`
- Backend: `backend/app/schemas/user.py:82-99`

**Severity:** Critical

**Problem:** Password requirements differ between frontend and backend:

| Requirement | Frontend | Backend |
|-------------|----------|---------|
| Min Length | 8 characters | 12 characters |
| Uppercase | Required | Required |
| Lowercase | Required | Required |
| Number | Required | Required |
| Special Chars | `@$!%*?&` only | `!@#$%^&*(),.?\":{}|<>` |

**Impact:**
- Users can set passwords on registration that fail password change validation
- Inconsistent security enforcement

**Fix Required:** Align password validation rules between frontend and backend (recommend using backend's stricter 12-character requirement).

---

## High Priority Issues

### 3. Feedback API Endpoint Mismatch
**Location:** `frontend/app/(tabs)/settings/feedback.tsx:18`
**Severity:** High

**Problem:** Missing `/api` prefix in API call:
```typescript
// INCORRECT
await api.post('/feedback/submit', data);

// CORRECT
await api.post('/api/feedback/submit', data);
```

**Impact:** 404 errors when submitting feedback from settings.

---

### 4. Feedback API Import Error
**Location:** `frontend/app/(tabs)/settings/feedback.tsx:6`
**Severity:** High

**Problem:** Named import used but default export exists:
```typescript
// INCORRECT
import { api } from '@/services/api';

// CORRECT
import api from '@/services/api';
```

**Impact:** Runtime error - `api` is undefined.

---

### 5. Feedback Type Mapping Incomplete
**Location:**
- Frontend: `frontend/services/api.ts:129-154`
- Backend: `backend/app/schemas/beta_feedback.py:11-12`

**Severity:** High

**Problem:** Frontend feedback types don't fully map to backend schema:

| Frontend Type | Maps To | Backend Accepts |
|---------------|---------|-----------------|
| `bug` | `bug` | `bug` |
| `feature` | `suggestion` | `suggestion` |
| `other` | NOT MAPPED | `general` |

**Impact:** Submitting "other" feedback type will cause validation error.

**Fix Required:** Add mapping for `'other'` to `'general'` in `api.ts`:
```typescript
feedback_type: feedback.feedbackType === 'feature' ? 'suggestion' :
               feedback.feedbackType === 'other' ? 'general' :
               feedback.feedbackType,
```

---

### 6. Clinical Note Schema Field Mismatch (Sync Issues)
**Location:**
- Frontend: `frontend/models/PatientNote.ts`
- Backend: `backend/app/schemas/clinical_note.py`

**Severity:** High

**Problem:** Field names don't align between frontend WatermelonDB model and backend MongoDB schema:

| Frontend (WatermelonDB) | Backend (MongoDB) | Purpose |
|-------------------------|-------------------|---------|
| `timestamp` | `created_at` / `updated_at` | Creation time |
| `createdBy` | `user_id` | Creator reference |

**Impact:**
- Sync operations may fail or lose data
- Data mapping issues during pull/push operations

**Fix Required:** Either:
1. Update frontend model to use `created_at`, `updated_at`, `user_id`
2. Add field mapping in sync service

---

### 7. User Schema Missing `role` Field
**Location:** `frontend/store/useAppStore.ts:20-32`
**Severity:** High

**Problem:** Frontend `User` interface missing `role` field that backend provides:

```typescript
// Frontend User interface (MISSING role)
export interface User {
  id: string;
  email: string;
  phone: string;
  full_name: string;
  medical_specialty: string;
  plan: UserPlan;
  subscription_status: SubscriptionStatus;
  subscription_end_date: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  // MISSING: role: UserRole;
}
```

**Impact:**
- Cannot implement role-based UI features
- TypeScript type safety compromised

---

## Medium Priority Issues

### 8. Visit Type Validation Missing
**Location:** `frontend/lib/validation.ts:101-105`
**Severity:** Medium

**Problem:** Frontend note schema doesn't restrict `visit_type` values:
```typescript
// Frontend (accepts any string)
visit_type: z.string().min(1, "Visit type is required"),

// Backend (only accepts specific values)
visit_type: Literal["regular", "follow-up", "emergency"] = "regular"
```

**Impact:** Frontend could send invalid visit types causing 422 validation errors.

---

### 9. Profile Screen Import Error
**Location:** `frontend/app/profile.tsx:23`
**Severity:** Medium

**Problem:** Named import used for default export:
```typescript
// INCORRECT
import { Patient } from '@/models/Patient';

// CORRECT
import Patient from '@/models/Patient';
```

**Impact:** Potential runtime error.

---

### 10. Duplicate Feedback Screens
**Location:**
- `frontend/app/screens/FeedbackScreen.tsx`
- `frontend/app/(tabs)/settings/feedback.tsx`
- `frontend/app/feedback.tsx` (if exists)

**Severity:** Medium

**Problem:** Multiple feedback screen implementations exist, causing maintenance burden and potential inconsistencies.

**Impact:**
- Code duplication
- Different implementations may behave differently
- Harder to maintain

---

### 11. Patient Schema Field Name Discrepancy
**Location:**
- Frontend form: `full_name`, `phone_number`
- Backend schema: `name`, `phone`

**Severity:** Medium

**Problem:** Frontend form uses different field names than backend:

| Frontend Form | Backend Schema |
|---------------|----------------|
| `full_name` | `name` |
| `phone_number` | `phone` |
| `date_of_birth` | Not in schema |

**Note:** The `PatientService.createPatient` does handle this mapping correctly, but it could cause confusion.

---

## Low Priority Issues

### 12. Hardcoded Colors in Analytics Screen
**Location:** `frontend/app/analytics.tsx:77, 132-211`
**Severity:** Low

**Problem:** Uses hardcoded colors (`#333`, `#666`, `#f5f5f5`) instead of theme colors.

**Impact:** Doesn't respect dark mode theme.

---

### 13. Missing Route Registration in Layout
**Location:** `frontend/app/_layout.tsx:63-71`
**Severity:** Low

**Problem:** Several screens are not explicitly registered in Stack navigation:
- `verify-otp`
- `forgot-password`
- `add-patient`
- `patient/[id]`
- `edit-patient/[id]`
- `contacts-import`
- `contacts-sync`
- `upgrade`
- `feedback`
- `debug-console`

**Note:** Expo Router auto-discovers files, so this may not cause issues, but explicit registration is recommended.

---

### 14. Unused Backend URL Variable
**Location:** `frontend/store/useAppStore.ts:5`
**Severity:** Low

**Problem:**
```typescript
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
// This variable is declared but never used
```

---

## Recommendations Summary

### Immediate Actions Required:
1. Fix token storage in `verify-otp.tsx` (security)
2. Fix feedback endpoint URL and import
3. Align password validation requirements
4. Add feedback type mapping for "other" -> "general"

### Short-term Actions:
5. Align clinical note schema fields for sync
6. Add `role` field to frontend User interface
7. Add visit type validation to frontend
8. Fix Patient import in profile.tsx

### Long-term Actions:
9. Consolidate duplicate feedback screens
10. Apply theme colors consistently across all screens
11. Clean up unused variables
12. Register all routes explicitly in layout

---

## Testing Recommendations

After fixes are applied, test the following flows:
1. **Registration -> OTP Verification -> Login** (token storage)
2. **Login -> Password Change** (validation consistency)
3. **Submit Feedback** from settings screen
4. **Create Patient -> Sync -> Pull** (schema alignment)
5. **Add Clinical Note -> Sync** (field mapping)

---

## Files Requiring Changes

| File | Priority | Issues |
|------|----------|--------|
| `frontend/app/verify-otp.tsx` | Critical | #1 |
| `frontend/lib/validation.ts` | Critical/Medium | #2, #8 |
| `frontend/app/(tabs)/settings/feedback.tsx` | High | #3, #4 |
| `frontend/services/api.ts` | High | #5 |
| `frontend/models/PatientNote.ts` | High | #6 |
| `frontend/store/useAppStore.ts` | High | #7 |
| `frontend/app/profile.tsx` | Medium | #9 |
| `frontend/app/analytics.tsx` | Low | #12 |
| `frontend/app/_layout.tsx` | Low | #13 |

---

*End of Audit Report*
