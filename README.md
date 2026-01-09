# HealLog

HealLog is a patient management system with a FastAPI backend and a React Native frontend designed for Web, iOS, and Android platforms.

**Current Version:** 1.0.9 | **Backend Tests:** 48 passing | **API Routers:** 17

## Features

### Core Features
- Patient management with search, filtering, and grouping
- Clinical notes with visit types and timestamps
- Offline-first architecture with automatic sync
- JWT authentication with OTP email verification
- Data export (CSV format)
- Web dashboard for Pro users (analytics and management)
- Document management for patient files
- Google Contacts sync integration
- Push notifications support
- Biometric authentication (fingerprint/face)
- Beta feedback and known issues system

### Technical Features
- Cross-platform (iOS, Android, Web via Expo)
- WatermelonDB for offline storage
- MongoDB with Beanie ODM
- Rate limiting and security headers
- Analytics and telemetry tracking
- React + Vite web dashboard with Tailwind CSS
- Stripe payment integration for subscriptions
- Sentry error monitoring

---

## Technical Architecture

The application uses a decoupled, three-tier architecture. The core is a **FastAPI backend** that serves as the single source of truth and handles all business logic. It communicates with a **cross-platform React Native client** that targets iOS, Android, and Web, providing a consistent user experience across devices.

### Backend

The backend is a FastAPI application with a modular structure. The main entrypoint is `backend/main.py`.

-   **`api/`**: API endpoint definitions (17 routers)
-   **`core/`**: Configuration, security, exceptions, and logging
-   **`db/`**: Database session management and initialization
-   **`models/`**: Beanie ODM document models
-   **`schemas/`**: Pydantic request/response schemas
-   **`services/`**: Business logic (16 services)
-   **`middleware/`**: Request logging middleware

### Frontend

The frontend is a React Native application built with Expo. The main entrypoint is `frontend/app/index.tsx`.

-   **`app/`**: Uses Expo Router for file-based routing
-   **`components/`**: Reusable React Native components
-   **`contexts/`**: React contexts for state management
-   **`models/`**: WatermelonDB models for offline data storage
-   **`services/`**: Services for interacting with the backend API
-   **`store/`**: Zustand store for global state management

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- MongoDB
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Android Development

```bash
cd frontend
npm run android
```

### Build for Production

```bash
cd frontend
eas build --platform android --profile production
```

---

## Testing

### Backend Tests

```bash
cd backend
pytest
```

**Test Status:** 48 tests passing

---

## Documentation

| Document | Description |
|----------|-------------|
| [API Documentation](./API_DOCUMENTATION.md) | Complete API reference with examples |
| [Architecture](./docs/ARCHITECTURE.md) | System architecture overview |
| [Database Schema](./docs/DATABASE_SCHEMA.md) | MongoDB schema documentation |
| [Setup Guide](./docs/SETUP_GUIDE.md) | Development environment setup |
| [Contributing](./CONTRIBUTING.md) | Contribution guidelines |
| [Changelog](./CHANGELOG.md) | Version history |
| [Security](./SECURITY.md) | Security policy and reporting |
| [Deployment Guide](./DEPLOYMENT_GUIDE.md) | Deployment instructions |
| [Play Store Guide](./PLAY_STORE_GUIDE.md) | Google Play submission |
| [Beta Testing Guide](./BETA_TESTING_GUIDE.md) | Beta tester instructions |
| [Web Dashboard](./frontend/web-dashboard/README.md) | Web dashboard documentation |

---

## API Overview

Interactive API documentation is available at `/docs` when the backend is running.

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete details.

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Authenticate a user |
| `/api/auth/verify-otp` | POST | Verify email with OTP |
| `/api/auth/resend-otp` | POST | Resend OTP code |
| `/api/auth/forgot-password` | POST | Request password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/me` | GET | Get current user info |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get user profile |
| `/api/users/me` | PUT | Update user profile |
| `/api/users/me/password` | POST | Change password |

### Patients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients/` | POST | Create a patient |
| `/api/patients/` | GET | List patients (search, filter, paginate) |
| `/api/patients/{id}` | GET | Get patient by ID |
| `/api/patients/{id}` | PUT | Update patient |
| `/api/patients/{id}` | DELETE | Delete patient |
| `/api/patients/groups/` | GET | Get patient groups |
| `/api/patients/stats/` | GET | Get patient statistics |

### Clinical Notes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients/{id}/notes` | POST | Create clinical note |
| `/api/patients/{id}/notes` | GET | List patient notes (paginated) |
| `/api/patients/{id}/notes/{note_id}` | DELETE | Delete clinical note |

### Sync

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync/pull` | POST | Pull changes from server |
| `/api/sync/push` | POST | Push local changes |

### Export

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/export/patients` | GET | Export patients as CSV |
| `/api/export/notes` | GET | Export clinical notes as CSV |
| `/api/export/all` | GET | Export all user data (GDPR) |

### Analytics (Pro)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/patient-growth` | GET | Patient growth over time |
| `/api/analytics/notes-activity` | GET | Notes activity metrics |
| `/api/analytics/weekly-activity` | GET | Weekly usage statistics |
| `/api/analytics/demographics` | GET | Patient demographics |
| `/api/analytics/health` | GET | User health statistics |

### Google Contacts

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/google-contacts/sync` | POST | Start Google Contacts sync |
| `/api/google-contacts/status` | GET | Get sync job status |

### Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | API health check |
| `/api/version` | GET | API version info |
| `/api/documents/` | POST | Upload document |
| `/api/feedback/submit` | POST | Submit beta feedback |
| `/api/telemetry/` | POST | Log telemetry event |
| `/api/beta/known-issues` | GET | Get known beta issues |

---

## Environment Variables

### Frontend (.env)

```
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_LOG_LEVEL=debug
EXPO_PUBLIC_ENVIRONMENT=development
```

### Backend (.env)

```
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=heallog

# Security
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:5173

# Email (for OTP and password reset)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@heallog.com

# Optional
SENTRY_DSN=your-sentry-dsn
REDIS_URL=redis://localhost:6379
```

---

## Legal

- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [Security Policy](./SECURITY.md)

---

## Project Status

- **Version:** 1.0.9 (stable)
- **Tests:** 48 backend tests passing
- **Endpoints:** All 17 API routers operational
- **Sync:** Offline-first with WatermelonDB working
- **Auth:** OTP verification, password reset, and biometric authentication functional
- **Security:** Rate limiting, security headers, input sanitization complete
- **Audit:** All 14 integration issues resolved
- **Dashboard:** Web dashboard for Pro users available
- **Payments:** Stripe subscription integration ready
- **Integrations:** Google Contacts sync with offline queue support

---

## License

Proprietary - All rights reserved.
