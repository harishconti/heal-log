# PatientLog

PatientLog is a patient management system with a FastAPI backend and a React Native frontend designed for Web, iOS, and Android platforms.

## Technical Architecture

The application uses a decoupled, three-tier architecture. The core is a **FastAPI backend** that serves as the single source of truth and handles all business logic. It communicates with a **cross-platform React Native client** that targets iOS, Android, and Web, providing a consistent user experience across devices.

### Backend

The backend is a FastAPI application with a modular structure. The main entrypoint is `backend/main.py`.

-   **`api/`**: API endpoint definitions (routers).
-   **`core/`**: Core application logic, configuration, and security.
-   **`db/`**: Database session management and initialization.
-   **`models/`**: Pydantic models for database collections.
-   **`schemas/`**: Pydantic schemas for API request/response validation.
-   **`services/`**: Business logic, separated from the API layer.

### Frontend

The frontend is a React Native application built with Expo. The main entrypoint is `frontend/app/index.tsx`.

-   **`app/`**: Uses Expo Router for file-based routing.
-   **`components/`**: Reusable React Native components.
-   **`contexts/`**: React contexts for state management.
-   **`models/`**: WatermelonDB models for offline data storage.
-   **`services/`**: Services for interacting with the backend API.
-   **`utils/`**: Utility functions including retry logic and monitoring.

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
eas build --platform android --profile beta
```

---

## Testing

### Backend Tests

```bash
cd backend
pytest
```

### Integration Tests

```bash
python test_api_endpoints.py
python comprehensive_integration_tests.py
```

### Database Indexing

To optimize database performance, run:

```bash
python backend/create_indexes.py
```

---

## API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register a new user |
| `/api/auth/login` | POST | Authenticate a user |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/auth/me` | GET | Get current user info |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/me` | GET | Get user profile |
| `/api/users/me` | PUT | Update user profile |

### Patients

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients/` | POST | Create a patient |
| `/api/patients/` | GET | List all patients |
| `/api/patients/{id}` | GET | Get patient by ID |
| `/api/patients/{id}` | PUT | Update patient |
| `/api/patients/{id}` | DELETE | Delete patient |

### Clinical Notes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/patients/{id}/notes` | POST | Create clinical note |
| `/api/patients/{id}/notes` | GET | List patient notes |

### Sync

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sync/pull` | POST | Pull changes from server |
| `/api/sync/push` | POST | Push local changes |

---

## Environment Variables

### Frontend (.env)

```
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000
```

### Backend

```
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=doctor_log
JWT_SECRET_KEY=your-secret-key
```

---

## Project Status

See [INTEGRATION_TEST_REPORT.md](./INTEGRATION_TEST_REPORT.md) for detailed test results and current status.

**Latest Test Results (Dec 2025):**
- ✅ 100% pass rate on core functionality
- ✅ All critical endpoints operational
- ✅ Sync functionality working
- 📊 Average response time: 685ms

