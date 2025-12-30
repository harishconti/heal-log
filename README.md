# HealLog

HealLog is a patient management system with a FastAPI backend and a React Native frontend designed for Web, iOS, and Android platforms.

## Features

### Core Features
- Patient management with search, filtering, and grouping
- Clinical notes with visit types and timestamps
- Offline-first architecture with automatic sync
- JWT authentication with OTP email verification
- Data export (CSV format)

### Technical Features
- Cross-platform (iOS, Android, Web via Expo)
- WatermelonDB for offline storage
- MongoDB with Beanie ODM
- Rate limiting and security headers
- Analytics and telemetry

---

## Technical Architecture

The application uses a decoupled, three-tier architecture. The core is a **FastAPI backend** that serves as the single source of truth and handles all business logic. It communicates with a **cross-platform React Native client** that targets iOS, Android, and Web, providing a consistent user experience across devices.

### Backend

The backend is a FastAPI application with a modular structure. The main entrypoint is `backend/main.py`.

-   **`api/`**: API endpoint definitions (routers)
-   **`core/`**: Core application logic, configuration, and security
-   **`db/`**: Database session management and initialization
-   **`schemas/`**: Beanie document models and Pydantic schemas
-   **`services/`**: Business logic, separated from the API layer

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
- Python 3.11+
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
| [Contributing](./CONTRIBUTING.md) | Contribution guidelines |
| [Changelog](./CHANGELOG.md) | Version history |
| [Security](./SECURITY.md) | Security policy and reporting |
| [Deployment Guide](./DEPLOYMENT_GUIDE.md) | Deployment instructions |
| [Play Store Guide](./PLAY_STORE_GUIDE.md) | Google Play submission |

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

### Clinical Notes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients/{id}/notes` | POST | Create clinical note |
| `/api/patients/{id}/notes` | GET | List patient notes (paginated) |

### Sync

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync/pull` | POST | Pull changes from server |
| `/api/sync/push` | POST | Push local changes |

### Export

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/export/patients` | GET | Export patients as CSV |
| `/api/export/clinical-notes` | GET | Export notes as CSV |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/health` | GET | Get user statistics |
| `/api/analytics/growth` | GET | Get patient growth data |

---

## Environment Variables

### Frontend (.env)

```
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000
```

### Backend (.env)

```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=heallog
JWT_SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:3000
```

---

## Legal

- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms of Service](./TERMS_OF_SERVICE.md)
- [Security Policy](./SECURITY.md)

---

## Project Status

- 48 backend tests passing
- All critical endpoints operational
- Offline-first sync working
- OTP verification and password reset functional
- Security hardening complete

---

## License

Proprietary - All rights reserved.
