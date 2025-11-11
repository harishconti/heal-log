# Clinic OS Lite

Clinic OS Lite is a modern, offline-first patient management system designed for doctors and small clinics. It features a robust FastAPI backend and a cross-platform React Native frontend for Web, iOS, and Android.

## Features

*   **Offline-First:** Continue working without an internet connection. Data syncs automatically when you're back online.
*   **Patient Management:** Create, edit, and manage patient records with ease.
*   **Clinical Notes:** Keep detailed clinical notes for each patient.
*   **Cross-Platform:** Use the app on your phone, tablet, or web browser.
*   **Secure:** Your data is protected with JWT-based authentication and role-based access control.

## Architecture Overview

### Frontend

The frontend is a React Native application built with Expo. It uses:

*   **Expo Router** for file-based routing.
*   **WatermelonDB** for offline data storage.
*   **Zustand** for global state management.
*   **React Hook Form** and **Zod** for form handling and validation.
*   **Axios** for making API requests.
*   **Sentry** for error monitoring.

### Backend

The backend is a Python-based FastAPI application. It uses:

*   **MongoDB** as the primary database.
*   **Beanie** as the ODM for MongoDB.
*   **JWT** for authentication.
*   **Pydantic** for data validation.
*   **Sentry** for error monitoring.
*   **FastAPI Cache** with a Redis backend for caching.
*   **SlowAPI** for rate limiting.

## Setup and Installation

### Prerequisites

*   Node.js (v18 or higher)
*   Yarn
*   Python (v3.10 or higher)
*   Pip
*   MongoDB
*   Redis

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/doctor-log.git
    cd doctor-log
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r backend/requirements.txt
    ```

3.  **Create a `.env` file** in the root directory and add the following environment variables:
    ```
    SECRET_KEY=your_secret_key
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
    REFRESH_TOKEN_EXPIRE_DAYS=7
    MONGO_URL=mongodb://localhost:27017
    DB_NAME=clinic_os_lite
    REDIS_URL=redis://localhost:6379
    ```

4.  **Run the backend server:**
    ```bash
    PYTHONPATH=backend uvicorn main:app --host 0.0.0.0 --port 8000 --reload
    ```

### Frontend Setup

1.  **Navigate to the `frontend` directory:**
    ```bash
    cd frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    yarn install
    ```

3.  **Create a `.env` file** in the `frontend` directory and add the following environment variable:
    ```
    EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
    ```

4.  **Start the frontend development server:**
    ```bash
    yarn start
    ```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## Deployment Automation Scripts

This project includes several scripts to help automate the deployment process.

### `deploy_check.py`

This script verifies that your environment is correctly configured for deployment. It checks for:

*   Required environment variables
*   Connection to MongoDB
*   Connection to Redis
*   Validity of the Sentry DSN
*   Basic accessibility of the authentication endpoints

**Usage:**

```bash
python3 backend/scripts/deploy_check.py
```

### `production_setup.sh`

This script automates the initial setup of a production environment. It performs the following actions:

*   Installs production dependencies from `requirements.txt`.
*   Includes placeholders for running database migrations and creating an initial admin user.
*   Creates logging directories.

**Usage:**

```bash
bash backend/scripts/production_setup.sh
```

### `.env.production.example`

This file serves as a template for the environment variables required for a production deployment. Copy this file to `.env.production` and fill in the values for your environment.
