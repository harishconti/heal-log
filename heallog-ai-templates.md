# HealLog - AI-Ready Implementation Templates

## 1. ANDROID VERSION MANAGEMENT SCRIPT

Create file: `scripts/bump-version.js`

```javascript
#!/usr/bin/env node

/**
 * Version bumping script for HealLog Android builds
 * Semantic Versioning: MAJOR.MINOR.PATCH-beta.BUILD
 * Examples: 1.0.0-beta.1, 1.0.0-beta.2, 1.0.0, 1.1.0
 */

const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(__dirname, '../frontend/app.json');
const versionJsonPath = path.join(__dirname, '../backend/VERSION.json');

function bumpVersion(type = 'patch') {
  // Read app.json
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const currentVersion = appJson.expo.version;
  const currentBuild = appJson.expo.android.versionCode;

  console.log(`Current version: ${currentVersion} (build ${currentBuild})`);

  // Parse version
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  let newVersion;
  let newBuild = currentBuild + 1;

  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
  }

  // Update app.json
  appJson.expo.version = newVersion;
  appJson.expo.android.versionCode = newBuild;

  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));

  // Update backend VERSION.json
  const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  versionJson.version = newVersion;
  versionJson.build = newBuild;
  versionJson.updated = new Date().toISOString();

  fs.writeFileSync(versionJsonPath, JSON.stringify(versionJson, null, 2));

  console.log(`✓ Updated to version: ${newVersion} (build ${newBuild})`);
}

// Execute
bumpVersion(process.argv[2] || 'patch');
```

---

## 2. ENVIRONMENT CONFIGURATION GENERATOR

Create file: `scripts/generate-env.js`

```javascript
#!/usr/bin/env node

/**
 * Generate environment files for different environments
 * Usage: node generate-env.js production|staging|development
 */

const fs = require('fs');
const path = require('path');

const configs = {
  development: {
    frontend: {
      EXPO_PUBLIC_BACKEND_URL: 'http://10.0.2.2:8000',
      EXPO_PUBLIC_API_TIMEOUT: '30000',
      EXPO_PUBLIC_LOG_LEVEL: 'debug',
    },
    backend: {
      MONGODB_URL: 'mongodb://localhost:27017',
      DATABASE_NAME: 'heallog_dev',
      JWT_SECRET_KEY: 'dev-secret-key-change-in-production',
      ALLOWED_ORIGINS: 'http://localhost:3000,http://10.0.2.2:3000',
      EMAIL_HOST: 'localhost',
      EMAIL_PORT: '1025',
      ENVIRONMENT: 'development',
    },
  },
  staging: {
    frontend: {
      EXPO_PUBLIC_BACKEND_URL: 'https://api-staging.heallog.com',
      EXPO_PUBLIC_API_TIMEOUT: '30000',
      EXPO_PUBLIC_LOG_LEVEL: 'info',
    },
    backend: {
      MONGODB_URL: 'mongodb+srv://user:pass@cluster.mongodb.net/heallog_staging?retryWrites=true',
      DATABASE_NAME: 'heallog_staging',
      JWT_SECRET_KEY: 'your-staging-secret-key',
      ALLOWED_ORIGINS: 'https://app-staging.heallog.com,https://dashboard-staging.heallog.com',
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: '587',
      ENVIRONMENT: 'staging',
    },
  },
  production: {
    frontend: {
      EXPO_PUBLIC_BACKEND_URL: 'https://api.heallog.com',
      EXPO_PUBLIC_API_TIMEOUT: '30000',
      EXPO_PUBLIC_LOG_LEVEL: 'warn',
    },
    backend: {
      MONGODB_URL: 'mongodb+srv://user:pass@cluster.mongodb.net/heallog?retryWrites=true',
      DATABASE_NAME: 'heallog',
      JWT_SECRET_KEY: 'your-production-secret-key',
      ALLOWED_ORIGINS: 'https://app.heallog.com,https://dashboard.heallog.com',
      EMAIL_HOST: 'smtp.sendgrid.net',
      EMAIL_PORT: '587',
      ENVIRONMENT: 'production',
    },
  },
};

function generateEnvFile(environment) {
  if (!configs[environment]) {
    console.error(`Unknown environment: ${environment}`);
    console.log('Available: development, staging, production');
    process.exit(1);
  }

  const config = configs[environment];

  // Generate frontend .env
  const frontendEnvPath = path.join(__dirname, `../frontend/.env.${environment}`);
  const frontendEnv = Object.entries(config.frontend)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(frontendEnvPath, frontendEnv + '\n');
  console.log(`✓ Generated: ${frontendEnvPath}`);

  // Generate backend .env
  const backendEnvPath = path.join(__dirname, `../backend/.env.${environment}`);
  const backendEnv = Object.entries(config.backend)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  fs.writeFileSync(backendEnvPath, backendEnv + '\n');
  console.log(`✓ Generated: ${backendEnvPath}`);

  console.log(`\n✓ Remember to update credentials for ${environment}`);
}

generateEnvFile(process.argv[2] || 'development');
```

---

## 3. GITHUB ACTIONS WORKFLOW FOR TESTING

Create file: `.github/workflows/backend-tests.yml`

```yaml
name: Backend Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'backend/**'
      - '.github/workflows/backend-tests.yml'
  pull_request:
    branches: [ main, develop ]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:latest
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        cd backend
        pip install --upgrade pip
        pip install -r requirements.txt
    
    - name: Run tests
      env:
        MONGODB_URL: mongodb://localhost:27017
        DATABASE_NAME: heallog_test
        JWT_SECRET_KEY: test-key
      run: |
        cd backend
        pytest --cov=app --cov-report=xml --cov-report=html
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage.xml
```

---

## 4. OFFLINE INDICATOR COMPONENT (React Native)

Create file: `frontend/components/OfflineIndicator.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>⚠️ You're offline. Changes will sync when connected.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9800',
    padding: 12,
    alignItems: 'center',
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

---

## 5. PUSH NOTIFICATION SERVICE (Firebase)

Create file: `frontend/services/pushNotificationService.ts`

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class PushNotificationService {
  static async initialize() {
    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Listen for foreground notifications
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification taps
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      this.handleNotificationNavigation(response.notification);
    });

    // Request permissions (iOS only)
    if (Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }

    return true;
  }

  static async getPushToken(): Promise<string | null> {
    try {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      return token;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  static async registerDeviceToken(userId: string, token: string) {
    try {
      // Save to backend
      const api = require('./api').default;
      await api.post('/api/notifications/register-device', {
        user_id: userId,
        device_token: token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register device token:', error);
    }
  }

  private static handleNotificationNavigation(notification: Notifications.Notification) {
    const data = notification.request.content.data;

    // Navigate based on notification type
    if (data.type === 'appointment_reminder') {
      // Navigate to appointments
    } else if (data.type === 'patient_update') {
      // Navigate to patient details
    } else if (data.type === 'note_comment') {
      // Navigate to note
    }
  }

  static async sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, string>
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
        },
        trigger: {
          seconds: 2,
        },
      });
    } catch (error) {
      console.error('Failed to send local notification:', error);
    }
  }
}

// Initialize on app start
export default PushNotificationService;
```

---

## 6. PRIVACY POLICY - HEALLOG EDITION

Create file: `PRIVACY_POLICY.md` (replace existing)

```markdown
# HealLog Privacy Policy

**Effective Date:** January 1, 2026
**Last Updated:** January 1, 2026

## 1. Introduction

HealLog ("we," "us," "our," or "Company") operates the HealLog mobile application and web dashboard (collectively, the "Service"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform.

This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.

## 2. Information We Collect

### 2.1 Information You Provide Directly

- **Account Information:** Name, email, phone number, medical specialty (for doctors)
- **Authentication:** Passwords (hashed), OTP verification codes
- **Patient Data:** Medical records, clinical notes, appointment details, test results
- **Profile Information:** Profile picture, professional credentials, practice details
- **Communication:** Feedback, support messages, bug reports

### 2.2 Information Collected Automatically

- **Device Information:** Device type, OS version, unique device ID
- **Usage Data:** Features used, pages visited, time spent, error logs
- **Network Data:** IP address, connection type, API request/response data
- **Location Data:** Only with explicit permission for doctor location services

### 2.3 Information from Third Parties

- **Google/Apple:** For OAuth authentication
- **Mobile Contacts:** Only when imported with explicit permission
- **Analytics Services:** Usage patterns and crash reports

## 3. How We Use Your Information

We use collected information for:
- Providing and maintaining the Service
- Processing transactions and sending notifications
- Improving Service features and user experience
- Sending security alerts and administrative messages
- Responding to support requests
- Complying with legal obligations
- Preventing fraud and unauthorized access

## 4. Data Security

We implement industry-standard security measures including:
- End-to-end encryption for sensitive data
- Secure storage with AES-256 encryption
- HTTPS/TLS for all communications
- Regular security audits and penetration testing
- Secure authentication with JWT tokens
- Two-factor authentication options

**Note:** No system is completely secure. While we protect your data, we cannot guarantee absolute security.

## 5. Data Retention

- **Account Data:** Retained while account is active
- **Patient Data:** Retained as long as required by medical regulations
- **Deleted Accounts:** Permanently deleted after 30 days of inactivity
- **Backup Data:** Deleted after 90 days
- **Usage Logs:** Deleted after 12 months

## 6. International Data Transfers

Your data may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws different from your home country. By using HealLog, you consent to this transfer.

For users in EU: We comply with GDPR data transfer requirements via Standard Contractual Clauses.

## 7. Your Privacy Rights

### 7.1 Access & Portability
You have the right to request a copy of your data in a portable format.

### 7.2 Correction
You can correct or update your personal information through your account settings.

### 7.3 Deletion
You can request deletion of your account and associated data. Medical records may be retained as required by law.

### 7.4 Opt-Out
You can opt out of non-essential communications through account settings.

### 7.5 GDPR Rights (EU Users)
- Right to be informed
- Right of access
- Right to rectification
- Right to erasure ("right to be forgotten")
- Right to restrict processing
- Right to data portability
- Right to object
- Rights related to automated decision-making

## 8. Third-Party Services

We may use third-party services:
- **Analytics:** Sentry for error tracking
- **Email:** SendGrid for transactional emails
- **Cloud Storage:** AWS S3 for backups
- **Authentication:** Google, Apple for OAuth
- **Payment:** Stripe for subscriptions

Each third party has its own privacy policy. We are not responsible for their practices.

## 9. Children's Privacy

HealLog is not intended for users under 13. We do not knowingly collect personal information from children under 13. If we learn a child under 13 has provided us information, we will delete it promptly.

## 10. HIPAA Compliance (If Applicable)

If your data qualifies as Protected Health Information (PHI) under HIPAA, we comply with HIPAA requirements including:
- Business Associate Agreements for data handlers
- Encryption for data at rest and in transit
- Access controls and audit logs
- Breach notification procedures

## 11. California Privacy Rights (CCPA)

California residents have the right to:
- Know what personal information is collected
- Know whether personal information is sold or disclosed
- Say no to the sale or sharing of personal information
- Access your personal information
- Request deletion of information collected
- Not be discriminated against for exercising CCPA rights

## 12. Policy Changes

We may update this Privacy Policy periodically. We will notify you of material changes by posting the updated policy on our website with the effective date. Your continued use of HealLog constitutes acceptance of changes.

## 13. Contact Us

For privacy concerns, contact:

**HealLog Support**
Email: support@heallog.com
Website: www.heallog.com

**Data Protection Officer:**
Email: dpo@heallog.com

**GDPR Compliance:**
Respond to data requests within 30 days.

---

*Last Updated: January 1, 2026*
*Version: 1.0*
```

---

## 7. DOCKERFILE FOR BACKEND

Create file: `backend/Dockerfile`

```dockerfile
# Multi-stage build for optimized image size
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Set environment
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

EXPOSE 8000
```

---

## 8. DOCKER COMPOSE (LOCAL DEVELOPMENT)

Create file: `docker-compose.yml`

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: heallog_mongodb
    environment:
      MONGO_INITDB_DATABASE: heallog_dev
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: heallog_backend
    environment:
      MONGODB_URL: mongodb://mongodb:27017
      DATABASE_NAME: heallog_dev
      JWT_SECRET_KEY: dev-secret-key
      ALLOWED_ORIGINS: http://localhost:3000,http://localhost:8081
      ENVIRONMENT: development
    ports:
      - "8000:8000"
    depends_on:
      mongodb:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  web-dashboard:
    build:
      context: ./web-dashboard
    container_name: heallog_web_dashboard
    ports:
      - "3000:5173"
    volumes:
      - ./web-dashboard:/app
    environment:
      VITE_API_URL: http://localhost:8000
    command: npm run dev

volumes:
  mongodb_data:
```

---

## 9. GITHUB ISSUE TEMPLATES

Create file: `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug Report
about: Report a bug in HealLog
title: "[BUG] "
labels: bug
assignees: ''

---

## Bug Description
<!-- Clear and concise description of the bug -->

## Reproduction Steps
<!-- Steps to reproduce the behavior -->
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
<!-- What you expected to happen -->

## Actual Behavior
<!-- What actually happened -->

## Environment
- **Device:** [e.g., Samsung Galaxy S21, iPhone 12]
- **OS Version:** [e.g., Android 12, iOS 15.1]
- **App Version:** [e.g., 1.0.0-beta.1]
- **Backend URL:** [if applicable]

## Screenshots/Video
<!-- If applicable, add screenshots or videos -->

## Logs
<!-- Any error messages or logs -->
\`\`\`
Paste error logs here
\`\`\`

## Additional Context
<!-- Any other relevant information -->
```

Create file: `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature Request
about: Suggest a feature for HealLog
title: "[FEATURE] "
labels: enhancement
assignees: ''

---

## Feature Description
<!-- Clear description of the feature -->

## Use Case
<!-- Why is this feature needed? What problem does it solve? -->

## Implementation Ideas
<!-- Optional: suggest how it might be implemented -->

## Impact
- [ ] Critical (blocks other features)
- [ ] High (important for users)
- [ ] Medium (nice to have)
- [ ] Low (cosmetic)

## Additional Context
<!-- Any other relevant information -->
```

---

## 10. SEMANTIC VERSIONING GUIDE

Create file: `docs/VERSIONING.md`

```markdown
# HealLog Versioning Strategy

## Semantic Versioning (MAJOR.MINOR.PATCH)

### MAJOR Version
Increment when making **incompatible API or app changes**.
- Breaking API changes
- Major feature removals
- Required data migrations

Example: `1.0.0` → `2.0.0`

### MINOR Version
Increment when adding **new features** in a backward-compatible way.
- New patient features
- New analytics
- New API endpoints

Example: `1.0.0` → `1.1.0`

### PATCH Version
Increment for **bug fixes** and minor improvements.
- Bug fixes
- Performance improvements
- Security patches

Example: `1.0.0` → `1.0.1`

## Beta Versioning

For beta releases, append `-beta.N`:
- `1.0.0-beta.1` - First beta release
- `1.0.0-beta.2` - Second beta release
- `1.0.0` - First production release

## Release Process

1. Update version in `frontend/app.json` and `backend/VERSION.json`
2. Create GitHub release with tag `v{version}`
3. Generate changelog from commits
4. Build and deploy

## Example Timeline

```
Dec 25: 1.0.0-beta.1 (closed beta)
Dec 28: 1.0.0-beta.2 (bug fixes)
Jan 3:  1.0.0-beta.3 (feature additions)
Jan 10: 1.0.0 (production release)
Jan 20: 1.0.1 (security patch)
Feb 1:  1.1.0 (new features)
```

## Android versionCode

- Must increment with every release
- Never decrement
- Should match semantic versioning: MMMNNNPPP
  - MMM = Major (001-999)
  - NNN = Minor (001-999)
  - PPP = Patch (001-999)
  - Beta appended: -00

Examples:
- 1.0.0 = versionCode 1000000
- 1.0.1 = versionCode 1000001
- 1.1.0 = versionCode 1001000
- 2.0.0 = versionCode 2000000
```

---

## NEXT STEPS

These templates are ready to:
1. Copy directly into your repository
2. Review and customize for your specific needs
3. Execute the scripts to generate configuration files
4. Commit to GitHub

**Estimated AI Implementation Time:** 2-3 hours to fully integrate all these templates.

Start with highest priority:
1. Environment config generator
2. Offline indicator component
3. Privacy policy update
4. Dockerfile
5. GitHub workflows

Then proceed with secondary items.
