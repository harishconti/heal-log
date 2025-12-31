# HealLog Troubleshooting Guide

This guide covers common issues and their solutions when developing or using HealLog.

## Table of Contents

1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Database Issues](#database-issues)
4. [Sync Issues](#sync-issues)
5. [Authentication Issues](#authentication-issues)
6. [Build & Deployment Issues](#build--deployment-issues)

---

## Backend Issues

### Server Won't Start

**Error**: `ModuleNotFoundError: No module named 'xxx'`

**Solution**:
```bash
cd backend
source venv/bin/activate  # Activate virtual environment
pip install -r requirements.txt
```

---

**Error**: `Connection refused` or `MongoDB connection failed`

**Solution**:
1. Check MongoDB is running:
   ```bash
   # Docker
   docker ps | grep mongo

   # Local
   mongosh --eval "db.runCommand({ping:1})"
   ```

2. Verify connection string in `.env`:
   ```bash
   cat .env | grep MONGO_URL
   ```

3. For MongoDB Atlas, check IP whitelist

---

**Error**: `SECRET_KEY not set`

**Solution**:
```bash
# Generate a secure secret
python -c "import secrets; print(secrets.token_hex(32))"

# Add to .env file
echo "SECRET_KEY=your-generated-key" >> .env
```

---

### API Returns 500 Error

**Debugging Steps**:
1. Check backend logs for stack trace
2. Enable debug mode:
   ```bash
   export DEBUG=true
   uvicorn main:app --reload
   ```
3. Check `/api/health` endpoint
4. Verify database connectivity

---

### CORS Errors

**Error**: `Access-Control-Allow-Origin` header missing

**Solution**:
Update `ALLOWED_ORIGINS` in `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081,http://10.0.2.2:8081
```

---

### Redis Cache Errors (Resolved in v3.1.1)

**Error**: Patient create/delete returns 500 with Redis connection error

**Note**: This issue has been fixed in version 3.1.1. Cache invalidation now gracefully handles Redis connection errors without crashing the operation.

**If you're on an older version**:
1. Update to the latest version
2. Or ensure Redis is properly configured:
   ```bash
   # Check Redis connection
   redis-cli ping

   # Verify REDIS_URL in .env
   REDIS_URL=redis://localhost:6379
   ```

3. For local development without Redis, the app will log warnings but continue working

---

## Frontend Issues

### App Crashes on Startup

**Error**: `Cannot read property 'query' of null`

**Cause**: Database not initialized properly

**Solution**:
1. Clear app data:
   ```bash
   # Android
   adb shell pm clear com.heallog.app
   ```

2. Reinstall the app:
   ```bash
   npx expo run:android
   ```

---

**Error**: `Network request failed`

**Cause**: Backend URL misconfigured or backend not running

**Solution**:
1. Check backend is running: `curl http://localhost:8000/health`
2. For Android emulator, use `10.0.2.2` instead of `localhost`
3. For physical device, use your computer's local IP
4. Update `EXPO_PUBLIC_BACKEND_URL` in `.env.development`

---

### Metro Bundler Issues

**Error**: `Unable to resolve module`

**Solution**:
```bash
cd frontend

# Clear Metro cache
npx expo start --clear

# Or manually clear
rm -rf node_modules/.cache
rm -rf .expo
npm install
```

---

### Expo Build Fails

**Error**: `eas build` fails with cryptic error

**Solution**:
1. Check EAS credentials:
   ```bash
   eas credentials
   ```

2. Verify `app.json` is valid:
   ```bash
   npx expo doctor
   ```

3. Check build logs on Expo dashboard

---

## Database Issues

### WatermelonDB Migration Errors

**Error**: `Migration failed` or `Schema version mismatch`

**Solution**:
1. Check schema version matches migration version
2. For development, clear app data:
   ```bash
   # Clear app storage (Android)
   adb shell pm clear com.heallog.app
   ```

3. Verify migration code in `frontend/database/migrations.ts`

---

### MongoDB Connection Drops

**Symptoms**: Intermittent connection errors, timeouts

**Solution**:
1. Add connection pooling options:
   ```python
   # In session.py
   client = AsyncIOMotorClient(
       settings.MONGO_URL,
       maxPoolSize=50,
       minPoolSize=10,
       serverSelectionTimeoutMS=5000
   )
   ```

2. Handle reconnection in code

---

### Data Not Appearing

**Checklist**:
1. Check user is authenticated
2. Verify `user_id` matches in queries (data is scoped to the authenticated user)
3. Verify sync status

---

## Sync Issues

### Sync Push Fails

**Error**: 409 Conflict

**Cause**: Data conflict between local and server

**Solution**:
1. Check for empty/null fields being sent
2. Verify UUID format
3. Check `updated_at` timestamps

---

**Error**: 401 Unauthorized

**Solution**:
1. Check token expiration
2. Refresh token:
   ```typescript
   await authService.refreshToken();
   ```

3. Re-login if refresh fails

---

### Data Not Syncing

**Debugging Steps**:
1. Check network connectivity
2. Verify sync queue isn't stuck:
   ```typescript
   const queue = await database.get('sync_queue').query().fetch();
   console.log('Pending syncs:', queue.length);
   ```

3. Check for sync errors in logs
4. Force sync:
   ```typescript
   await syncService.forcePullSync();
   ```

---

### Duplicate Records After Sync

**Cause**: UUID collision or sync logic error

**Solution**:
1. Ensure UUIDs are generated correctly
2. Check upsert logic on backend
3. Verify `id` field uniqueness

---

## Authentication Issues

### Login Always Fails

**Debugging**:
1. Test API directly:
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password"}'
   ```

2. Check password hashing matches
3. Verify user exists and is verified

---

### OTP Not Received

**Checklist**:
1. Check email configuration in `.env`
2. Verify SMTP credentials
3. Check spam folder
4. For development, use MailHog:
   ```bash
   docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
   # View emails at http://localhost:8025
   ```

---

### Token Expired Errors

**Solution**:
1. Implement token refresh in API interceptor
2. Check refresh token isn't expired
3. Increase token expiry for development:
   ```python
   ACCESS_TOKEN_EXPIRE_MINUTES = 60  # Development only
   ```

---

## Build & Deployment Issues

### Android Build Fails

**Error**: `Keystore file not found`

**Solution**:
```bash
# Generate keystore
keytool -genkeypair -v -keystore heallog.keystore \
  -alias heallog -keyalg RSA -keysize 2048 -validity 10000

# Configure in eas.json
```

---

**Error**: `Version code already used`

**Solution**:
```bash
# Bump version
node scripts/bump-version.js patch
```

---

### Docker Build Fails

**Error**: `pip install` fails in Docker

**Solution**:
1. Check `requirements.txt` syntax
2. Use specific versions
3. Add build dependencies:
   ```dockerfile
   RUN apt-get update && apt-get install -y gcc
   ```

---

### Production Deployment Issues

**Checklist**:
1. Environment variables are set
2. MongoDB Atlas IP whitelist includes server
3. HTTPS is configured
4. CORS origins are correct
5. Debug mode is OFF

---

## Quick Diagnostic Commands

### Backend Health Check
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/version
```

### Database Check
```bash
mongosh heallog_dev --eval "db.stats()"
```

### Network Check (Android)
```bash
adb shell ping -c 3 10.0.2.2
```

### Clear All Caches
```bash
# Frontend
cd frontend
rm -rf node_modules/.cache .expo
npm install

# Backend
cd backend
rm -rf __pycache__ .pytest_cache
pip install -r requirements.txt
```

---

## Getting More Help

1. **Check logs**: Backend and mobile app logs often contain the answer
2. **Search issues**: Check GitHub issues for similar problems
3. **Ask for help**: Open a new issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs and screenshots
   - Environment details

**Contact**: support@heallog.com
