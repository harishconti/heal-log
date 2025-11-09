# Deployment Guide

This document provides a template for deploying the Clinic OS Lite application to a production environment.

## Backend Deployment

### 1. Build the Docker Image

The backend includes a `Dockerfile` that can be used to build a production-ready Docker image.

```bash
docker build -t clinic-os-lite-backend:latest backend
```

### 2. Configure Environment Variables

Create a `.env.production` file with the following environment variables:

```
ENV=production
SECRET_KEY=your_production_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
MONGO_URL=your_production_mongo_url
DB_NAME=your_production_db_name
REDIS_URL=your_production_redis_url
ALLOWED_ORIGINS=https://your-frontend-domain.com
SENTRY_DSN=your_sentry_dsn
```

### 3. Run the Docker Container

Run the Docker container, passing in the production environment variables.

```bash
docker run -d -p 8000:8000 --env-file .env.production --name clinic-os-lite-backend clinic-os-lite-backend:latest
```

## Frontend Deployment

### 1. Configure Environment Variables

Create a `.env.production` file in the `frontend` directory with the following environment variables:

```
EXPO_PUBLIC_BACKEND_URL=https://your-backend-api-domain.com
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 2. Build for Web

To build the web application, run the following command from the `frontend` directory:

```bash
npx expo export:web
```

The output will be in the `frontend/dist` directory. You can then deploy this directory to any static hosting service (e.g., Netlify, Vercel, AWS S3).

### 3. Build for Android

To build a standalone Android app, run the following command from the `frontend` directory:

```bash
eas build -p android --profile production
```

This will create a production build of the Android app, which you can then submit to the Google Play Store.

### 4. Build for iOS

To build a standalone iOS app, run the following command from the `frontend` directory:

```bash
eas build -p ios --profile production
```

This will create a production build of the iOS app, which you can then submit to the Apple App Store.

## DNS and SSL

*   **DNS:** Point your domain names to the IP addresses of your backend and frontend servers.
*   **SSL:** Use a service like Let's Encrypt to obtain and install SSL certificates for your domains to enable HTTPS.
