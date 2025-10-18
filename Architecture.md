# Technical Architecture: Clinic OS Lite
**Version:** 2.1
**Date:** 2025-10-18

## 1. Overview
This document outlines the technical architecture, data models, and core workflows for the **Clinic OS Lite** application. It serves as a guide for understanding the system's design and components. For the development roadmap, see [`ROADMAP.md`](./ROADMAP.md).

---

## 2. High-Level System Architecture

### 2.1. Architectural Overview
The application uses a decoupled, three-tier architecture. The core is a **FastAPI backend** that serves as the single source of truth and handles all business logic. It communicates with a **cross-platform React Native client** that targets iOS and Web, providing a consistent user experience across devices. A separate, pro-only web dashboard is planned for future development.

### 2.2. Architectural Diagram
```mermaid
graph TD
    subgraph "Clients (User-Facing Layer)"
        A[<b>Cross-Platform App (React Native)</b><br><i>Targets: iOS & Web</i><br>Handles core patient management for all users.]
        B[<b>Pro Web Dashboard (React.js)</b><br><i>Status: Planned</i><br>Provides advanced analytics and data management for Pro users.]
    end

    subgraph "Backend Service (Application Layer)"
        C{<b>FastAPI Backend API</b><br><i>Central Business Logic</i><br>Stateless REST API handling authentication, data processing, and external service integration.}
    end

    subgraph "Managed Services (Data & Infrastructure Layer)"
        D[<b>MongoDB Atlas</b><br><i>Primary Datastore</i><br>NoSQL database for user and patient data.]
        E[<b>Payment Gateway (e.g., Stripe)</b><br><i>Subscription Management</i><br>Handles secure payment processing and subscription events via webhooks.]
        F[<b>Cloud Storage (e.g., AWS S3)</b><br><i>File Storage (Pro Feature)</i><br>Stores user-uploaded documents like lab reports.]
    end

    A -- "REST API Calls (HTTPS, JWT)" --> C
    B -- "REST API Calls (HTTPS, JWT)" --> C
    C -- "Database Operations (Motor)" --> D
    C -- "Webhooks & API Calls" --> E
    C -- "Secure File Operations (SDK)" --> F
```

### 2.3. Architectural Principles
- **Stateless Backend:** The FastAPI application is stateless, enabling seamless horizontal scaling. State is managed via JWTs or retrieved from the database on demand.
- **Secure by Design:** Communication is enforced over HTTPS. Authentication relies on JWTs. Authorization is handled at the API level using a **Role-Based Access Control (RBAC)** system and pro-tier feature flags. The API is also protected from abuse via **rate limiting**.
- **Offline-First:** The React Native client uses WatermelonDB to provide a robust offline experience, synchronizing data with the backend via a dedicated sync API.

---

## 3. Component Breakdown

### 3.1. Backend Service (FastAPI)
- **Role:** The central brain of the application. It is responsible for all business logic, data persistence, user authentication, and secure communication with third-party services.
- **Core Technologies:** Python 3.9+, FastAPI, Pydantic, Motor, `python-jose` and `passlib` for JWT authentication, and `slowapi` for rate limiting.
- **Status:** Largely complete. Provides APIs for authentication, patient management, clinical notes, data synchronization, and payments. Includes a robust RBAC system and protected endpoints for pro-tier features.

### 3.2. Cross-Platform Client (React Native)
- **Role:** The primary interface for all users on iOS and Web. It is optimized for both mobile and desktop use, focusing on daily tasks like patient management and note-taking.
- **Core Technologies:** React Native, Expo, Zustand, WatermelonDB, Expo Router.
- **Status:** In development. Core features like authentication, offline-first data sync, patient management, and the upgrade-to-pro flow are implemented. Document management UI is pending.
- **Limitation:** The **Android build is non-functional** due to a persistent native compilation error.

### 3.3. Pro Web Dashboard (React.js)
- **Role:** A premium, Pro-exclusive interface designed for desktop use. It will provide a broader, more analytical view of the practice.
- **Core Technologies:** React.js (or a framework like Next.js), a component library (e.g., MUI), and a charting library (e.g., Recharts).
- **Status:** Planned. This application has not been built yet.

---

## 4. Data Models (MongoDB Schema)
The application enforces a consistent data structure using Pydantic models.

### 4.1. `users` Collection
Stores information about the medical professionals using the service.
```json
{
  "_id": "String (UUID)",
  "email": "String (Unique, Indexed)",
  "password_hash": "String",
  "full_name": "String",
  "phone": "String",
  "medical_specialty": "String",
  "plan": "String (Enum: 'basic', 'pro', Default: 'basic')",
  "role": "String (Enum: 'admin', 'doctor', 'patient', Default: 'doctor')",
  "subscription_status": "String (Enum: 'trialing', 'active', 'canceled', 'past_due', Default: 'trialing')",
  "subscription_end_date": "ISODate",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### 4.2. `patients` Collection
Stores demographic and contact information for each patient.
```json
{
  "_id": "String (UUID)",
  "patient_id": "String (Auto-Incrementing, e.g., PAT001)",
  "user_id": "String (Indexed, Foreign key to `users`)",
  "name": "String",
  "phone": "String",
  "email": "String",
  "address": "String",
  "location": "String",
  "initial_complaint": "String",
  "initial_diagnosis": "String",
  "group": "String",
  "is_favorite": "Boolean",
  "created_at": "ISODate",
  "updated_at": "ISODate"
}
```

### 4.3. `clinical_notes` Collection
Stores timestamped clinical entries for each patient.
```json
{
  "_id": "String (UUID)",
  "patient_id": "String (Indexed, Foreign key to `patients`)",
  "user_id": "String (Indexed, Foreign key to `users`)",
  "content": "String",
  "visit_type": "String (Enum: 'regular', 'follow-up', 'emergency')",
  "created_at": "ISODate"
}
```

### 4.4. `documents` Collection (Pro Feature)
Stores metadata about files uploaded by Pro users. The files themselves are stored in a separate cloud storage service.
```json
{
  "_id": "ObjectId",
  "patient_id": "ObjectId (Indexed)", // Foreign key to `patients`
  "user_id": "ObjectId (Indexed)", // Foreign key to `users`
  "file_name": "String",
  "storage_key": "String", // Unique key/path in cloud storage
  "content_type": "String",
  "size_bytes": "Number",
  "uploaded_at": "ISODate"
}
```

---

## 5. Core Workflows
This section outlines key user journeys.

### 5.1. User Registration & Trial Activation
A new user is registered and automatically placed on a 90-day trial with a default role of `DOCTOR`.
```mermaid
sequenceDiagram
    participant Client as Mobile App
    participant Server as FastAPI Backend
    participant DB as MongoDB
    Client->>Server: 1. POST /api/auth/register (full_name, email, password)
    Server->>Server: 2. Validate input & hash password
    Server->>DB: 3. INSERT INTO users (plan: 'basic', role: 'doctor', status: 'trialing', trial_ends_at: NOW() + 90 days)
    DB-->>Server: 4. Return created user document
    Server->>Server: 5. Generate JWT (containing user_id, plan, role)
    Server-->>Client: 6. 201 Created (user data + JWT)
```

### 5.2. Subscription Upgrade Flow
A user on a Basic/Trial plan upgrades to a paid Pro plan.
```mermaid
sequenceDiagram
    participant Client as Mobile App
    participant Server as FastAPI Backend
    participant PaymentGW as Payment Gateway
    participant DB as MongoDB
    Client->>Server: 1. POST /api/payments/create-session
    Server->>PaymentGW: 2. Create payment session (with user_id in metadata)
    PaymentGW-->>Server: 3. Return checkout_url
    Server-->>Client: 4. Respond with checkout_url
    Client->>PaymentGW: 5. User completes payment on secure page
    %% Asynchronous Webhook Notification %%
    PaymentGW->>Server: 6. POST /api/webhooks/payment-status
    Server->>Server: 7. Verify webhook signature
    Server->>DB: 8. UPDATE users SET plan='pro', status='active'
    Server-->>PaymentGW: 9. 200 OK
```

---

## 6. Deployment & Environment

### 6.1. Backend Directory Structure
The backend code is organized into a clean, service-oriented structure within `backend/app/`.
- **`api/`**: API endpoint definitions (routers), decorated with rate limits.
- **`core/`**: Core application logic, configuration, and security (`security.py` for RBAC, `limiter.py` for rate limiting).
- **`db/`**: Database session management and initialization.
- **`models/`**: Pydantic models for database collections.
- **`schemas/`**: Pydantic schemas for API request/response validation.
- **`services/`**: Business logic, separated from the API layer.

### 6.2. Production Recommendations
- **Web Server:** A production-grade ASGI server like Gunicorn with Uvicorn workers, running in a container.
- **Database:** A managed MongoDB cluster (e.g., MongoDB Atlas) is strongly recommended for automated backups, scaling, and monitoring.
- **Caching:** The application uses an in-memory, least-recently-used (LRU) cache via the `@alru_cache` decorator on service-layer functions. This is suitable for single-instance deployments. For multi-instance or serverless deployments, an external caching layer like Redis would be required. A debug endpoint (`/api/debug/clear-all-caches`) is available for clearing all caches during testing.
- **Monitoring:** A solution like Prometheus/Grafana or a commercial APM (e.g., Datadog) to track performance.
- **Logging:** Centralized logging (e.g., ELK stack, Google Cloud Logging).
- **CI/CD:** An automated pipeline (e.g., GitHub Actions) for testing and deployment.