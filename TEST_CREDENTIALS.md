# Test Credentials & Configuration

## Demo Accounts

The following demo accounts are available for testing:

### Dr. Sarah (Cardiology)
- **Email**: `dr.sarah@clinic.com`
- **Password**: `password123`
- **Specialty**: Cardiology

### Dr. Mike (Physiotherapy)  
- **Email**: `dr.mike@physio.com`
- **Password**: `password123`
- **Specialty**: Physiotherapy

## Backend Configuration

### Production Backend
- **URL**: `https://doctor-log-production.up.railway.app`
- **Health Check**: `https://doctor-log-production.up.railway.app/health`
- **Status**: ✅ Operational

### Environment Variables

For the Android emulator or production builds, ensure `.env` file contains:

```bash
EXPO_PUBLIC_BACKEND_URL=https://doctor-log-production.up.railway.app
EXPO_PUBLIC_APP_VERSION="1.0.0-dev"
```

For local development (if running backend locally):

```bash
EXPO_PUBLIC_BACKEND_URL=http://10.0.2.2:8000
EXPO_PUBLIC_APP_VERSION="1.0.0-dev"
```

> **Note**: `10.0.2.2` is the Android emulator's alias for the host machine's `localhost`.

## Troubleshooting Login Issues

1. **Verify Backend URL**: Check `.env` file points to correct backend
2. **Restart Metro Bundler**: After changing `.env`, restart with `npm start --reset-cache`
3. **Clear App Data**: In Android emulator, go to Settings > Apps > Doctor Log > Clear Data
4. **Check Network**: Ensure emulator has internet access for production backend

## API Endpoints

- **Login**: `POST /api/auth/login`
- **Register**: `POST /api/auth/register`
- **Get Current User**: `GET /api/auth/me`
- **Patients**: `GET /api/patients/`
- **Sync**: `POST /api/sync/pull` and `POST /api/sync/push`
