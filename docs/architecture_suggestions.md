# Backend Architecture Suggestions

This document outlines identified irregularities in the backend codebase and provides recommendations for standardized patterns to improve maintainability, consistency, and reliability.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Error Handling](#error-handling)
3. [Authentication & Authorization](#authentication--authorization)
4. [Database & Data Access Patterns](#database--data-access-patterns)
5. [Logging Standards](#logging-standards)
6. [Configuration Management](#configuration-management)
7. [Type Definitions & Schemas](#type-definitions--schemas)
8. [Code Organization](#code-organization)
9. [Middleware Optimization](#middleware-optimization)
10. [Implementation Priority](#implementation-priority)

---

## Executive Summary

### Current Patterns That Work Well

| Pattern | Location | Why It Works |
|---------|----------|--------------|
| Generic BaseService with type generics | `services/base_service.py` | Reduces boilerplate, enforces consistency |
| Security headers middleware | `main.py:276` | Comprehensive protection (HSTS, CSP, etc.) |
| Structured context propagation | `core/logging_config.py` | Request tracing with request_id |
| User-scoped caching | `api/patients.py:16-32` | Prevents cache pollution between users |
| Atomic database operations | `services/patient_service.py:79-83` | Race condition prevention |
| Password strength validation | `schemas/user.py` | Schema-level enforcement |

### Critical Issues Requiring Attention

| Issue | Risk Level | Impact |
|-------|------------|--------|
| Mixed error response formats | High | Inconsistent client experience |
| JWT decoded 3+ times per request | Medium | Performance degradation |
| In-memory token blacklist | High | Token revocation lost on restart |
| Threading locks (not async-safe) | High | Race conditions under load |
| Dual model/schema definitions | Low | Developer confusion |

---

## Error Handling

### Current State: Multiple Patterns

The codebase uses **four different error handling patterns**:

**Pattern 1: Custom APIException** (Preferred)
```python
# Used in: auth.py, sync.py
# Returns: {"success": false, "error": {"message": "..."}, "request_id": "..."}
raise APIException(
    status_code=status.HTTP_409_CONFLICT,
    detail="An account with this email already exists"
)
```

**Pattern 2: HTTPException** (Inconsistent)
```python
# Used in: patients.py, users.py, documents.py
# Returns: {"detail": "..."}
raise HTTPException(
    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
    detail=str(e)
)
```

**Pattern 3: Tuple Returns** (Service Layer)
```python
# Used in: otp_service.py
# Returns: (bool, str) - No exception raised
async def create_and_send_otp(self, user: User) -> Tuple[bool, str]:
    return (success, message)
```

**Pattern 4: Direct Object Returns** (Implicit)
```python
# Used in: feedback.py
# Returns object on success, exception on failure
return feedback
```

### Recommended Standard

Adopt **APIException exclusively** with a unified response schema:

```python
# core/exceptions.py - Enhanced

from pydantic import BaseModel
from typing import Optional, Dict, Any

class ErrorDetail(BaseModel):
    message: str
    code: str  # Machine-readable error code
    field: Optional[str] = None  # For validation errors
    context: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    request_id: Optional[str] = None

# Exception classes
class APIException(Exception):
    def __init__(
        self,
        status_code: int,
        message: str,
        code: str = "UNKNOWN_ERROR",
        field: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.message = message
        self.code = code
        self.field = field
        self.context = context

# Predefined exceptions for common cases
class NotFoundException(APIException):
    def __init__(self, resource: str, identifier: str):
        super().__init__(
            status_code=404,
            message=f"{resource} not found",
            code="NOT_FOUND",
            context={"resource": resource, "identifier": identifier}
        )

class ValidationException(APIException):
    def __init__(self, field: str, message: str):
        super().__init__(
            status_code=422,
            message=message,
            code="VALIDATION_ERROR",
            field=field
        )

class ConflictException(APIException):
    def __init__(self, message: str, code: str = "CONFLICT"):
        super().__init__(status_code=409, message=message, code=code)
```

### Migration Steps

1. Update all `HTTPException` usages to `APIException`
2. Replace tuple returns in services with exceptions
3. Add global exception handler in `main.py`:

```python
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=ErrorDetail(
                message=exc.message,
                code=exc.code,
                field=exc.field,
                context=exc.context
            ),
            request_id=request_id_var.get(None)
        ).dict()
    )
```

### Files to Update

| File | Current Pattern | Action |
|------|-----------------|--------|
| `api/patients.py` | HTTPException | Convert to APIException |
| `api/users.py` | HTTPException | Convert to APIException |
| `api/documents.py` | HTTPException | Convert to APIException |
| `services/otp_service.py` | Tuple[bool, str] | Raise exceptions instead |
| `services/user_service.py` | Mixed | Standardize to APIException |

---

## Authentication & Authorization

### Current Issues

**Issue 1: JWT Decoded Multiple Times**

```
Request Flow:
1. LoggingMiddleware (logging.py:74) → Parses JWT for user_id
2. get_current_user (security.py:97) → Full JWT decode + validation
3. require_pro_user (security.py:195) → Another JWT decode
4. require_role (security.py:261) → Yet another JWT decode
```

**Issue 2: Inconsistent Token Validation**

| Function | Checks Expiry | Checks Blacklist | Fetches User |
|----------|---------------|------------------|--------------|
| `get_current_user` | Yes | Yes | Yes |
| `require_pro_user` | No | No | No |
| `require_role` | Partial | No | No |

**Issue 3: In-Memory Token Blacklist**

```python
# token_blacklist_service.py:29
# Dictionary storage - not persistent!
_blacklisted_tokens: Dict[str, datetime] = {}
```

### Recommended Standard

**1. Single JWT Processing Point**

```python
# core/auth_context.py - NEW FILE

from contextvars import ContextVar
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class AuthContext:
    user_id: Optional[str] = None
    email: Optional[str] = None
    plan: Optional[str] = None
    role: Optional[str] = None
    token_jti: Optional[str] = None
    authenticated: bool = False

auth_context_var: ContextVar[AuthContext] = ContextVar(
    'auth_context', default=AuthContext()
)

def get_auth_context() -> AuthContext:
    return auth_context_var.get()
```

**2. Unified Auth Middleware**

```python
# middleware/auth.py - NEW FILE

class AuthMiddleware:
    async def __call__(self, request: Request, call_next):
        auth_header = request.headers.get("Authorization")
        ctx = AuthContext()

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
            try:
                # Single decode point
                payload = jwt.decode(
                    token,
                    settings.SECRET_KEY,
                    algorithms=[settings.ALGORITHM]
                )

                # Check blacklist (Redis-backed)
                if not await token_blacklist.is_revoked(payload.get("jti")):
                    ctx = AuthContext(
                        user_id=payload.get("sub"),
                        email=payload.get("email"),
                        plan=payload.get("plan"),
                        role=payload.get("role"),
                        token_jti=payload.get("jti"),
                        authenticated=True
                    )
            except jwt.PyJWTError:
                pass  # Unauthenticated request

        token = auth_context_var.set(ctx)
        try:
            response = await call_next(request)
        finally:
            auth_context_var.reset(token)

        return response
```

**3. Simplified Dependencies**

```python
# core/security.py - Simplified

from .auth_context import get_auth_context, AuthContext

def require_auth() -> AuthContext:
    """Require authenticated user"""
    ctx = get_auth_context()
    if not ctx.authenticated:
        raise APIException(401, "Authentication required", "UNAUTHORIZED")
    return ctx

def require_pro() -> AuthContext:
    """Require PRO plan user"""
    ctx = require_auth()
    if ctx.plan != UserPlan.PRO:
        raise APIException(403, "PRO plan required", "PRO_REQUIRED")
    return ctx

def require_role(*roles: str) -> Callable:
    """Require specific role(s)"""
    def dependency() -> AuthContext:
        ctx = require_auth()
        if ctx.role not in roles:
            raise APIException(403, "Insufficient permissions", "FORBIDDEN")
        return ctx
    return Depends(dependency)
```

**4. Redis-Backed Token Blacklist**

```python
# services/token_blacklist_service.py - Updated

class TokenBlacklistService:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client
        self.prefix = "token_blacklist:"

    async def revoke(self, jti: str, expires_at: datetime):
        ttl = int((expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            await self.redis.setex(f"{self.prefix}{jti}", ttl, "1")

    async def is_revoked(self, jti: str) -> bool:
        return await self.redis.exists(f"{self.prefix}{jti}")
```

---

## Database & Data Access Patterns

### Current Issues

**Issue 1: Inconsistent Query Building**

```python
# PatientService has structured query builder
def _build_patient_query(self, ...):  # patient_service.py:170

# Others use inline query construction
await collection.find({"user_id": user_id, "status": status})
```

**Issue 2: Mixed Collection Access**

```python
# Some services use Beanie Documents
patient = await Patient.find_one(...)

# Others use raw MongoDB collections
collection = database.get_collection("feedbacks")
```

**Issue 3: Account Lockout Uses Threading Locks**

```python
# account_lockout_service.py:32
# threading.Lock() is not async-safe!
self._lock = threading.Lock()
```

### Recommended Standard

**1. Repository Pattern**

```python
# repositories/base_repository.py - NEW FILE

from typing import TypeVar, Generic, Type, Optional, List
from beanie import Document

T = TypeVar('T', bound=Document)

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T]):
        self.model = model

    async def get_by_id(self, id: str) -> Optional[T]:
        return await self.model.get(id)

    async def get_all(
        self,
        filters: dict = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[T]:
        query = self.model.find(filters or {})
        return await query.skip(skip).limit(limit).to_list()

    async def create(self, entity: T) -> T:
        await entity.insert()
        return entity

    async def update(self, entity: T) -> T:
        await entity.save()
        return entity

    async def delete(self, id: str) -> bool:
        entity = await self.get_by_id(id)
        if entity:
            await entity.delete()
            return True
        return False
```

**2. Async-Safe Locking**

```python
# core/async_lock.py - NEW FILE

import asyncio
from typing import Dict

class AsyncLockManager:
    def __init__(self):
        self._locks: Dict[str, asyncio.Lock] = {}
        self._meta_lock = asyncio.Lock()

    async def acquire(self, key: str) -> asyncio.Lock:
        async with self._meta_lock:
            if key not in self._locks:
                self._locks[key] = asyncio.Lock()
            return self._locks[key]

    async def with_lock(self, key: str):
        lock = await self.acquire(key)
        await lock.acquire()
        try:
            yield
        finally:
            lock.release()
```

**3. Standardized Query Builder**

```python
# core/query_builder.py - NEW FILE

from typing import Any, Dict, List, Optional
from datetime import datetime

class QueryBuilder:
    def __init__(self):
        self._query: Dict[str, Any] = {}

    def user_scope(self, user_id: str) -> 'QueryBuilder':
        self._query["user_id"] = user_id
        return self

    def search(self, field: str, term: str, case_insensitive: bool = True) -> 'QueryBuilder':
        # Sanitize for NoSQL injection
        safe_term = self._sanitize_regex(term)
        options = "i" if case_insensitive else ""
        self._query[field] = {"$regex": safe_term, "$options": options}
        return self

    def date_range(
        self,
        field: str,
        start: Optional[datetime] = None,
        end: Optional[datetime] = None
    ) -> 'QueryBuilder':
        conditions = {}
        if start:
            conditions["$gte"] = start
        if end:
            conditions["$lte"] = end
        if conditions:
            self._query[field] = conditions
        return self

    def in_list(self, field: str, values: List[Any]) -> 'QueryBuilder':
        self._query[field] = {"$in": values}
        return self

    def build(self) -> Dict[str, Any]:
        return self._query.copy()

    @staticmethod
    def _sanitize_regex(term: str) -> str:
        # Escape regex special characters
        special_chars = r'\.^$*+?{}[]|()'
        for char in special_chars:
            term = term.replace(char, f'\\{char}')
        return term
```

---

## Logging Standards

### Current Issues

**Inconsistent Prefixes:**
```python
# Some services
logger.info(f"[USER_SERVICE] Creating user...")    # With prefix
logging.error(f"Error creating patient...")         # Without prefix

# Some use structured logging
structlog.info("request_completed", status=200)    # Key-value

# Some use f-strings
logger.info(f"OTP created for user {user_id}")     # Interpolated
```

**Sensitive Data Exposure:**
```python
# Inconsistent masking
logger.warning(f"...for {email[:3]}***")  # Masked
logger.info(f"Login for {email}")          # Full email exposed
```

### Recommended Standard

**1. Standardized Logger Factory**

```python
# core/logger.py - NEW FILE

import structlog
from typing import Any, Dict

def get_logger(module: str) -> structlog.BoundLogger:
    """Get a structured logger for a module"""
    return structlog.get_logger().bind(module=module)

class LoggerMixin:
    """Mixin for classes that need logging"""

    @property
    def logger(self) -> structlog.BoundLogger:
        if not hasattr(self, '_logger'):
            self._logger = get_logger(self.__class__.__name__)
        return self._logger
```

**2. Sensitive Data Masking**

```python
# core/logger.py - Continued

def mask_email(email: str) -> str:
    """Mask email for logging: test@example.com -> tes***@***.com"""
    if not email or '@' not in email:
        return '***'
    local, domain = email.rsplit('@', 1)
    masked_local = local[:3] + '***' if len(local) > 3 else '***'
    masked_domain = '***.' + domain.rsplit('.', 1)[-1]
    return f"{masked_local}@{masked_domain}"

def mask_sensitive(data: Dict[str, Any]) -> Dict[str, Any]:
    """Mask sensitive fields in a dictionary"""
    sensitive_fields = {'email', 'password', 'token', 'phone', 'ssn'}
    masked = data.copy()
    for key in sensitive_fields:
        if key in masked:
            if key == 'email':
                masked[key] = mask_email(masked[key])
            else:
                masked[key] = '***'
    return masked
```

**3. Logging Convention**

All log messages should follow this format:

```python
# Format: logger.level(event_name, **context)

# Good examples
self.logger.info("user_created", user_id=user_id, plan=plan)
self.logger.error("patient_create_failed", error=str(e), user_id=user_id)
self.logger.warning("rate_limit_exceeded", email=mask_email(email))

# Bad examples (avoid)
logger.info(f"[SERVICE] User {user_id} created")  # Don't use f-strings
logging.info("Created user")                       # Don't use logging module
```

---

## Configuration Management

### Current Issues

1. **Validators that don't add value** (config.py:40-44)
2. **Inconsistent environment defaults** (mongomock vs real Redis)
3. **No validation for critical optional settings**
4. **Missing .env.example standardization**

### Recommended Standard

**1. Enhanced Configuration**

```python
# core/config.py - Enhanced

from pydantic import BaseSettings, validator, root_validator
from typing import List, Optional
from enum import Enum

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class Settings(BaseSettings):
    # Environment
    ENVIRONMENT: Environment = Environment.DEVELOPMENT
    DEBUG: bool = False

    # Core (Required)
    SECRET_KEY: str
    MONGO_URL: str

    # Core (Optional with smart defaults)
    DB_NAME: str = "heallog"
    REDIS_URL: Optional[str] = None  # Fallback to in-memory

    # JWT
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # Rate Limits (centralized)
    RATE_LIMIT_LOGIN_ATTEMPTS: int = 5
    RATE_LIMIT_LOGIN_WINDOW: int = 900  # 15 minutes
    RATE_LIMIT_OTP_PER_EMAIL: int = 3
    RATE_LIMIT_OTP_WINDOW: int = 3600  # 1 hour
    RATE_LIMIT_API_REQUESTS: int = 100
    RATE_LIMIT_API_WINDOW: int = 60

    # Email (validated together)
    EMAIL_ENABLED: bool = False
    EMAIL_HOST: Optional[str] = None
    EMAIL_PORT: int = 587
    EMAIL_USER: Optional[str] = None
    EMAIL_PASSWORD: Optional[str] = None
    EMAIL_FROM: Optional[str] = None

    @root_validator
    def validate_email_settings(cls, values):
        if values.get('EMAIL_ENABLED'):
            required = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM']
            missing = [f for f in required if not values.get(f)]
            if missing:
                raise ValueError(f"EMAIL_ENABLED=true requires: {', '.join(missing)}")
        return values

    @validator('SECRET_KEY')
    def validate_secret_key(cls, v, values):
        if values.get('ENVIRONMENT') == Environment.PRODUCTION:
            if len(v) < 32:
                raise ValueError("SECRET_KEY must be at least 32 characters in production")
            if v == "your-secret-key-here":
                raise ValueError("SECRET_KEY must be changed from default in production")
        return v

    class Config:
        env_file = ".env"
        case_sensitive = True
```

**2. Environment Template**

Create `.env.template` with documentation:

```bash
# .env.template

# ===========================================
# Required Settings
# ===========================================

# Secret key for JWT signing (min 32 chars in production)
SECRET_KEY=your-secret-key-change-in-production

# MongoDB connection string
MONGO_URL=mongodb://localhost:27017

# ===========================================
# Optional Settings (with defaults)
# ===========================================

# Environment: development, staging, production
ENVIRONMENT=development

# Redis URL (optional - uses in-memory cache if not set)
# REDIS_URL=redis://localhost:6379

# ===========================================
# Email Settings (required if EMAIL_ENABLED=true)
# ===========================================
EMAIL_ENABLED=false
# EMAIL_HOST=smtp.sendgrid.net
# EMAIL_PORT=587
# EMAIL_USER=apikey
# EMAIL_PASSWORD=your-sendgrid-api-key
# EMAIL_FROM=noreply@yourdomain.com
```

---

## Type Definitions & Schemas

### Current Issues

1. **Dual definitions**: Both `/app/models/` and `/app/schemas/` contain similar models
2. **Inconsistent nullable handling**: Some use `Optional[str] = None`, others use `= ""`
3. **Missing documentation**: No docstrings on model classes
4. **Mixed index definitions**: `Indexed()` vs `Settings.indexes`

### Recommended Standard

**1. Consolidate to Single Source**

```
app/
├── models/           # Beanie Documents ONLY (database models)
│   ├── user.py       # User Document
│   ├── patient.py    # Patient Document
│   └── ...
├── schemas/          # Pydantic models for API (request/response)
│   ├── user.py       # UserCreate, UserUpdate, UserResponse
│   ├── patient.py    # PatientCreate, PatientUpdate, PatientResponse
│   └── ...
└── ...
```

**2. Schema Naming Convention**

```python
# schemas/patient.py

class PatientBase(BaseModel):
    """Shared fields for Patient schemas"""
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, regex=r'^\+?[\d\s-]+$')
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    """Schema for creating a new patient"""
    pass

class PatientUpdate(BaseModel):
    """Schema for updating a patient (all fields optional)"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, regex=r'^\+?[\d\s-]+$')
    notes: Optional[str] = None

class PatientResponse(PatientBase):
    """Schema for patient API responses"""
    id: str
    patient_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode
```

**3. Nullable Field Convention**

```python
# Use Optional[T] = None for truly optional fields
phone: Optional[str] = None

# Use default values only when there's a meaningful default
status: str = "active"

# Never use empty string as null replacement
# Bad:  phone: Optional[str] = Field(default="", ...)
# Good: phone: Optional[str] = None
```

---

## Code Organization

### Current Issues

1. **Flat API structure**: 18 files in `/api/` without versioning
2. **Rate limits scattered**: Defined in multiple files
3. **Service instantiation inconsistent**: Mix of singletons, instances, and async refs
4. **No constants centralization**

### Recommended Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/                    # API version 1
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── patients.py
│   │   │   └── ...
│   │   └── deps.py                # Shared dependencies
│   ├── core/
│   │   ├── config.py              # Settings
│   │   ├── constants.py           # All constants (rate limits, etc.)
│   │   ├── exceptions.py          # Custom exceptions
│   │   ├── security.py            # Auth utilities
│   │   └── logger.py              # Logging config
│   ├── models/                    # Database models (Beanie Documents)
│   ├── schemas/                   # API schemas (Pydantic)
│   ├── repositories/              # Data access layer (new)
│   ├── services/                  # Business logic
│   └── middleware/
├── tests/
│   ├── api/                       # Mirror source structure
│   │   └── v1/
│   ├── services/
│   └── conftest.py
└── main.py
```

### Centralized Constants

```python
# core/constants.py

from dataclasses import dataclass

@dataclass(frozen=True)
class RateLimits:
    # Authentication
    LOGIN_MAX_ATTEMPTS: int = 5
    LOGIN_WINDOW_SECONDS: int = 900
    OTP_MAX_PER_EMAIL: int = 3
    OTP_WINDOW_SECONDS: int = 3600
    PASSWORD_RESET_MAX: int = 3
    PASSWORD_RESET_WINDOW: int = 3600

    # API
    API_REQUESTS_PER_MINUTE: int = 100
    EXPORT_REQUESTS_PER_HOUR: int = 10
    WEBHOOK_REQUESTS_PER_MINUTE: int = 50

@dataclass(frozen=True)
class CacheTTL:
    USER_PROFILE: int = 300  # 5 minutes
    PATIENT_LIST: int = 60   # 1 minute
    ANALYTICS: int = 600     # 10 minutes

RATE_LIMITS = RateLimits()
CACHE_TTL = CacheTTL()
```

---

## Middleware Optimization

### Current Issues

1. **JWT parsed twice**: LoggingMiddleware and `get_current_user`
2. **Middleware order comments don't match reality**
3. **No request validation middleware**

### Recommended Middleware Stack

```python
# main.py - Corrected order with comments

# Middleware applied bottom-to-top (last added = first executed)

# 5. CORS (outermost - handles preflight)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Security Headers (add headers to all responses)
app.add_middleware(SecurityHeadersMiddleware)

# 3. Request Size Limit (reject oversized requests early)
app.add_middleware(RequestSizeLimitMiddleware, max_size=10 * 1024 * 1024)

# 2. Authentication (decode JWT once, set context)
app.add_middleware(AuthMiddleware)

# 1. Request Logging (innermost - logs with auth context)
app.add_middleware(LoggingMiddleware)

# Execution order for incoming request:
# CORS → Security Headers → Request Size → Auth → Logging → Route Handler
```

---

## Implementation Priority

### Phase 1: Critical (Security & Reliability)

| Task | Files | Effort |
|------|-------|--------|
| Move token blacklist to Redis | `token_blacklist_service.py` | Low |
| Fix async-unsafe threading locks | `account_lockout_service.py` | Low |
| Unify JWT processing to single point | `middleware/auth.py`, `security.py` | Medium |
| Standardize error responses | All API files | Medium |

### Phase 2: Consistency (Developer Experience)

| Task | Files | Effort |
|------|-------|--------|
| Centralize constants/rate limits | `core/constants.py` | Low |
| Implement structured logging | All services | Medium |
| Consolidate models/schemas | `models/`, `schemas/` | Medium |
| Add .env.template | Root | Low |

### Phase 3: Optimization (Performance & Maintainability)

| Task | Files | Effort |
|------|-------|--------|
| Add repository layer | New `repositories/` | High |
| Implement API versioning | Restructure `api/` | High |
| Add query builder pattern | `core/query_builder.py` | Medium |
| Update tests for new structure | `tests/` | High |

---

## Appendix: Files Referenced

| File | Line | Issue |
|------|------|-------|
| `main.py` | 275-279 | Middleware order comments |
| `core/exceptions.py` | 13-39 | Multiple exception types |
| `core/security.py` | 89-301 | JWT decoded multiple times |
| `middleware/logging.py` | 74 | Redundant JWT parse |
| `services/token_blacklist_service.py` | 29 | In-memory storage |
| `services/account_lockout_service.py` | 32 | Threading locks |
| `services/otp_service.py` | 41-71 | Tuple return pattern |
| `api/patients.py` | 31 | HTTPException usage |
| `api/auth.py` | 23-38 | Rate limits defined locally |
| `api/payments.py` | 18-20 | Rate limits defined locally |
| `core/config.py` | 40-44 | Redundant validators |

---

*Document generated: 2026-01-17*
*Based on codebase analysis of heal-log backend*
