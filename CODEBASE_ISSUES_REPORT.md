# PatientLog Codebase Issues Report

**Date:** 2025-12-24
**Analyzed by:** Automated Code Review
**Total Issues Found:** 48+

---

## Executive Summary

This report documents all bugs, security vulnerabilities, and code quality issues identified in the PatientLog codebase. Issues are categorized by severity and type.

| Severity | Count | Action Required |
|----------|-------|-----------------|
| 🔴 Critical | 6 | Immediate fix before production |
| 🟠 High | 18 | Fix within sprint |
| 🟡 Medium | 18 | Schedule for upcoming sprints |
| 🔵 Low | 6 | Address when convenient |

---

## 🔴 CRITICAL ISSUES (6)

### 1. Missing Stripe Webhook Signature Verification
**Files:**
- `backend/app/api/payments.py` (lines 44-69)
- `backend/app/api/webhooks.py` (lines 6-18)

**Description:** Webhook endpoints accept POST requests without verifying Stripe webhook signatures. The code comments explicitly acknowledge this is missing.

**Impact:** Attackers can forge webhook events to:
- Upgrade any user to PRO subscription without payment
- Create fraudulent payment records
- Trigger unauthorized account modifications

**Fix:** Implement HMAC-SHA256 signature verification using Stripe's webhook secret:
```python
import stripe
stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
```

---

### 2. NoSQL Regex Injection Vulnerability
**File:** `backend/app/services/patient_service.py` (lines 55-80)

**Description:** User-controlled `search` parameter is passed directly to MongoDB `$regex` without sanitization:
```python
search_regex = {"$regex": search, "$options": "i"}
```

**Impact:**
- Data exfiltration through timing attacks
- ReDoS (Regular Expression Denial of Service)
- Access control bypass

**Fix:** Escape regex special characters:
```python
import re
escaped_search = re.escape(search)
search_regex = {"$regex": escaped_search, "$options": "i"}
```

---

### 3. Missing RedisBackend Import
**File:** `backend/main.py` (line 55)

**Description:** `RedisBackend` is used but never imported:
```python
FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
```

**Impact:** Application crashes with `NameError: name 'RedisBackend' is not defined` when Redis is configured.

**Fix:** Add import:
```python
from fastapi_cache.backends.redis import RedisBackend
```

---

### 4. Insecure Token Storage on Web Platform
**Files:**
- `frontend/services/api.ts` (lines 18-26)
- `frontend/contexts/AuthContext.tsx` (lines 10-47)

**Description:** JWT tokens are stored in `localStorage` for web platform, which is accessible to any JavaScript on the page.

**Impact:** Tokens are vulnerable to XSS attacks. Any malicious script can steal authentication tokens.

**Fix:** Use HttpOnly, Secure cookies with SameSite attribute instead of localStorage.

---

### 5. CORS Wildcard Allowing Any Origin
**Files:**
- `backend/app/core/config.py` (line 44)
- `backend/.env.production.example` (line 40)

**Description:** Default CORS configuration allows all origins (`ALLOWED_ORIGINS = "*"`), even in production template.

**Impact:**
- Enables CSRF attacks from any malicious website
- Allows cross-origin data exfiltration
- Bypasses same-origin policy protections

**Fix:** Explicitly define allowed origins:
```python
ALLOWED_ORIGINS = "https://your-frontend-domain.com"
```

---

### 6. Debug Endpoints Exposed Without Authentication
**File:** `backend/app/api/debug.py` (lines 9-48)

**Description:** Debug endpoints `/debug/clear-all-caches` and `/debug/sentry-test` have no authentication requirement.

**Impact:**
- Anyone can clear all application caches (DoS attack)
- Anyone can trigger error reporting to view internal system details

**Fix:** Remove debug endpoints from production or add admin-only authentication:
```python
@router.post("/clear-all-caches", dependencies=[Depends(require_admin)])
```

---

## 🟠 HIGH SEVERITY ISSUES (18)

### Security Issues

#### 7. JWT Tokens Logged in Plaintext
**File:** `frontend/services/api.ts` (lines 34-35)

```typescript
console.log('🔑 [API] Token added:', `${token.substring(0, 10)}...`);
```

**Fix:** Remove token logging entirely or use environment-based guards.

---

#### 8. Password Reset Token Sent in Email Body
**Files:**
- `backend/app/services/email_service.py` (lines 175-241)
- `backend/app/services/password_reset_service.py` (lines 28-30)

**Description:** Password reset tokens are sent as plaintext in email HTML body.

**Fix:** Send a click-through link with shorter expiration (15-30 minutes).

---

#### 9. Missing Password Strength Validation
**File:** `backend/app/api/auth.py` (lines 190-214)

**Description:** Password update endpoint doesn't validate password strength/complexity.

**Fix:** Add validation for minimum length (12+), uppercase, numbers, special characters.

---

#### 10. Sensitive Error Messages Expose System Info
**File:** `backend/app/api/users.py` (line 73)

```python
detail=f"Failed to update user profile: {str(e)}"  # Exposes exception details
```

**Fix:** Use generic error messages and log details server-side only.

---

#### 11. Missing Security Headers
**File:** `backend/main.py`

**Description:** No security headers configured (X-Content-Type-Options, X-Frame-Options, CSP, HSTS).

**Fix:** Add middleware to inject security headers.

---

#### 12. Excessive Server Information Disclosure
**File:** `backend/app/api/version.py` (lines 35-66)

**Description:** Version endpoint exposes commit hash, environment, uptime information.

**Fix:** Return minimal version info, require authentication.

---

### Logic Bugs

#### 13. Inverted Online/Offline Time Tracking
**File:** `frontend/services/analytics.ts` (lines 60-63)

```typescript
if (isOnline) {
  time.offline += diff;  // ❌ WRONG: adds to offline when online
} else {
  time.online += diff;   // ❌ WRONG: adds to online when offline
}
```

**Fix:** Swap the logic:
```typescript
if (isOnline) {
  time.online += diff;
} else {
  time.offline += diff;
}
```

---

#### 14. API Response Parsing Bug
**File:** `frontend/contexts/AuthContext.tsx` (line 133)

```typescript
const response = await api.get('/api/auth/me');
setUser(response.data);  // ❌ Should be response.data.user
```

**Description:** Backend returns `{"success": true, "user": {...}}` but frontend assigns entire response.

**Fix:** `setUser(response.data.user);`

---

#### 15. Timezone Comparison Bug
**File:** `backend/app/services/sync_service.py` (lines 101-102)

```python
if client_updated_at < patient.updated_at.replace(tzinfo=timezone.utc):
```

**Description:** `.replace(tzinfo=...)` doesn't convert time, just changes the label.

**Fix:** Use `.astimezone(timezone.utc)` for proper conversion.

---

#### 16. Division by Zero Returns 100% Success Rate
**File:** `backend/app/services/analytics_service.py` (line 136)

```python
sync_success_rate = successful_sync_events / total_sync_events if total_sync_events > 0 else 1.0
```

**Description:** No events should return 0% or None, not 100%.

**Fix:** Change `else 1.0` to `else 0.0` or `else None`.

---

### Error Handling Issues

#### 17. Missing KeyError Handling
**File:** `backend/app/services/sync_service.py` (lines 97, 109)

```python
patient_id = patient_data.pop('id')  # ❌ KeyError if 'id' missing
```

**Fix:**
```python
patient_id = patient_data.pop('id', None)
if not patient_id:
    raise ValueError("Missing 'id' in patient update data")
```

---

#### 18. Missing Field Validation
**File:** `backend/app/services/sync_service.py` (line 101)

```python
client_updated_at = datetime.fromtimestamp(patient_data['updated_at'] / 1000.0, ...)
```

**Description:** No validation that `updated_at` field exists.

**Fix:** Add existence check before accessing.

---

#### 19. Silent Failures in Sync
**File:** `frontend/services/sync.ts` (lines 80-81)

```typescript
} catch (error: any) {
    return { changes: {}, timestamp: lastPulledAt || Date.now() };  // Silent empty return
}
```

**Fix:** Propagate errors or notify user of sync failures.

---

#### 20. Resource Leak - SMTP Connection
**File:** `backend/app/services/oauth_email_service.py` (lines 80-101)

```python
server = smtplib.SMTP(self.smtp_host, self.smtp_port)
# ... operations ...
server.quit()  # Not called if exception occurs
```

**Fix:** Use context manager or try/finally.

---

### N+1 Query Problems

#### 21-24. Loop Queries in Sync Service
**File:** `backend/app/services/sync_service.py`

| Lines | Issue |
|-------|-------|
| 95-105 | Loop queries for updated patients |
| 107-113 | Loop queries for updated clinical notes |
| 116-120 | Loop queries for deleted patients |
| 122-126 | Loop queries for deleted notes |

**Impact:** 100 patients = 100 database queries instead of 1.

**Fix:** Use batch queries:
```python
patient_ids = [p.pop('id') for p in changes['patients']['updated']]
patients = await Patient.find(Patient.id.in_(patient_ids)).to_list()
```

---

## 🟡 MEDIUM SEVERITY ISSUES (18)

### Configuration Issues

| # | Issue | File | Line(s) |
|---|-------|------|---------|
| 25 | Missing SECRET_KEY, MONGO_URL in .env.example | `backend/.env.example` | 1-19 |
| 26 | Unpinned pymongo dependency | `backend/requirements.txt` | 19 |
| 27 | Outdated bcrypt (3.2.0 vs 4.x) | `backend/requirements.txt` | 28 |
| 28 | Production build missing BACKEND_URL | `frontend/eas.json` | 24-29 |
| 29 | Hardcoded production URL fallback | `frontend/services/api.ts` | 6 |
| 30 | Missing Dockerfile HEALTHCHECK | `backend/Dockerfile` | - |

### Database Issues

| # | Issue | File | Line(s) |
|---|-------|------|---------|
| 31 | Incorrect IndexModel syntax (not wrapped) | `backend/app/schemas/patient.py` | 29 |
| 32 | Duplicate index creation logic | `backend/create_indexes.py` vs schema | - |

### API Design Issues

| # | Issue | File | Line(s) |
|---|-------|------|---------|
| 33 | Missing pagination on patient list | `backend/app/api/patients.py` | 39-66 |
| 34 | Missing pagination on documents | `backend/app/api/documents.py` | 29-45 |
| 35 | Missing pagination on analytics | `backend/app/api/analytics.py` | 13-116 |
| 36 | Inconsistent response formats | Multiple files | - |
| 37 | Missing rate limiting on sync endpoints | `backend/app/api/sync.py` | 15, 31 |
| 38 | Route ordering problem (/{id} before /groups/) | `backend/app/api/patients.py` | 68, 149 |

### Error Handling

| # | Issue | File | Line(s) |
|---|-------|------|---------|
| 39 | Too broad exception catching | `backend/app/api/documents.py` | 23, 42 |
| 40 | Missing null checks on cache backend | `backend/app/api/health.py` | 26-28 |
| 41 | Unhandled promise rejections | `frontend/contexts/AuthContext.tsx` | 126 |
| 42 | Missing transaction rollback | `frontend/services/patient_service.ts` | 58-82 |

---

## 🔵 LOW SEVERITY ISSUES (6)

| # | Issue | File | Line(s) |
|---|-------|------|---------|
| 43 | OTP only 6 digits (weak) | `backend/app/services/otp_service.py` | 27-29 |
| 44 | Token refresh not implemented | `frontend/services/api.ts` | 60-73 |
| 45 | Wrong User model imports | `backend/app/api/beta.py`, `feedback.py` | 5 |
| 46 | Type comparison `== True` style | `backend/app/services/patient_service.py` | 79 |
| 47 | Deprecated @react-native-masked-view | `frontend/package.json` | 27 |
| 48 | Hardcoded app_version/device_model | `frontend/services/api.ts` | 125-126 |

---

## Recommended Fix Priority

### Phase 1: Immediate (Before Production)
1. Fix webhook signature verification (#1)
2. Fix NoSQL injection (#2)
3. Add RedisBackend import (#3)
4. Fix CORS configuration (#5)
5. Secure/remove debug endpoints (#6)

### Phase 2: This Sprint
1. Fix token storage security (#4)
2. Fix inverted analytics logic (#13)
3. Fix API response parsing (#14)
4. Add input validation for sync (#17, #18)
5. Fix N+1 queries (#21-24)

### Phase 3: Next Sprint
1. Add security headers (#11)
2. Add pagination (#33-35)
3. Fix rate limiting (#37)
4. Update dependencies (#26, #27)
5. Add password validation (#9)

### Phase 4: Backlog
1. Improve OTP security (#43)
2. Implement token refresh (#44)
3. Fix minor code quality issues (#45-48)

---

## Files Most Affected

| File | Issues Count |
|------|-------------|
| `backend/app/services/sync_service.py` | 7 |
| `backend/main.py` | 4 |
| `frontend/services/api.ts` | 4 |
| `backend/app/api/payments.py` | 3 |
| `frontend/contexts/AuthContext.tsx` | 3 |
| `backend/app/core/config.py` | 3 |

---

*Report generated by automated code analysis. Please review and prioritize fixes accordingly.*
