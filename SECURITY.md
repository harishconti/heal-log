# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in HealLog, please report it responsibly.

### How to Report

**Email:** security@heallog.com

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Acknowledgment:** Within 48 hours
- **Initial Assessment:** Within 7 days
- **Resolution:** Depends on severity (see below)

### Severity Levels

| Severity | Response Time | Examples |
|----------|---------------|----------|
| Critical | 24-48 hours | Auth bypass, data exposure, RCE |
| High | 7 days | SQL/NoSQL injection, XSS |
| Medium | 30 days | CSRF, information disclosure |
| Low | 90 days | Best practice violations |

---

## Security Measures

### Authentication

- **JWT tokens** with short expiration (30 minutes)
- **Refresh tokens** for session renewal
- **Password requirements:** 12+ characters, mixed case, numbers, special characters
- **OTP verification** for new accounts (8-digit codes)
- **Rate limiting** on auth endpoints (5 requests/minute)

### Data Protection

- **Encryption in transit:** TLS 1.2+ (HTTPS only)
- **Encryption at rest:** MongoDB encryption
- **Token storage:** SecureStore (mobile), sessionStorage (web)
- **No sensitive data in logs:** Tokens and passwords never logged

### API Security

- **Rate limiting** on all endpoints
- **Input validation** with Pydantic schemas
- **NoSQL injection prevention** via regex sanitization
- **CORS** restricted to allowed origins
- **Security headers:**
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Strict-Transport-Security (production)

### Webhook Security

- **Stripe webhooks:** HMAC-SHA256 signature verification
- **Timestamp validation** to prevent replay attacks

### Access Control

- **Role-based access:** Admin, Doctor, Patient
- **Resource isolation:** Users can only access their own data
- **Debug endpoints:** Disabled in production, require admin role

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.3.x | Yes (current) |
| 1.2.x | Yes (security patches only) |
| 1.0.x - 1.1.x | No |
| < 1.0.0 | No |

---

## Security Checklist for Developers

### Before Committing

- [ ] No secrets or credentials in code
- [ ] No hardcoded API keys or tokens
- [ ] Input validation on all user inputs
- [ ] Parameterized queries (no string concatenation)
- [ ] Error messages don't expose system details

### Before Deploying

- [ ] Environment variables set correctly
- [ ] Debug mode disabled
- [ ] CORS origins restricted
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Logging configured (no sensitive data)

---

## Environment Variables

**Required for security:**

```bash
# Strong random secret (32+ characters)
JWT_SECRET_KEY=your-random-secret-key

# Restrict CORS origins
ALLOWED_ORIGINS=https://your-frontend.com

# Production environment
ENV=production

# Webhook secret from Stripe
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Generate secure secrets:**

```bash
# Python
python -c "import secrets; print(secrets.token_hex(32))"

# OpenSSL
openssl rand -hex 32
```

---

## Compliance

This application is designed with the following regulations in mind:

- **GDPR** (EU data protection)
- **HIPAA** (US healthcare data) - architecture ready
- **CCPA** (California consumer privacy)

### Data Subject Rights

Users can:
- Export all their data (`GET /api/export/all`)
- Delete their account and data
- Update their information
- Revoke consent

---

## Security Updates

Security patches are released as needed. Subscribe to releases on GitHub for notifications.

**Last security review:** January 2026

---

## Acknowledgments

We appreciate security researchers who help keep HealLog secure. Responsible disclosure is encouraged and appreciated.
