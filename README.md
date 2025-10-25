# Clinic OS Lite

Welcome to Clinic OS Lite, a comprehensive patient management system designed for medical professionals. This application provides a secure and efficient way to manage patient information, track medical notes, and streamline communication. The system is comprised of a FastAPI backend and a cross-platform React Native application that targets **Web** and **iOS**.

## ✨ Core Features

### Subscription Tiers
The application operates on a two-tier subscription model:
- **Basic Plan:** Ideal for individual practitioners. New users are automatically enrolled in a 90-day free trial. Includes full access to the mobile and web app for complete patient management.
- **Pro Plan:** Designed for professionals who require advanced data insights and document management. Includes all Basic features, plus exclusive access to a future web dashboard and secure document storage.

### Patient Management (All Plans)
- **Full CRUD Operations:** Create, read, update, and delete patient records.
- **Detailed Patient Profiles:** Store comprehensive patient information.
- **Clinical Notes System:** Add and view time-stamped clinical notes for each patient.
- **Offline-First:** The mobile app is fully functional offline, with data synchronized automatically upon reconnection.

### Pro Features
- **Secure Document Storage:** Securely upload and manage patient-related documents from the mobile app.
- **Web Dashboard (Planned):** A future desktop-optimized interface for advanced analytics and comprehensive data management.

### Professional & UX Features
- **Secure Authentication:** Robust JWT-based authentication with secure token storage.
- **Data Isolation:** Each user can only access their own patient data.
- **Dark Mode:** Supports light, dark, and system default themes.
- **Search and Filter:** Powerful tools to find patients quickly.

## 🏗️ Technical Architecture
The application is built with a modern, modular architecture. For a detailed overview, see [`Architecture.md`](./Architecture.md). For the development roadmap, see [`ROADMAP.md`](./ROADMAP.md).
- **Backend:** A FastAPI application provides a robust, secure API.
- **Database:** MongoDB is used for data storage.
- **Frontend:** A single React Native codebase powers the mobile app (iOS) and a responsive web app.
- **Authentication:** JWTs are used for securing the API.

## 💻 Tech Stack

- **Backend:** Python, FastAPI, MongoDB (via `motor`), Pydantic
- **Authentication:** JWT, `passlib`, `python-jose`
- **Frontend:** React Native, Expo (SDK 49), Zustand, WatermelonDB, Expo Router
- **Testing:** Pytest, Pytest-AsyncIO

## 🔴 Known Issues & Limitations

**The Android build is non-functional.** All attempts to compile the native Android application have failed due to a persistent C++ compilation error. As a result, development and testing are focused exclusively on **iOS and Web** platforms. For more details, see [`testing_and_issues.md`](./testing_and_issues.md).

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- MongoDB
- `pip` for package management
- Node.js and `yarn` for the frontend

### 1. Clone the Repository
```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Backend Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your configuration.
# You can copy the example file as a starting point:
cp .env.example .env

# Your .env file must contain the following variables:
# SECRET_KEY: A long, random string used for signing JWTs.
# MONGO_URL: The connection string for your MongoDB instance.
# DB_NAME: The name of the database to use.

# Run the server from the repository root
PYTHONPATH=backend uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
yarn install

# Create a .env file (see frontend/.env.example)
cp .env.example .env

# Your .env file must contain the following variable:
# EXPO_PUBLIC_BACKEND_URL: The full URL of your running backend (e.g., http://localhost:8000)

# Run the web development server
yarn web
```

## 🧪 Testing
The backend includes a comprehensive test suite using `pytest`. To run the tests, execute the following command from the repository root:
```bash
PYTHONPATH=backend pytest backend/tests/
```

## 🧑‍⚕️ Demo Accounts

| Role                          | Email                  | Password      | Notes                               |
| ----------------------------- | ---------------------- | ------------- | ----------------------------------- |
| **Dr. Sarah Johnson (Pro)**   | `dr.sarah@clinic.com`  | `password123` | Pro Plan, 5 patients (Cardiology)   |
| **Dr. Mike Chen (Basic)**     | `dr.mike@physio.com`   | `password123` | Basic Plan, 2 patients (Physio)   |
| **New User (Trial)**          | `test.doctor@medical.com` | `TestPass123` | 90-day trial, no patients           |

## 🗺️ Project History
This project has evolved from a basic prototype into a feature-rich patient management system.
- **Robust Authentication:** Secure, cross-platform JWT authentication with fixed state hydration.
- **Offline-First Data Layer:** Implemented WatermelonDB with a complete backend synchronization API (`/api/sync/pull` and `/api/sync/push`).
- **Code Quality:** Improved state management (Zustand), form handling (`react-hook-form`), and component reusability.
- **UI/UX:** Added dark mode, skeleton loaders, and optimistic UI updates.
- **Backend Stability:** Hardened the backend with RBAC, rate limiting, and improved validation.