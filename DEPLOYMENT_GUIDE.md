# Backend Deployment Guide - Quick Start

## 🎯 Goal: Get Your Backend Online in Under 30 Minutes

Your backend is **production-ready**. Let's deploy it so your beta app can connect!

---

## Option 1: Railway.app (RECOMMENDED - Easiest)

**Why Railway:**
- ✅ Free tier available ($5/month credit)
- ✅ Automatic HTTPS
- ✅ Built-in PostgreSQL/MongoDB
- ✅ Git-based deployment
- ✅ Environment variables UI
- ✅ Logs and monitoring

### Step-by-Step Deployment (10 minutes):

#### 1. Sign up for Railway
```
https://railway.app
→ Sign in with GitHub
→ Authorize Railway
```

#### 2. Create New Project
```
Dashboard → New Project → Deploy from GitHub repo
→ Select: heal-log repository
→ Select: backend folder
```

#### 3. Add MongoDB Database
```
Your Project → New → Database → Add MongoDB
→ Railway creates database automatically
→ Copy connection string
```

#### 4. Set Environment Variables
```
Your Project → Backend Service → Variables
Add these:
```

| Variable | Value | Where to Get |
|----------|-------|--------------|
| `MONGO_URL` | `mongodb://...` | Copy from Railway MongoDB service |
| `DB_NAME` | `heallog` | Your database name |
| `SECRET_KEY` | Generate random string | Use: `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | `*` | Allow all origins for now |

**Generate SECRET_KEY:**
```bash
# Run this in PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### 5. Deploy!
```
→ Railway auto-deploys on git push
→ Wait 2-3 minutes for build
→ Your API URL appears: https://your-app.up.railway.app
```

#### 6. Test Deployment
```bash
# Visit in browser:
https://your-app.up.railway.app/docs

# Should see FastAPI Swagger UI
# Test the /health endpoint
```

#### 7. Update Frontend
```json
// frontend/.env.beta
EXPO_PUBLIC_BACKEND_URL=https://your-app.up.railway.app
```

---

## Option 2: Render.com (Also Easy & Free)

**Why Render:**
- ✅ Free tier forever (with limitations)
- ✅ Automatic deploys from GitHub
- ✅ Free PostgreSQL database
- ✅ Custom domains

### Steps:

1. **Sign up:** https://render.com
2. **New Web Service** → Connect GitHub → Select backend folder
3. **Settings:**
   - Name: `heallog-api`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Add MongoDB:**
   - Use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas
   - Or add as environment variable

5. **Environment Variables** (same as Railway table above)

6. **Deploy** → Wait 5 minutes → Get your URL

---

## Option 3: Fly.io (Developer-Friendly)

**Why Fly.io:**
- ✅ Free tier (2 VMs)
- ✅ Global deployment
- ✅ Docker-based (flexible)

### Steps:

1. Install Fly CLI:
```bash
# Windows (PowerShell):
iwr https://fly.io/install.ps1 -useb | iex
```

2. Login and Launch:
```bash
cd backend
fly auth login
fly launch
# Answer prompts:
# - App name: heallog-api
# - Region: Choose closest to you
# - Add PostgreSQL? No (we'll use MongoDB Atlas)
```

3. Set environment variables:
```bash
fly secrets set MONGO_URL="mongodb+srv://..."
fly secrets set DB_NAME="heallog"
fly secrets set SECRET_KEY="your-secret-key"
```

4. Deploy:
```bash
fly deploy
```

---

## Option 4: Heroku (Classic, But Paid)

**Note:** Heroku no longer has free tier ($7/month minimum)

### Steps:

1. Install Heroku CLI:
```bash
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

2. Create and deploy:
```bash
cd backend
heroku login
heroku create heallog-api
git push heroku main
```

3. Add MongoDB:
```bash
# Use MongoDB Atlas (free)
# Or: heroku addons:create mongolab
```

4. Set environment variables:
```bash
heroku config:set MONGO_URL="mongodb+srv://..."
heroku config:set DB_NAME="heallog"
heroku config:set SECRET_KEY="your-secret-key"
```

---

## MongoDB Database Options

Your backend needs MongoDB. Here are your options:

### Option 1: MongoDB Atlas (RECOMMENDED)

**Free Tier:** 512 MB storage, perfect for beta

#### Setup (5 minutes):

1. **Sign up:** https://www.mongodb.com/cloud/atlas
2. **Create Free Cluster:**
   - Shared (M0) tier → FREE
   - Choose region (closest to you)
   - Cluster name: `heallog`

3. **Create Database User:**
   - Security → Database Access → Add New User
   - Username: `heallog`
   - Password: Generate strong password
   - Role: `Read and write to any database`

4. **Whitelist IP:**
   - Security → Network Access → Add IP
   - Allow from anywhere: `0.0.0.0/0` (for deployment servers)
   - ⚠️ Not secure for production, but OK for beta

5. **Get Connection String:**
   ```
   Clusters → Connect → Connect your application
   → Copy connection string:
   mongodb+srv://heallog:<password>@cluster.xxxxx.mongodb.net/
   ```

6. **Replace `<password>` with your database user password**

### Option 2: Railway MongoDB

If you chose Railway, MongoDB is built-in:
```
Project → New → Database → Add MongoDB
→ Connection string appears automatically
```

---

## Email Configuration (Required for OTP)

Email is **required** in production for user registration (OTP verification) and password reset.

### Gmail Setup (Recommended)

**Important**: Gmail requires an **App Password** when using SMTP. Regular passwords won't work.

#### Step 1: Enable 2-Step Verification
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for App Passwords)

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other** and enter "HealLog Backend"
4. Click **Generate**
5. Copy the 16-character password (spaces don't matter)

#### Step 3: Set Environment Variables

| Variable | Value |
|----------|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` (App Password) |
| `EMAIL_FROM` | `HealLog <your-email@gmail.com>` |

### Other Email Providers

| Provider | HOST | PORT |
|----------|------|------|
| Gmail | `smtp.gmail.com` | `587` |
| Outlook | `smtp.office365.com` | `587` |
| SendGrid | `smtp.sendgrid.net` | `587` |
| Mailgun | `smtp.mailgun.org` | `587` |

### Production vs Development Behavior

- **Development** (`ENV=development`): If SMTP fails, emails are logged to console (doesn't block registration)
- **Production** (`ENV=production`): If SMTP fails, registration/password reset will fail with an error

Check Railway logs for email errors:
- `SMTP authentication failed` - Wrong password or need App Password
- `SMTP connection failed` - Wrong host/port
- `PRODUCTION ERROR: Failed to send email` - Email config not loaded

---

## Environment Variables Summary

Create a file `backend/.env.production` with:

```bash
# Database
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/heallog?retryWrites=true&w=majority
DB_NAME=heallog

# Security
SECRET_KEY=your-super-secret-key-generated-randomly-32-chars-minimum

# CORS (Allow your frontend)
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Email (Required for OTP verification)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=HealLog <your-email@gmail.com>

# Optional: Redis cache
# REDIS_URL=redis://localhost:6379

# Optional: Sentry error tracking
# SENTRY_DSN=https://your-sentry-dsn
```

**⚠️ NEVER commit this file to git!**

Add to `.gitignore`:
```
backend/.env.production
backend/.env
```

---

## Testing Your Deployed Backend

### 1. Health Check
```bash
curl https://your-app.up.railway.app/health
# Should return: {"status": "healthy"}
```

### 2. API Documentation
Visit in browser:
```
https://your-app.up.railway.app/docs
```

### 3. Test User Registration
```bash
curl -X POST https://your-app.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User",
    "specialization": "General"
  }'
```

### 4. Update Frontend Environment
```bash
# In frontend/.env.beta:
EXPO_PUBLIC_BACKEND_URL=https://your-app.up.railway.app

# Rebuild your expo app or use EAS Update:
eas update --branch beta --message "Updated backend URL"
```

---

## Post-Deployment Checklist

- [ ] Backend accessible at public HTTPS URL
- [ ] /health endpoint returns 200 OK
- [ ] /docs shows API documentation
- [ ] Can create user via /api/auth/register
- [ ] MongoDB connection working
- [ ] Frontend .env.beta updated with new URL
- [ ] Test login from mobile app

---

## Monitoring & Logs

### Railway
```
Project → Backend Service → Deployments → View Logs
```

### Render
```
Dashboard → Service → Logs tab
```

### Fly.io
```bash
fly logs
```

### Add Error Tracking (Optional but Recommended)

**Sentry (Free tier):**
1. Sign up: https://sentry.io
2. Create Python project
3. Copy DSN
4. Add to environment variables:
   ```
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

---

## Troubleshooting

### Backend won't start
- Check logs for errors
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### 502 Bad Gateway
- Backend crashed - check logs
- Port mismatch - ensure PORT is set to what platform expects

### CORS errors in frontend
- Set `ALLOWED_ORIGINS=*` temporarily
- Later restrict to your app URL

### Database connection timeout
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Ensure network access allows connections

---

## Quick Start Summary (TL;DR)

1. ✅ Sign up for Railway.app
2. ✅ Create new project from backend folder
3. ✅ Add MongoDB database
4. ✅ Set environment variables (MONGO_URL, DB_NAME, SECRET_KEY)
5. ✅ Deploy automatically happens
6. ✅ Copy your URL: `https://xxx.up.railway.app`
7. ✅ Update frontend/.env.beta with new URL
8. ✅ Test with /docs endpoint

**Total time: ~15 minutes**

---

## Cost Breakdown

### Free Option (Railway + MongoDB Atlas):
- Railway: $5/month credit (enough for beta)
- MongoDB Atlas: FREE (M0 tier)
- **Total: $0/month during beta**

### Paid Option (Production-Ready):
- Railway Pro: $20/month
- MongoDB Atlas M2: $9/month  
- **Total: ~$29/month**

---

## Next Steps After Deployment

1. Test backend from Postman/Bruno
2. Update mobile app with new backend URL
3. Test registration and login from app
4. Monitor logs for errors
5. Set up uptime monitoring (UptimeRobot - free)

**Questions?** I'm here to help with any deployment issues!
