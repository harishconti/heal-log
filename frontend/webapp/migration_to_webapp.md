# Migration Report: Web Dashboard to Webapp

## Executive Summary

This report documents the required backend integrations to migrate from `web-dashboard` to `webapp` as the primary web application. The webapp currently has UI components with **mock implementations** that need real API integration to match the functionality of web-dashboard.

---

## Current State Analysis

### Webapp (New Frontend)
- **Location**: `frontend/webapp/`
- **Framework**: React with Vite
- **Styling**: TailwindCSS
- **State**: Local React state (useState)
- **API Integration**: None (all mock/simulated)
- **AI Features**: Gemini integration for patient summaries

### Web-Dashboard (Current Production)
- **Location**: `frontend/web-dashboard/`
- **Framework**: React with Vite
- **Styling**: TailwindCSS with shadcn/ui
- **State**: Zustand (authStore)
- **API Integration**: Full backend integration
- **Auth**: JWT with token refresh, OTP verification

---

## 1. Authentication Pages

### 1.1 Login Screen

**File**: `components/LoginScreen.tsx`

**Current State**: Mock implementation with simulated delay
```typescript
// Lines 16-24: Mock login
const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setTimeout(() => {
    setIsLoading(false);
    onLogin();
  }, 800);
};
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| API Call | None | `POST /auth/login` (OAuth2 form) |
| Email Validation | Optional | Required, case-insensitive |
| Error Handling | None | Handle 401, 403 (unverified), 429 (lockout) |
| Token Storage | None | Store access_token, refresh_token in sessionStorage |
| Redirect on 403 | None | Redirect to OTP verification page |

**Backend Endpoint**: `POST /api/auth/login`
```typescript
// Request: application/x-www-form-urlencoded
// Body: { username: email, password: password }
// Response: { access_token, refresh_token, token_type, user }
```

**New Features Needed**:
- [ ] Input validation (email format, password required)
- [ ] Error message display for invalid credentials
- [ ] Account lockout notification (after 5 failed attempts)
- [ ] Redirect to OTP page if email not verified
- [ ] Remember email option (optional)
- [ ] Google/Microsoft OAuth (UI exists but non-functional)

---

### 1.2 Create Account Screen

**File**: `components/CreateAccountScreen.tsx`

**Current State**: Mock implementation
```typescript
// Lines 17-27: Mock registration
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!agreed) return;
  setIsLoading(true);
  setTimeout(() => {
    setIsLoading(false);
    onCreateAccount();
  }, 1000);
};
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| API Call | None | `POST /auth/register` |
| Fields | name, email, password | full_name, email, password, phone (opt), medical_specialty (opt) |
| Password Requirements | None | 12+ chars, uppercase, lowercase, digit, special char |
| Validation | Basic HTML5 | Zod/custom validation with strength indicator |
| Post-Register Flow | Direct login | Redirect to OTP verification |

**Backend Endpoint**: `POST /api/auth/register`
```typescript
// Request: application/json
// Body: { email, password, full_name, phone?, medical_specialty? }
// Response: { success, message, requires_verification, email }
```

**New Features Needed**:
- [ ] Add phone number field (optional)
- [ ] Add medical specialty dropdown (optional)
- [ ] Password strength indicator (like web-dashboard)
- [ ] Password requirements display (12+ chars, etc.)
- [ ] Handle 409 Conflict (email already exists)
- [ ] Redirect to OTP verification on success
- [ ] Google/Microsoft OAuth (UI exists but non-functional)

---

### 1.3 Forgot Password Screen

**File**: `components/ForgotPasswordScreen.tsx`

**Current State**: Mock implementation with success state
```typescript
// Lines 13-21: Mock forgot password
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setTimeout(() => {
    setIsLoading(false);
    setIsSubmitted(true);
  }, 1500);
};
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| API Call | None | `POST /auth/forgot-password` |
| Response | Always success | Generic success (prevents email enumeration) |
| Resend | UI only | Actual resend with cooldown |
| Rate Limiting | None | 5/10min, 10/day per IP |

**Backend Endpoint**: `POST /api/auth/forgot-password`
```typescript
// Request: application/json
// Body: { email }
// Response: { success, message } (always success to prevent enumeration)
```

**New Features Needed**:
- [ ] API integration
- [ ] Resend functionality with cooldown
- [ ] Rate limit error handling

---

### 1.4 Email Verification Screen (OTP)

**File**: `components/VerifyEmailScreen.tsx`

**Status**: ✅ UI Implemented (Mock)

**Current State**: Mock implementation with simulated verification
```typescript
// Lines 57-66: Mock OTP verification
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (otp.some(digit => digit === '')) return;
  setIsLoading(true);
  setTimeout(() => {
    setIsLoading(false);
    onVerify();
  }, 1500);
};
```

**Implemented Features**:
- ✅ 6-digit OTP input with auto-focus
- ✅ Numeric-only validation
- ✅ Paste support for OTP codes
- ✅ Auto-advance to next input on entry
- ✅ Backspace navigation between inputs
- ✅ Loading state animation
- ✅ Resend button (UI only)

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| API Call | None | `POST /api/auth/verify-otp` |
| Resend OTP | UI only | `POST /api/auth/resend-otp` with cooldown |
| Email Display | Not shown | Display email being verified |
| Timer | None | 60-second cooldown for resend |
| Error Handling | None | Handle invalid OTP, expired OTP |

**Backend Endpoints**:
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP (60s cooldown)

```typescript
// verify-otp
// Body: { email, otp_code }
// Response: { success, message, access_token, refresh_token, user }

// resend-otp
// Body: { email }
// Response: { success, message }
```

**New Features Needed**:
- [ ] API integration for OTP verification
- [ ] Resend functionality with 60s cooldown timer
- [ ] Display email address being verified
- [ ] Error handling for invalid/expired OTP
- [ ] Rate limit error handling

---

### 1.5 Reset Password Screen

**File**: `components/ResetPasswordScreen.tsx`

**Status**: ✅ UI Implemented (Mock)

**Current State**: Mock implementation with simulated password reset
```typescript
// Lines 16-28: Mock reset password
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (password !== confirmPassword) {
    return;
  }
  setIsLoading(true);
  setTimeout(() => {
    setIsLoading(false);
    onSubmit();
  }, 1500);
};
```

**Implemented Features**:
- ✅ New password input with show/hide toggle
- ✅ Confirm password input with show/hide toggle
- ✅ Password match validation
- ✅ Loading state animation
- ✅ Back to login navigation

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| API Call | None | `POST /api/auth/reset-password` |
| Token from URL | None | Extract reset token from URL params |
| Password Strength | None | Indicator with requirements display |
| Validation | Basic match check | 12+ chars, uppercase, lowercase, digit, special char |
| Error Handling | None | Handle invalid/expired token errors |

**Backend Endpoint**: `POST /api/auth/reset-password`
```typescript
// Body: { token, new_password }
// Response: { success, message }
```

**New Features Needed**:
- [ ] API integration for password reset
- [ ] Extract reset token from URL query parameters
- [ ] Password strength indicator (like web-dashboard)
- [ ] Password requirements display
- [ ] Handle 400/404 for invalid/expired token

---

## 2. API Client Infrastructure (NEW)

### 2.1 API Client Module

**Status**: Does not exist in webapp

**Required**: Create `webapp/api/client.ts`

**Features Needed**:
- [ ] Axios instance with base URL configuration
- [ ] Request interceptor for Bearer token
- [ ] Response interceptor for 401 handling
- [ ] Automatic token refresh with mutex pattern
- [ ] Token manager utility (get/set/clear/validate)
- [ ] sessionStorage for token persistence

**Reference**: `web-dashboard/src/api/client.ts` (lines 1-204)

---

### 2.2 Auth API Module

**Status**: Does not exist in webapp

**Required**: Create `webapp/api/auth.ts`

```typescript
export const authApi = {
  login(data: { username: string; password: string }): Promise<AuthResponse>;
  register(data: RegisterRequest): Promise<{ message: string; email: string }>;
  verifyOtp(email: string, otp: string): Promise<AuthResponse>;
  resendOtp(email: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ message: string }>;
  getCurrentUser(): Promise<User>;
  refreshToken(refreshToken: string): Promise<AuthResponse>;
  logout(): Promise<{ message: string }>;
};
```

---

## 3. State Management (NEW)

### 3.1 Auth Store

**Status**: Does not exist in webapp (using local state)

**Current** (App.tsx lines 304-324):
```typescript
const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
```

**Required**: Create Zustand store `webapp/store/authStore.ts`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}
```

**Reference**: `web-dashboard/src/store/authStore.ts`

---

## 4. Patients Page

**File**: `components/PatientsPage.tsx`

**Current State**: Mock data from constants
```typescript
// Line 186: Uses MOCK_PATIENTS
{MOCK_PATIENTS.map((patient) => (
  <PatientListItem ... />
))}
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| Data Source | `MOCK_PATIENTS` constant | `GET /api/patients/` |
| Pagination | UI only (fake pages) | Real pagination with API |
| Search | UI only | API search with query params |
| Filters | UI only | API filtering (group, favorites) |
| Stats | Hardcoded (145, 12, 24, 8) | `GET /api/patients/stats/` |
| Create | UI button only | Modal + `POST /api/patients/` |
| Delete | None | `DELETE /api/patients/:id` |

**Backend Endpoints**:
```typescript
GET  /api/patients/?search=&group=&is_favorite=&page=&page_size=&sort_by=&sort_order=
GET  /api/patients/:id
POST /api/patients/
PUT  /api/patients/:id
DELETE /api/patients/:id
GET  /api/patients/stats/
GET  /api/patients/groups/
```

**New Features Needed**:
- [ ] Patients API module (`webapp/api/patients.ts`)
- [ ] Replace mock data with API calls
- [ ] Loading states during API fetches
- [ ] Error handling and retry logic
- [ ] Real search with debouncing
- [ ] Real pagination
- [ ] Filter tabs (All, Favorites, Critical, Department)
- [ ] Create patient modal/page
- [ ] Delete confirmation

---

## 4.1 Register Patient Page

**File**: `components/RegisterPatientPage.tsx`

**Status**: ✅ UI Implemented (Mock)

**Current State**: Form submission logs to console only
```typescript
// Lines 40-43: Mock patient registration
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  onSubmit(formData);  // Currently just passes data to parent
};
```

**Implemented Features**:
- ✅ Full patient registration form with styled inputs
- ✅ Personal info fields (Full Name, Gender, Age)
- ✅ Contact info fields (Phone, Email)
- ✅ Location dropdown
- ✅ Medical Group Category dropdown
- ✅ Emergency contact section (Name, Phone)
- ✅ Reason for visit textarea (optional)
- ✅ Back navigation to Patients list
- ✅ Favorite star toggle (UI only)

**Form Fields**:
| Field | Type | Required |
|-------|------|----------|
| fullName | text | Yes |
| gender | select (Male/Female/Other) | Yes |
| age | number | Yes |
| phone | tel | Yes |
| email | email | No |
| location | select | Yes |
| category | select (Medical Group) | Yes |
| emergencyName | text | Yes |
| emergencyPhone | tel | Yes |
| reason | textarea | No |

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| API Call | None | `POST /api/patients/` |
| Field Mapping | Local field names | Map to backend schema (name, year_of_birth, etc.) |
| Validation | Basic HTML5 | Zod/custom validation |
| Photo Upload | None | `POST /api/patients/:id/photo` |
| Success Feedback | Navigate back | Toast notification + navigate |
| Error Handling | None | Handle validation errors, duplicates |

**Backend Endpoint**: `POST /api/patients/`
```typescript
// Request: application/json
// Body: {
//   name: string,
//   phone?: string,
//   email?: string,
//   location?: string,
//   group?: string,
//   year_of_birth?: number,
//   gender?: 'male' | 'female' | 'other',
//   initial_complaint?: string
// }
// Response: Patient object
```

**New Features Needed**:
- [ ] API integration for patient creation
- [ ] Map form fields to backend schema
- [ ] Validation with error messages
- [ ] Success toast notification
- [ ] Patient photo upload
- [ ] Favorite toggle API integration

---

## 5. Analytics Page

**File**: `components/AnalyticsPage.tsx`

**Current State**: Hardcoded mock data
```typescript
// Lines 27-40: Hardcoded data
const GROWTH_DATA = [
  { name: 'WEEK 1', newPatients: 30, returning: 15 },
  // ...
];
const TREATMENTS_DATA = [
  { name: 'Physiotherapy...', dept: 'ORTHOPEDICS', count: 128, ... },
  // ...
];
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| Patient Growth | Hardcoded | `GET /api/analytics/patient-growth` |
| Notes Activity | None | `GET /api/analytics/notes-activity` |
| Weekly Activity | None | `GET /api/analytics/weekly-activity` |
| Demographics | None | `GET /api/analytics/demographics` |
| Export | UI only | `GET /api/analytics/export` (blob) |
| Time Range | Hardcoded "Last 30 Days" | Dynamic with query params |

**Backend Endpoints**:
```typescript
GET /api/analytics/patient-growth?days=30
GET /api/analytics/notes-activity?days=30
GET /api/analytics/weekly-activity
GET /api/analytics/demographics
GET /api/analytics/export (returns CSV blob)
```

**New Features Needed**:
- [ ] Analytics API module (`webapp/api/analytics.ts`)
- [ ] Replace hardcoded data with API calls
- [ ] Date range selector functionality
- [ ] Export to CSV functionality
- [ ] Loading states for charts

---

## 6. Profile Page

**File**: `components/ProfilePage.tsx`

**Current State**: Completely hardcoded
```typescript
// Lines 101-129: Hardcoded profile data
<p className="text-base font-bold text-gray-900">Dr. Alexander James Smith</p>
<p className="text-base font-bold text-gray-900">MED-883421-NY</p>
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| User Data | Hardcoded | `GET /api/users/me` or from auth store |
| Edit Profile | UI button only | `PUT /api/users/me` |
| Change Password | UI only | `POST /api/users/me/password` |
| Activity History | Hardcoded | API (if endpoint exists) |

**Backend Endpoints**:
```typescript
GET  /api/users/me
PUT  /api/users/me        // { full_name?, phone?, medical_specialty? }
POST /api/users/me/password // { current_password, new_password }
```

**New Features Needed**:
- [ ] User API module (`webapp/api/user.ts`)
- [ ] Fetch profile from API on mount
- [ ] Edit profile modal/form
- [ ] Change password modal with validation
- [ ] Notification preferences (if backend supports)

---

## 7. Settings Page

**File**: `components/SettingsPage.tsx`

**Current State**: Local state only, no persistence
```typescript
// Lines 40-48: Local state
const [notifications, setNotifications] = useState({
  email: true,
  desktop: true,
  critical: true
});
const [is2FAEnabled, setIs2FAEnabled] = useState(false);
const [theme, setTheme] = useState('light');
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| Email Display | Hardcoded | From auth store |
| Language/Timezone | UI only | Backend if supported, else localStorage |
| Change Password | UI only | `POST /api/users/me/password` |
| 2FA Toggle | UI only | Backend if implemented |
| Notifications | Local state | Backend or localStorage |
| Theme | Local state | localStorage or user preferences |
| Save Button | UI only | API call to save settings |

**New Features Needed**:
- [ ] Connect to auth store for email display
- [ ] Change password integration (same as Profile)
- [ ] localStorage for theme preference
- [ ] Actual notification settings (if backend supports)
- [ ] 2FA integration (if backend supports)

---

## 8. Dashboard Layout & Logout

**File**: `components/DashboardLayout.tsx`

**Current State**: Mock logout
```typescript
// App.tsx lines 320-324
const handleLogout = () => {
  setAuth({ isAuthenticated: false, user: null });
  setCurrentView(ViewState.DASHBOARD);
  setAuthView('LOGIN');
};
```

**Required Changes**:

| Feature | Current | Required |
|---------|---------|----------|
| User Display | Hardcoded "Dr. Alexander Smith" | From auth store |
| Logout | Just clears state | Call `POST /api/auth/logout` + clear tokens |
| Notifications | UI only | Real notifications (if endpoint exists) |

**Backend Endpoint**: `POST /api/auth/logout`

**New Features Needed**:
- [ ] Connect user info to auth store
- [ ] Real logout with token revocation
- [ ] Clear sessionStorage on logout

---

## 9. Types & Interfaces (UPDATE)

**File**: `types.ts`

**Current State**: Basic types with ViewState enum
```typescript
export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  condition: string;
  status: 'Critical' | 'Stable' | 'Recovering';
  notes: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export enum ViewState {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  PATIENTS = 'PATIENTS',
  REGISTER_PATIENT = 'REGISTER_PATIENT',  // ✅ NEW
  ANALYTICS = 'ANALYTICS',
  AI_SCRIBE = 'AI_SCRIBE',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
}
```

**Required Changes**: Align with backend models

```typescript
// User type to match backend
export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  medical_specialty?: string;
  plan: 'basic' | 'pro';
  role: 'doctor' | 'admin';
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due';
  subscription_end_date?: string;
  is_verified: boolean;
  is_beta_tester: boolean;
  created_at: string;
  updated_at: string;
}

// Patient type to match backend
export interface Patient {
  id: string;
  patient_id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  location?: string;
  initial_complaint?: string;
  initial_diagnosis?: string;
  photo?: string;
  group?: string;
  is_favorite: boolean;
  year_of_birth?: number;
  gender?: 'male' | 'female' | 'other';
  active_treatment_plan?: string;
  created_at: string;
  updated_at: string;
}

// Add new types
export interface ClinicalNote { ... }
export interface LoginRequest { ... }
export interface RegisterRequest { ... }
export interface AuthResponse { ... }
export interface PaginatedResponse<T> { ... }
```

---

## 10. New Files to Create

### Required New Files

| File | Purpose | Status |
|------|---------|--------|
| `api/client.ts` | Axios instance, token management, interceptors | ❌ Not created |
| `api/auth.ts` | Auth API functions | ❌ Not created |
| `api/patients.ts` | Patients API functions | ❌ Not created |
| `api/analytics.ts` | Analytics API functions | ❌ Not created |
| `api/user.ts` | User profile API functions | ❌ Not created |
| `api/index.ts` | Export all API modules | ❌ Not created |
| `store/authStore.ts` | Zustand auth state management | ❌ Not created |
| `utils/logger.ts` | Console logging utility | ❌ Not created |

### Recently Created Files (UI Only - Need API Integration)

| File | Purpose | Status |
|------|---------|--------|
| `components/VerifyEmailScreen.tsx` | OTP/Email verification page | ✅ UI complete (mock) |
| `components/ResetPasswordScreen.tsx` | Reset password page | ✅ UI complete (mock) |
| `components/RegisterPatientPage.tsx` | New patient registration form | ✅ UI complete (mock) |
| `services/geminiService.ts` | Gemini AI integration for summaries | ✅ Functional |

### Dependencies to Add

```json
{
  "dependencies": {
    "axios": "^1.x",
    "zustand": "^4.x",
    "zod": "^3.x"  // for form validation
  }
}
```

---

## 11. Security Considerations

### Token Storage
- Use `sessionStorage` (not localStorage) for tokens
- Tokens clear on tab/browser close
- Consider HttpOnly cookies for production (requires backend changes)

### Password Requirements
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 digit
- At least 1 special character

### Rate Limiting (Backend Enforced)
- Login: Limited per IP
- Registration: Limited per IP
- OTP Verification: 5 attempts per email per 15 minutes
- Forgot Password: 5/10min, 10/day per IP; 3/hour, 5/day per email

### Account Lockout
- 5 failed login attempts = 30-minute lockout
- Lockout cleared on successful login

---

## 12. Implementation Priority

### Phase 1: Core Authentication (Critical)
1. API Client infrastructure
2. Auth Store (Zustand)
3. Login page with API
4. OTP Verification page (NEW)
5. Logout functionality

### Phase 2: Registration & Password Reset
6. Create Account with API
7. Forgot Password with API
8. Reset Password page (NEW)

### Phase 3: Patient Management
9. Patients API integration
10. Patient list with real data
11. Patient CRUD operations
12. Patient Card AI summary (already works with mock)

### Phase 4: Analytics & Profile
13. Analytics API integration
14. Profile page with user data
15. Edit profile functionality
16. Change password functionality

### Phase 5: Settings & Polish
17. Settings persistence
18. Theme persistence
19. Notification preferences
20. Error boundaries & loading states

---

## 13. Comparison: Webapp vs Web-Dashboard

| Feature | Webapp | Web-Dashboard | Notes |
|---------|--------|---------------|-------|
| Login | Mock UI ✅ | Full | Need API integration |
| Registration | Mock UI ✅ | Full | Missing fields, OTP flow |
| OTP Verification | Mock UI ✅ | Full | VerifyEmailScreen.tsx exists |
| Forgot Password | Mock UI ✅ | Full | Need API integration |
| Reset Password | Mock UI ✅ | N/A (link in email) | ResetPasswordScreen.tsx exists |
| Token Refresh | None | Full | Need interceptor |
| Patients | Mock data | Full API | Need API integration |
| Patient Create | Mock UI ✅ | Full | RegisterPatientPage.tsx exists |
| Patient Edit | None | Full | Add functionality |
| Clinical Notes | None | Full | Add functionality |
| Analytics | Mock data | Full API | Need API integration |
| Profile | Hardcoded | Full API | Need API integration |
| Settings | Local state | Partial | Need persistence |
| AI Summary | Gemini ✅ | N/A | Already functional |

---

## 14. API Endpoints Summary

### Authentication
```
POST /api/auth/register
POST /api/auth/verify-otp
POST /api/auth/resend-otp
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/refresh
GET  /api/auth/me
POST /api/auth/logout
```

### Patients
```
GET    /api/patients/
GET    /api/patients/:id
POST   /api/patients/
PUT    /api/patients/:id
DELETE /api/patients/:id
GET    /api/patients/stats/
GET    /api/patients/groups/
GET    /api/patients/:id/notes
POST   /api/patients/:id/notes
```

### Analytics
```
GET /api/analytics/patient-growth?days=30
GET /api/analytics/notes-activity?days=30
GET /api/analytics/weekly-activity
GET /api/analytics/demographics
GET /api/analytics/export
```

### User
```
GET  /api/users/me
PUT  /api/users/me
POST /api/users/me/password
```

### Payments (Optional)
```
POST /api/payments/create-checkout-session
```

---

## 15. Environment Configuration

### Required Environment Variables
```env
VITE_API_URL=/api          # or full URL for production
VITE_APP_NAME=HealLog
```

### Vite Config Updates
```typescript
// vite.config.ts - add proxy for development
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Conclusion

The webapp has a solid UI foundation matching the web-dashboard design. Recent additions include:

### Recently Added Components (UI Complete - Need API Integration)
- ✅ `VerifyEmailScreen.tsx` - OTP/Email verification with 6-digit input
- ✅ `ResetPasswordScreen.tsx` - Password reset with confirmation
- ✅ `RegisterPatientPage.tsx` - Full patient registration form
- ✅ `geminiService.ts` - AI-powered patient summaries (functional)

### Remaining Work

1. **Infrastructure**: API client, token management, state management (Zustand)
2. **Auth Flow**: Connect existing UI to real API endpoints
3. **Data Integration**: Replace all mock data with real API calls
4. **Patient Management**: Connect RegisterPatientPage to backend API

The existing AI features (Gemini integration) are functional and can be retained. The Google/Microsoft OAuth buttons in the UI are placeholders - OAuth integration would require additional backend work if needed.

**Updated Scope**: Creating ~8 new API/infrastructure files, modifying ~10 existing files for API integration, adding 2-3 new dependencies.
