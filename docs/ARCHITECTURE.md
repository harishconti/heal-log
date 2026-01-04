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
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React Native + Expo | 0.81.5 / 54.0.29 | Cross-platform mobile development |
| Navigation | Expo Router | 6.0.19 | File-based routing |
| State Management | Zustand | 4.5.2 | Global state management |
| Local Database | WatermelonDB | 0.28.0 | Offline-first data storage |
| HTTP Client | Axios | 1.12.2 | API communication |
| Form Handling | React Hook Form + Zod | 7.51.3 / 3.23.8 | Form validation |
| Authentication | JWT + SecureStore | - | Secure token storage |
| React | React | 19.1.0 | UI library |

### Backend (API)
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | FastAPI | 0.116.1 | High-performance Python API |
| Server | Uvicorn | 0.32.1 | ASGI server |
| Database | MongoDB | Atlas | Document database |
| ODM | Beanie | 1.26.0 | Async MongoDB ODM |
| Authentication | JWT (python-jose) | 3.4.0 | Stateless authentication |
| Validation | Pydantic | 2.10.4 | Request/response validation |
| Email | aiosmtplib | 3.0.1 | Async transactional emails |
| Rate Limiting | SlowAPI | 0.1.9 | Request rate limiting |
| Error Tracking | Sentry | 2.18.0 | Error monitoring |
| Payments | Stripe | - | Subscription management |

### Web Dashboard
| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Framework | React + Vite | 19.2.0 / 7.2.4 | Fast web development |
| Styling | Tailwind CSS | 4.1.18 | Utility-first styling |
| Charts | Recharts | 3.6.0 | Data visualization |
| State | Zustand | 5.0.9 | Global state management |
| Routing | React Router DOM | 7.11.0 | Client-side routing |
| Form Handling | React Hook Form + Zod | 7.69.0 / 4.2.1 | Form validation |
| HTTP Client | Axios | 1.13.2 | API communication |
| Icons | Lucide React | 0.562.0 | Icon library |
| Date Utilities | date-fns | 4.1.0 | Date formatting |

---

## Directory Structure

```
heal-log/
├── frontend/                 # React Native mobile app
│   ├── app/                  # Expo Router screens (25+ screens)
│   │   ├── (auth)/           # Authentication screens
│   │   ├── (tabs)/           # Main tab screens
│   │   └── _layout.tsx       # Root layout
│   ├── components/           # Reusable components
│   │   ├── core/             # Core UI components
│   │   ├── forms/            # Form components
│   │   └── ui/               # UI primitives
│   ├── contexts/             # React contexts
│   ├── models/               # WatermelonDB models
│   ├── services/             # API services (11 services)
│   ├── store/                # Zustand global store
│   ├── constants/            # App constants
│   └── web-dashboard/        # React web dashboard
│       ├── src/
│       │   ├── components/   # React components
│       │   │   ├── ui/       # UI primitives
│       │   │   └── charts/   # Chart components
│       │   ├── pages/        # Page components (6 page modules)
│       │   ├── api/          # API clients
│       │   ├── store/        # Zustand stores
│       │   └── types/        # TypeScript types
│       └── index.html        # Entry HTML
│
├── backend/                  # FastAPI backend
│   ├── app/                  # Application modules
│   │   ├── api/              # API route handlers (16 routers)
│   │   ├── core/             # Config, security, exceptions
│   │   ├── db/               # Database connection
│   │   ├── models/           # Beanie ODM models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic (13 services)
│   │   └── middleware/       # Request logging
│   ├── tests/                # Test files (48 tests)
│   ├── scripts/              # Database scripts
│   └── main.py               # Application entry point
│
├── scripts/                  # Utility scripts
│   ├── bump-version.js       # Version management
│   ├── clean_mongo.js        # Database cleanup
│   └── generate-env.js       # Environment generation
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
  _id: UUID,
  email: String (unique, indexed),
  phone: String,
  full_name: String,
  medical_specialty: String,
  password_hash: String,
  plan: "basic" | "pro",
  role: "admin" | "doctor" | "patient",
  subscription_status: "trialing" | "active" | "canceled" | "past_due",
  subscription_end_date: DateTime,
  is_beta_tester: Boolean,
  is_verified: Boolean,
  otp_code: String,
  otp_expires_at: DateTime,
  otp_attempts: Number,
  password_reset_token: String,
  password_reset_expires_at: DateTime,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Patients
```javascript
{
  _id: UUID,
  patient_id: String,            // Format: PTYYYYMM001
  user_id: UUID (indexed),
  name: String,
  phone: String,
  email: String,
  address: String,
  location: String,
  initial_complaint: String,
  initial_diagnosis: String,
  photo: String,                 // Base64 encoded
  group: String,
  is_favorite: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Clinical Notes
```javascript
{
  _id: UUID,
  patient_id: UUID (indexed),
  user_id: UUID (indexed),
  content: String,
  visit_type: "initial" | "regular" | "follow-up" | "emergency",
  created_at: DateTime,
  updated_at: DateTime
}
```

### Additional Collections
- `documents` - Patient document uploads
- `feedback` - User feedback submissions
- `beta_feedback` - Beta testing feedback
- `telemetry` - Analytics events
- `error_events` - Error logs
- `query_performance_events` - Performance metrics
- `sync_events` - Sync tracking

### WatermelonDB Schema (Mobile)

The mobile app uses WatermelonDB with matching schema for offline support.
See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete details.

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
| DELETE | `/api/patients/{id}` | Delete patient |
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
- JWT tokens with 30-minute access token expiry
- 7-day refresh tokens for session renewal
- Passwords hashed with bcrypt (12+ chars required)
- 8-digit OTP verification for new accounts
- Rate limiting on auth endpoints (5/minute)

### Data Protection
- HTTPS/TLS for all API communication
- SecureStore for token storage on mobile
- sessionStorage for web (not localStorage)
- MongoDB encryption at rest
- Input validation and sanitization on all endpoints
- NoSQL injection prevention

### Access Control
- Role-based access (Admin, Doctor, Patient)
- Resource-level isolation (users only access their own data)
- Rate limiting on all API endpoints
- Security headers (CSP, HSTS, X-Frame-Options)
- Stripe webhook signature verification

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
cd frontend/web-dashboard && npm run dev
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
