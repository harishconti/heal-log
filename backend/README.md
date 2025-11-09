# Clinic OS Lite - Backend

This directory contains the FastAPI backend for the Clinic OS Lite application.

## Getting Started

### Prerequisites

*   Python 3.10+
*   MongoDB
*   Redis

### Installation

1.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
2.  Create a `.env` file in the root of the project and populate it with the required environment variables. You can use `backend/.env.production.example` as a template.

### Running the Application

```bash
uvicorn main:app --reload
```

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
