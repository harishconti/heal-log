# HealLog Setup Guide

This guide will help you set up the HealLog development environment on your local machine.

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **MongoDB** 6+ (or MongoDB Atlas account)
- **Git** ([Download](https://git-scm.com/))
- **Docker** (optional, for containerized setup)

### Mobile Development
- **Android Studio** (for Android development)
- **Expo CLI**: `npm install -g expo-cli`
- **EAS CLI**: `npm install -g eas-cli`

---

## Quick Start (Docker)

The fastest way to get started is using Docker:

```bash
# Clone the repository
git clone https://github.com/harishconti/heal-log.git
cd heal-log

# Start all services
docker-compose up

# Services will be available at:
# - Backend API: http://localhost:8000
# - Web Dashboard: http://localhost:3000
# - MongoDB: localhost:27017
# - MailHog (email testing): http://localhost:8025
```

---

## Manual Setup

### 1. Clone Repository

```bash
git clone https://github.com/harishconti/heal-log.git
cd heal-log
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env with your settings
# Required variables:
# - MONGODB_URL=mongodb://localhost:27017
# - DATABASE_NAME=heallog_dev
# - JWT_SECRET_KEY=your-secret-key
# - ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 3. Frontend (Mobile App) Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000" > .env.development

# Start Expo development server
npx expo start
```

#### Running on Android Emulator
1. Open Android Studio
2. Start an Android Virtual Device (AVD)
3. In the Expo terminal, press `a` to open on Android

#### Running on Physical Device
1. Install Expo Go from Play Store
2. Scan the QR code from the Expo terminal
3. Make sure your phone and computer are on the same network

**Note**: For physical devices, update `EXPO_PUBLIC_BACKEND_URL` to your computer's local IP address (e.g., `http://192.168.1.100:8000`)

### 4. Web Dashboard Setup

```bash
cd web-dashboard

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

The dashboard will be available at `http://localhost:5173`

---

## Environment Configuration

### Generate Environment Files

Use the included script to generate environment files:

```bash
# Generate development environment
node scripts/generate-env.js development

# Generate staging environment
node scripts/generate-env.js staging

# Generate production environment
node scripts/generate-env.js production
```

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URL` | MongoDB connection string | `mongodb://localhost:27017` |
| `DATABASE_NAME` | Database name | `heallog_dev` |
| `JWT_SECRET_KEY` | Secret for JWT tokens | `your-random-secret` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `EMAIL_HOST` | SMTP server host | `smtp.sendgrid.net` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_test_...` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_BACKEND_URL` | Backend API URL | `http://10.0.2.2:8000` |
| `EXPO_PUBLIC_LOG_LEVEL` | Logging level | `debug` |

---

## Database Setup

### Local MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install locally from https://www.mongodb.com/try/download/community
```

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add your IP to the whitelist
4. Create a database user
5. Get connection string and update `.env`

---

## Running Tests

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run with watch mode
npm test -- --watch
```

---

## Common Development Tasks

### Version Bumping

```bash
# Bump patch version (1.0.0 -> 1.0.1)
node scripts/bump-version.js patch

# Bump minor version (1.0.0 -> 1.1.0)
node scripts/bump-version.js minor

# Bump major version (1.0.0 -> 2.0.0)
node scripts/bump-version.js major
```

### Building APK

```bash
cd frontend

# Development build
eas build --platform android --profile development

# Preview build
eas build --platform android --profile preview

# Production build
eas build --platform android --profile production
```

### Database Migrations

WatermelonDB handles schema migrations automatically. When you update the schema:

1. Increment schema version in `frontend/database/schema.ts`
2. Add migration in `frontend/database/migrations.ts`
3. Test migration on existing data

---

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

### Quick Fixes

**Backend won't start?**
```bash
# Check MongoDB is running
mongosh --eval "db.runCommand({ping:1})"

# Check environment variables
cat .env
```

**Frontend won't connect to backend?**
```bash
# Check backend URL in environment
echo $EXPO_PUBLIC_BACKEND_URL

# For Android emulator, use 10.0.2.2
# For physical device, use your computer's IP
```

**Database connection issues?**
```bash
# Test MongoDB connection
mongosh "your-connection-string"
```

---

## IDE Setup

### VS Code Extensions

Recommended extensions:
- Python (Microsoft)
- Pylance
- ES7+ React/Redux/React-Native
- Tailwind CSS IntelliSense
- MongoDB for VS Code
- Docker

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

---

## Next Steps

1. Read the [Architecture Overview](./ARCHITECTURE.md)
2. Check the [API Documentation](http://localhost:8000/docs)
3. Review the [Database Schema](./DATABASE_SCHEMA.md)
4. Start building features!

---

## Getting Help

- **Documentation**: Check the `/docs` folder
- **Issues**: Open an issue on GitHub
- **Email**: support@heallog.com
