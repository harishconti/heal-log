# HealLog Architecture

## Overview

HealLog is a patient management application designed for healthcare professionals. The architecture follows a modern mobile-first approach with offline-first capabilities and cloud synchronization.

```
┌─────────────────────────────────────────────────────────────────┐
│                        HealLog System                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐ │
│  │   Mobile    │    │    Web      │    │      Backend        │ │
│  │    App      │◄──►│  Dashboard  │◄──►│       API           │ │
│  │ (React      │    │  (React +   │    │    (FastAPI +       │ │
│  │  Native)    │    │   Vite)     │    │     MongoDB)        │ │
│  └─────────────┘    └─────────────┘    └─────────────────────┘ │
│         │                                        │              │
│         ▼                                        ▼              │
│  ┌─────────────┐                        ┌─────────────────────┐ │
│  │   Local     │                        │     MongoDB         │ │
│  │  Database   │                        │      Atlas          │ │
│  │(WatermelonDB)│                        │                     │ │
│  └─────────────┘                        └─────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Mobile App)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React Native + Expo | Cross-platform mobile development |
| Navigation | Expo Router | File-based routing |
| State Management | React Context | Global state management |
| Local Database | WatermelonDB | Offline-first data storage |
| HTTP Client | Axios | API communication |
| UI Components | Custom + Expo | Native-feeling UI |
| Authentication | JWT + SecureStore | Secure token storage |

### Backend (API)
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | FastAPI | High-performance Python API |
| Database | MongoDB | Document database for flexible schemas |
| Authentication | JWT | Stateless authentication |
| Validation | Pydantic | Request/response validation |
| Email | SMTP/SendGrid | Transactional emails |
| Payments | Stripe | Subscription management |

### Web Dashboard
| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | React + Vite | Fast web development |
| Styling | Tailwind CSS | Utility-first styling |
| Charts | Recharts | Data visualization |
| State | React Query | Server state management |

---

## Directory Structure

```
heal-log/
├── frontend/                 # React Native mobile app
│   ├── app/                  # Expo Router screens
│   │   ├── (auth)/           # Authentication screens
│   │   ├── (tabs)/           # Main tab screens
│   │   └── _layout.tsx       # Root layout
│   ├── components/           # Reusable components
│   │   ├── core/             # Core UI components
│   │   ├── forms/            # Form components
│   │   └── ui/               # UI primitives
│   ├── contexts/             # React contexts
│   ├── database/             # WatermelonDB setup
│   ├── services/             # API services
│   └── constants/            # App constants
│
├── backend/                  # FastAPI backend
│   ├── app/                  # Application modules
│   │   ├── routers/          # API route handlers
│   │   ├── models/           # Pydantic models
│   │   ├── services/         # Business logic
│   │   └── database.py       # Database connection
│   ├── tests/                # Test files
│   └── main.py               # Application entry point
│
├── web-dashboard/            # React web dashboard
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   └── App.tsx           # Root component
│   └── index.html            # Entry HTML
│
├── scripts/                  # Utility scripts
├── docs/                     # Documentation
└── docker-compose.yml        # Local development setup
```

---

## Data Flow

### Authentication Flow
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────►│  Login   │────►│  Backend │────►│ MongoDB  │
│          │     │  Screen  │     │   API    │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                       │                │
                       │    JWT Token   │
                       ◄────────────────┘
                       │
                       ▼
                ┌──────────────┐
                │ SecureStore  │
                │ (Token)      │
                └──────────────┘
```

### Sync Flow (Offline-First)
```
┌─────────────────┐
│   User Action   │
│  (Create/Edit)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  WatermelonDB   │◄───►│   Sync Queue    │
│  (Local)        │     │                 │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │   When Online         │
         └───────────────────────┘
                    │
                    ▼
         ┌─────────────────┐
         │   Backend API   │
         │   /sync/push    │
         │   /sync/pull    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │    MongoDB      │
         └─────────────────┘
```

---

## Database Schema

### MongoDB Collections

#### Users
```javascript
{
  _id: ObjectId,
  id: UUID,                    // For sync compatibility
  email: String,
  name: String,
  specialization: String,
  phone: String,
  password_hash: String,
  is_verified: Boolean,
  role: "doctor" | "admin",
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Patients
```javascript
{
  _id: ObjectId,
  id: UUID,
  doctor_id: UUID,
  name: String,
  email: String,
  phone: String,
  gender: String,
  age: Number,
  address: String,
  medical_history: String,
  is_deleted: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Clinical Notes
```javascript
{
  _id: ObjectId,
  id: UUID,
  patient_id: UUID,
  doctor_id: UUID,
  title: String,
  content: String,
  diagnosis: String,
  prescription: String,
  visit_date: DateTime,
  is_deleted: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

### WatermelonDB Schema (Mobile)

The mobile app uses WatermelonDB with the same schema structure, adding:
- `sync_status`: 'synced' | 'pending' | 'error'
- Local-only fields for UI state

---

## API Design

### RESTful Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/patients` | List patients |
| POST | `/api/patients` | Create patient |
| GET | `/api/patients/{id}` | Get patient details |
| PUT | `/api/patients/{id}` | Update patient |
| DELETE | `/api/patients/{id}` | Soft delete patient |
| GET | `/api/notes` | List clinical notes |
| POST | `/api/notes` | Create note |
| POST | `/api/sync/push` | Push local changes |
| GET | `/api/sync/pull` | Pull remote changes |

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Error Format
```json
{
  "detail": "Error message",
  "code": "ERROR_CODE"
}
```

---

## Security Architecture

### Authentication
- JWT tokens with 15-minute access token expiry
- Refresh tokens for session renewal
- Passwords hashed with bcrypt
- OTP verification for new accounts

### Data Protection
- HTTPS/TLS for all API communication
- SecureStore for token storage on mobile
- MongoDB encryption at rest
- Input validation on all endpoints

### Access Control
- Role-based access (Doctor, Admin)
- Resource-level isolation (users can only access their own data)
- Rate limiting on authentication endpoints

---

## Scalability Considerations

### Current Architecture (Beta)
- Single backend instance
- MongoDB Atlas shared cluster
- Suitable for ~1,000 users

### Future Scaling
1. **Horizontal Scaling**: Multiple backend instances behind load balancer
2. **Database Sharding**: Shard by doctor_id for data locality
3. **Caching**: Redis for session and frequently accessed data
4. **CDN**: For static assets and profile images

---

## Development Workflow

### Local Development
```bash
# Start all services
docker-compose up

# Or run individually
cd backend && uvicorn main:app --reload
cd frontend && npx expo start
cd web-dashboard && npm run dev
```

### Testing
```bash
# Backend tests
cd backend && pytest

# Frontend tests (coming soon)
cd frontend && npm test
```

### Deployment
- Backend: Docker container on cloud provider
- Frontend: EAS Build for Play Store
- Web Dashboard: Static hosting (Vercel/Netlify)

---

## Monitoring & Logging

### Current Setup
- Console logging in development
- Error tracking with Sentry (production)
- API request logging

### Future Enhancements
- Structured logging with correlation IDs
- Metrics collection (Prometheus)
- Distributed tracing
- Real-time alerting

---

## Related Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Getting started
- [Database Schema](./DATABASE_SCHEMA.md) - Detailed schema docs
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues
- [API Documentation](/api/docs) - Interactive API docs
