# Google Contacts Sync - Implementation Strategy Report

## Executive Summary

This document outlines the implementation strategy for adding Google Contacts synchronization to HealLog. The feature will allow users to import contacts from their Google account, de-duplicate against existing patients, and maintain sync state for incremental updates.

---

## 1. Architecture Overview

### 1.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Tap     │───▶│  OAuth   │───▶│  Fetch   │───▶│  Review  │───▶ Done    │
│  │ Connect  │    │  Flow    │    │ Contacts │    │ Dupes    │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React Native)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │  google-        │   │  useGoogle      │   │  useOffline     │           │
│  │  contacts-      │───│  ContactsSync   │───│  Queue          │           │
│  │  sync.tsx       │   │  Hook           │   │  Hook           │           │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘           │
│           │                    │                     │                      │
│           ▼                    ▼                     ▼                      │
│  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐           │
│  │  Zustand Store  │   │  GoogleContacts │   │  OfflineQueue   │           │
│  │  (sync slice)   │◀──│  Service        │◀──│  Service        │           │
│  └─────────────────┘   └─────────────────┘   └─────────────────┘           │
│                               │                                             │
└───────────────────────────────│─────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   REST API (HTTPS)    │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────│─────────────────────────────────────────────┐
│                              BACKEND (FastAPI)                               │
├───────────────────────────────│─────────────────────────────────────────────┤
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                 /api/integrations/google-contacts                │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │       │
│  │  │ auth-url │  │ callback │  │   sync   │  │ sync-status/{id} │ │       │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                               │                                             │
│           ┌───────────────────┼───────────────────┐                         │
│           ▼                   ▼                   ▼                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐               │
│  │ GoogleOAuth     │ │ GoogleContacts  │ │ PatientMerge    │               │
│  │ Service         │ │ Service         │ │ Service         │               │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘               │
│           │                   │                   │                         │
│           ▼                   ▼                   ▼                         │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      MongoDB (Beanie ODM)                        │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │       │
│  │  │  User    │  │ Patient  │  │ SyncJob  │  │ Duplicate │        │       │
│  │  │(+tokens) │  │(+source) │  │  Record  │  │  Record   │        │       │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────┐
                    │  Google People API    │
                    │  (External Service)   │
                    └───────────────────────┘
```

---

## 2. Data Model Changes

### 2.1 User Model Extensions

Add OAuth token storage to the existing User model:

```python
# New fields to add to User model (backend/app/schemas/user.py)

# Google OAuth Integration
google_oauth_tokens: Optional[GoogleOAuthTokens] = None

class GoogleOAuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_at: datetime
    scope: str
    connected_at: datetime
```

**Rationale**: Store tokens directly in User model rather than a separate collection to:
- Reduce query complexity (single document fetch)
- Align with existing pattern (OTP fields stored on User)
- Simplify token refresh logic

### 2.2 Patient Model Extensions

Add source tracking to existing Patient model:

```python
# New fields to add to Patient model (backend/app/schemas/patient.py)

# Source tracking for imports
source: Optional[str] = Field(default="manual", max_length=50)  # manual | google_contacts | imported
external_id: Optional[str] = Field(default=None, max_length=255)  # Google contact resourceName
last_synced_at: Optional[datetime] = None
sync_version: Optional[int] = Field(default=0)  # For conflict detection
local_modified_at: Optional[datetime] = None  # Track user edits post-sync
```

**Rationale**:
- `source` enables filtering by import origin
- `external_id` enables bi-directional sync mapping
- `last_synced_at` enables incremental sync
- `sync_version` + `local_modified_at` enable conflict detection

### 2.3 New Models

#### GoogleContactsSyncJob

```python
class GoogleContactsSyncJob(Document):
    """Tracks individual sync job progress and results"""
    id: str
    user_id: Indexed(str)
    status: SyncJobStatus  # pending | in_progress | completed | failed | cancelled
    job_type: str  # initial | incremental

    # Progress tracking
    total_contacts: int = 0
    processed_contacts: int = 0
    created_patients: int = 0
    updated_patients: int = 0
    skipped_contacts: int = 0

    # Duplicate handling
    duplicates_found: int = 0
    duplicates_resolved: int = 0
    pending_duplicates: List[str] = []  # IDs of DuplicateRecord documents

    # Sync metadata
    google_sync_token: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    # Cancellation support
    cancel_requested: bool = False

    created_at: datetime
    updated_at: datetime
```

#### DuplicateRecord

```python
class DuplicateRecord(Document):
    """Stores pending duplicate decisions for user review"""
    id: str
    sync_job_id: Indexed(str)
    user_id: Indexed(str)

    # The incoming Google contact (raw data)
    google_contact: Dict

    # Matched existing patient(s)
    matched_patients: List[DuplicateMatch]

    # Resolution
    status: str  # pending | resolved | skipped
    resolution: Optional[str] = None  # keep_existing | replace | merge | create_new
    resolved_patient_id: Optional[str] = None
    resolved_at: Optional[datetime] = None

    # Confidence metrics
    highest_confidence: float  # 0.0 - 1.0
    match_reasons: List[str]  # ["phone_exact", "email_exact", "name_fuzzy"]

    created_at: datetime

class DuplicateMatch(BaseModel):
    patient_id: str
    patient_name: str
    patient_phone: str
    patient_email: str
    confidence: float
    match_reasons: List[str]
```

### 2.4 WatermelonDB Schema Updates (Frontend)

```typescript
// frontend/models/schema.ts - Add to schema version 4

// Update patients table
{
  name: 'patients',
  columns: [
    // ... existing columns ...
    { name: 'source', type: 'string', isOptional: true },
    { name: 'external_id', type: 'string', isOptional: true, isIndexed: true },
    { name: 'last_synced_at', type: 'number', isOptional: true },
    { name: 'sync_version', type: 'number', isOptional: true },
    { name: 'local_modified_at', type: 'number', isOptional: true },
  ]
}

// New table for offline queue
{
  name: 'offline_queue',
  columns: [
    { name: 'job_type', type: 'string' },  // google_contacts_sync | other
    { name: 'payload', type: 'string' },   // JSON payload
    { name: 'status', type: 'string' },    // pending | processing | completed | failed
    { name: 'retry_count', type: 'number' },
    { name: 'last_error', type: 'string', isOptional: true },
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
  ]
}
```

---

## 3. Backend Implementation Plan

### 3.1 API Endpoints

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/integrations/google-contacts/auth-url` | GET | Generate OAuth consent URL | Yes |
| `/api/integrations/google-contacts/callback` | GET | Handle OAuth callback | Yes (state token) |
| `/api/integrations/google-contacts/disconnect` | POST | Remove Google connection | Yes |
| `/api/integrations/google-contacts/sync` | POST | Trigger sync job | Yes |
| `/api/integrations/google-contacts/sync-status/{job_id}` | GET | Poll sync progress | Yes |
| `/api/integrations/google-contacts/sync/cancel/{job_id}` | POST | Cancel running sync | Yes |
| `/api/integrations/google-contacts/duplicates` | GET | Get pending duplicates | Yes |
| `/api/integrations/google-contacts/duplicates/{id}/resolve` | POST | Resolve a duplicate | Yes |
| `/api/integrations/google-contacts/duplicates/batch-resolve` | POST | Resolve multiple | Yes |

### 3.2 Service Layer

```
backend/app/services/
├── google_oauth_service.py     # OAuth flow handling
├── google_contacts_service.py  # Google People API integration
├── contact_sync_service.py     # Sync orchestration
├── duplicate_detection_service.py  # De-duplication logic
└── patient_merge_service.py    # Merge strategy execution
```

### 3.3 OAuth Flow Detail

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile  │     │  Backend │     │  Google  │     │  Mobile  │
│   App    │     │   API    │     │  OAuth   │     │ Callback │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ GET /auth-url  │                │                │
     │───────────────▶│                │                │
     │                │                │                │
     │ {auth_url,     │                │                │
     │  state}        │                │                │
     │◀───────────────│                │                │
     │                │                │                │
     │ Open WebView/  │                │                │
     │ Browser        │                │                │
     │────────────────────────────────▶│                │
     │                │                │                │
     │                │   User grants  │                │
     │                │   permission   │                │
     │                │◀──────────────▶│                │
     │                │                │                │
     │                │  Redirect to   │                │
     │                │  callback URL  │                │
     │◀───────────────────────────────│                │
     │                │                │                │
     │ Deep link:     │                │                │
     │ heallog://     │                │                │
     │ google-contacts│                │                │
     │ /callback?     │                │                │
     │ code=X&state=Y │                │                │
     │────────────────────────────────────────────────▶│
     │                │                │                │
     │                │ POST /callback │                │
     │                │ code=X,state=Y │                │
     │                │◀───────────────────────────────│
     │                │                │                │
     │                │ Exchange code  │                │
     │                │───────────────▶│                │
     │                │                │                │
     │                │ tokens         │                │
     │                │◀───────────────│                │
     │                │                │                │
     │                │ Store tokens   │                │
     │                │ in User doc    │                │
     │                │                │                │
     │                │ {success: true}│                │
     │                │───────────────────────────────▶│
     │                │                │                │
     │ Navigate to    │                │                │
     │ sync screen    │                │                │
     │◀───────────────────────────────────────────────│
     │                │                │                │
```

### 3.4 Sync Process Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SYNC JOB EXECUTION                                  │
└─────────────────────────────────────────────────────────────────────────────┘

1. POST /sync triggered
   ├── Create SyncJob record (status: pending)
   ├── Return job_id immediately (async processing)
   └── Background task starts

2. Background Task:
   ┌──────────────────────────────────────────────────────────────────────────┐
   │ PHASE 1: FETCH CONTACTS                                                  │
   │                                                                          │
   │  ┌─────────┐     ┌─────────┐     ┌─────────┐                            │
   │  │ Refresh │────▶│  Fetch  │────▶│ Paginate│                            │
   │  │ Token   │     │ Page 1  │     │ (100/pg)│                            │
   │  │ if exp  │     │         │     │         │                            │
   │  └─────────┘     └─────────┘     └─────────┘                            │
   │                                                                          │
   │  - Use sync_token for incremental sync                                   │
   │  - Handle 429 rate limits with exponential backoff                       │
   │  - Check cancel_requested between pages                                  │
   └──────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────────┐
   │ PHASE 2: NORMALIZE & PROCESS                                             │
   │                                                                          │
   │  For each Google contact:                                                │
   │  ┌─────────────────────────────────────────────────────────────────────┐│
   │  │ 1. Normalize phone numbers to E.164                                 ││
   │  │ 2. Map to Patient schema (handle missing fields)                    ││
   │  │ 3. Find existing patient by external_id (exact match)               ││
   │  │    └── If found AND not locally modified: UPDATE                    ││
   │  │    └── If found AND locally modified: CONFLICT                      ││
   │  │ 4. If no external_id match, run duplicate detection                 ││
   │  │    └── Check phone (normalized) - high confidence                   ││
   │  │    └── Check email - high confidence                                ││
   │  │    └── Check name (fuzzy) - lower confidence                        ││
   │  │ 5. If duplicates found: CREATE DuplicateRecord                      ││
   │  │ 6. If no duplicates: CREATE new Patient                             ││
   │  └─────────────────────────────────────────────────────────────────────┘│
   └──────────────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────────────┐
   │ PHASE 3: FINALIZE                                                        │
   │                                                                          │
   │  - Store new sync_token for next incremental sync                        │
   │  - Update SyncJob status to completed/failed                             │
   │  - Record metrics (created, updated, duplicates)                         │
   └──────────────────────────────────────────────────────────────────────────┘

3. Frontend polls /sync-status/{job_id}
   └── Returns progress, duplicates count, etc.

4. User resolves duplicates via /duplicates endpoints
   └── Merge UI presents options for each duplicate
```

### 3.5 Phone Number Normalization

```python
def normalize_phone(phone_str: str) -> str:
    """
    Normalize phone number to E.164 format.

    Examples:
    - "(555) 123-4567" -> "+15551234567" (assumes US)
    - "+91 98765 43210" -> "+919876543210" (India)
    - "9876543210" -> "+919876543210" (assumes India for 10-digit)

    Strategy:
    1. Strip all non-digit characters except leading +
    2. If starts with +, validate country code
    3. If 10 digits and starts with 6-9, assume India (+91)
    4. If 10 digits and starts with other, assume US (+1)
    5. If 11 digits starting with 1, assume US
    6. Store original if cannot normalize
    """
```

### 3.6 Duplicate Detection Algorithm

```python
def find_duplicate_patients(
    incoming_contact: GoogleContact,
    existing_patients: List[Patient],
    user_id: str
) -> List[DuplicateMatch]:
    """
    Returns list of potential duplicates with confidence scores.

    Confidence Levels:
    - 1.0: Exact phone match (normalized)
    - 0.95: Exact email match
    - 0.8: Phone matches without country code
    - 0.7: Fuzzy name match (Levenshtein > 0.85) + partial phone
    - 0.5: Fuzzy name match only

    Returns empty list if no matches above 0.5 confidence.
    """
```

---

## 4. Frontend Implementation Plan

### 4.1 New Files Structure

```
frontend/
├── app/
│   └── google-contacts-sync.tsx          # Main sync screen
├── components/
│   └── google-contacts/
│       ├── ConnectGoogleButton.tsx       # OAuth trigger button
│       ├── SyncProgressView.tsx          # Progress indicators
│       ├── DuplicateCard.tsx             # Swipeable duplicate card
│       ├── DuplicateMergeModal.tsx       # Detailed merge view
│       └── SyncResultsSummary.tsx        # Final results display
├── services/
│   └── googleContactsService.ts          # API client
├── hooks/
│   ├── useGoogleContactsSync.ts          # Main sync hook
│   └── useOfflineQueue.ts                # Generic offline queue
├── store/
│   └── slices/
│       └── googleContactsSlice.ts        # Zustand slice
└── types/
    └── googleContacts.ts                 # TypeScript interfaces
```

### 4.2 State Management (Zustand Slice)

```typescript
interface GoogleContactsSyncState {
  // Connection state
  isConnected: boolean;
  connectionChecked: boolean;

  // Sync state
  syncStatus: 'idle' | 'connecting' | 'syncing' | 'resolving_duplicates' | 'completed' | 'failed' | 'queued_offline';
  currentJobId: string | null;

  // Progress
  progress: {
    total: number;
    processed: number;
    created: number;
    updated: number;
    skipped: number;
  };

  // Duplicates
  pendingDuplicates: DuplicateRecord[];

  // Error state
  error: string | null;

  // Actions
  setConnected: (connected: boolean) => void;
  startSync: () => void;
  updateProgress: (progress: Partial<GoogleContactsSyncState['progress']>) => void;
  setPendingDuplicates: (duplicates: DuplicateRecord[]) => void;
  resolveDuplicate: (id: string, resolution: ResolutionType) => void;
  reset: () => void;
}
```

### 4.3 Hook Design: useGoogleContactsSync

```typescript
function useGoogleContactsSync() {
  // Returns:
  return {
    // State
    isConnected,
    syncStatus,
    progress,
    pendingDuplicates,
    error,

    // Actions
    connect: () => void,           // Opens OAuth flow
    disconnect: () => void,        // Removes Google connection
    startSync: () => void,         // Triggers sync
    cancelSync: () => void,        // Cancels running sync
    resolveDuplicate: (id, resolution) => void,
    batchResolve: (resolutions) => void,
    refresh: () => void,           // Manual re-sync

    // Helpers
    isLoading,
    canSync,
    hasPendingDuplicates,
  };
}
```

### 4.4 Deep Linking Setup

```typescript
// app.json / app.config.js
{
  "expo": {
    "scheme": "heallog",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "heallog",
              "host": "google-contacts",
              "pathPrefix": "/callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}

// Handle deep link in app
Linking.addEventListener('url', (event) => {
  const { url } = event;
  if (url.startsWith('heallog://google-contacts/callback')) {
    // Extract code and state from URL
    // Call callback endpoint
    // Navigate to sync screen
  }
});
```

### 4.5 UI Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GOOGLE CONTACTS SYNC SCREEN                          │
└─────────────────────────────────────────────────────────────────────────────┘

STATE: Not Connected
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Google Icon]                                                       │   │
│  │                                                                      │   │
│  │  Import contacts from your Google account                            │   │
│  │  to add them as patients                                             │   │
│  │                                                                      │   │
│  │  [ Connect Google Account ]                                          │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

STATE: Syncing
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Syncing contacts...                                                 │   │
│  │                                                                      │   │
│  │  [=============================                    ] 67%             │   │
│  │                                                                      │   │
│  │  Processing 134 of 200 contacts                                      │   │
│  │  Created: 45  |  Updated: 12  |  Duplicates: 8                       │   │
│  │                                                                      │   │
│  │  [ Cancel Sync ]                                                     │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

STATE: Resolving Duplicates
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Review Duplicates (8)                                   [Skip All]  │   │
│  │                                                                      │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  INCOMING (Google)          EXISTING (Patient)               │  │   │
│  │  │  ─────────────────          ──────────────────               │  │   │
│  │  │  John Smith                 John D. Smith                    │  │   │
│  │  │  +1 555-123-4567            +1 555-123-4567                  │  │   │
│  │  │  john@gmail.com             jsmith@work.com                  │  │   │
│  │  │                                                               │  │   │
│  │  │  Confidence: 95% (exact phone match)                          │  │   │
│  │  │                                                               │  │   │
│  │  │  [Keep Existing] [Replace] [Merge] [Create New]               │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  │  < Swipe for more >                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

STATE: Completed
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Checkmark Icon]                                                    │   │
│  │                                                                      │   │
│  │  Sync Complete!                                                      │   │
│  │                                                                      │   │
│  │  ┌────────────────┬────────────────┬────────────────┐               │   │
│  │  │   45 New       │   12 Updated   │   8 Merged     │               │   │
│  │  │   Patients     │   Patients     │   Duplicates   │               │   │
│  │  └────────────────┴────────────────┴────────────────┘               │   │
│  │                                                                      │   │
│  │  Last synced: Just now                                               │   │
│  │                                                                      │   │
│  │  [ Sync Again ]   [ View Patients ]                                  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

STATE: Queued Offline
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [Cloud Offline Icon]                                                │   │
│  │                                                                      │   │
│  │  Sync queued for when you're back online                             │   │
│  │                                                                      │   │
│  │  Your sync will automatically resume once internet                   │   │
│  │  connection is restored.                                             │   │
│  │                                                                      │   │
│  │  [ Cancel Queued Sync ]                                              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Offline Support Strategy

### 5.1 Offline Queue Architecture

```typescript
// Generic offline queue that can be reused for other integrations

interface OfflineJob {
  id: string;
  type: 'google_contacts_sync' | 'other_integration';
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

class OfflineQueueService {
  // Queue a job for later execution
  async enqueue(type: string, payload: object): Promise<string>;

  // Process pending jobs (called when network comes back)
  async processQueue(): Promise<void>;

  // Cancel a pending job
  async cancel(jobId: string): Promise<void>;

  // Get queue status
  async getStatus(): Promise<{pending: number; processing: number}>;
}
```

### 5.2 Network State Detection

```typescript
// Use @react-native-community/netinfo
import NetInfo from '@react-native-community/netinfo';

// Listen for network changes
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    // Process offline queue
    offlineQueueService.processQueue();
  }
});
```

### 5.3 Conflict Resolution Strategy

When user edits a patient locally while sync is queued:

```
SCENARIO: User imports contact, goes offline, edits patient name, comes back online

1. Check last_synced_at vs local_modified_at
2. If local_modified_at > last_synced_at:
   - LOCAL WINS by default (user's edit takes precedence)
   - Log the conflict for debugging
3. If they're equal or last_synced_at is newer:
   - SYNC WINS (apply incoming changes)
```

---

## 6. Edge Cases & Error Handling

### 6.1 Google API Errors

| Error | Response Code | Handling |
|-------|---------------|----------|
| Rate limited | 429 | Exponential backoff (1s, 2s, 4s, 8s, max 60s) |
| Token expired | 401 | Auto-refresh token, retry once |
| Invalid token | 401 (after refresh) | Prompt user to re-authenticate |
| Quota exceeded | 403 | Show error, suggest retry in 24h |
| Network error | N/A | Queue for offline retry |

### 6.2 Data Edge Cases

| Scenario | Handling |
|----------|----------|
| Contact has no name | Use phone number as name, flag for review |
| Contact has no phone or email | Skip with warning log |
| Multiple phone numbers | Use first mobile, fallback to first any |
| Phone format unrecognizable | Store original, skip normalization |
| Contact has photo | Fetch and convert to base64, apply size limit (100KB) |
| Contact deleted in Google | Mark patient `source` as 'google_deleted', keep data |
| Duplicate with same confidence | Present both options, let user choose |

### 6.3 Security Considerations

1. **Token Storage**: Encrypt OAuth tokens at rest in MongoDB
2. **Token Refresh**: Refresh before expiry (5 min buffer)
3. **Scope Minimization**: Request only `contacts.readonly`
4. **State Parameter**: Use HMAC-signed state to prevent CSRF
5. **Rate Limiting**: 10 sync requests per hour per user

---

## 7. Implementation Order

### Phase 1: Backend Foundation (Days 1-2)
1. Add fields to User and Patient models
2. Create GoogleContactsSyncJob and DuplicateRecord models
3. Implement Google OAuth service
4. Implement Google Contacts fetch service
5. Create base API endpoints (auth-url, callback)

### Phase 2: Sync Logic (Days 3-4)
1. Implement phone normalization
2. Implement duplicate detection algorithm
3. Build sync orchestration service
4. Create sync and sync-status endpoints
5. Implement merge strategies

### Phase 3: Frontend Core (Days 5-6)
1. Add TypeScript interfaces
2. Create Zustand slice
3. Implement GoogleContactsService
4. Build useGoogleContactsSync hook
5. Set up deep linking

### Phase 4: UI Components (Days 7-8)
1. Create google-contacts-sync.tsx screen
2. Build ConnectGoogleButton component
3. Build SyncProgressView component
4. Build DuplicateCard with swipe gestures
5. Build SyncResultsSummary

### Phase 5: Offline Support (Day 9)
1. Implement OfflineQueueService
2. Create useOfflineQueue hook
3. Add network state listeners
4. Test offline scenarios

### Phase 6: Polish & Testing (Day 10)
1. Add haptic feedback
2. Implement error toasts
3. Add loading states
4. Write integration tests
5. Documentation

---

## 8. Environment Variables Required

### Backend (.env)
```
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://api.heallog.com/api/integrations/google-contacts/callback

# For mobile deep link callback
MOBILE_DEEP_LINK_SCHEME=heallog
MOBILE_CALLBACK_PATH=google-contacts/callback
```

### Frontend (app.config.js)
```javascript
{
  extra: {
    googleContactsCallbackScheme: 'heallog',
  }
}
```

### Google Cloud Console Setup
1. Create OAuth 2.0 credentials (Web application type)
2. Add authorized redirect URIs:
   - `https://api.heallog.com/api/integrations/google-contacts/callback`
3. Enable Google People API
4. Configure OAuth consent screen with `contacts.readonly` scope

---

## 9. Testing Strategy

### Unit Tests
- Phone normalization function
- Duplicate detection algorithm
- Merge strategy functions
- State management actions

### Integration Tests
- OAuth flow (mock Google responses)
- Sync job execution
- Duplicate resolution flow
- Offline queue processing

### E2E Tests
- Full sync flow on device
- Offline queue behavior
- Deep link handling

---

## 10. Success Metrics

1. **Sync Success Rate**: >98% of sync jobs complete successfully
2. **Duplicate Accuracy**: >90% of auto-detected duplicates are true matches
3. **Sync Performance**: Process 1000 contacts in <30 seconds
4. **Offline Recovery**: 100% of queued jobs process within 5 minutes of reconnection

---

## 11. Future Enhancements (Out of Scope)

1. **Bi-directional Sync**: Push patient changes back to Google Contacts
2. **Photo Sync**: Import contact photos as patient photos
3. **Group Mapping**: Map Google contact groups to patient groups
4. **Undo Sync**: Revert last sync operation
5. **Scheduled Sync**: Auto-sync daily/weekly
6. **Other Providers**: iCloud Contacts, Microsoft Outlook

---

## Document Revision

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-04 | Claude | Initial draft |
