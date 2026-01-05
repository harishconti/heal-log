from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
from enum import Enum
from beanie import Document, Indexed
from pymongo import IndexModel


class SyncJobStatus(str, Enum):
    """Status of a Google Contacts sync job."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class SyncJobType(str, Enum):
    """Type of sync job."""
    INITIAL = "initial"
    INCREMENTAL = "incremental"


class DuplicateResolution(str, Enum):
    """Resolution options for duplicate records."""
    KEEP_EXISTING = "keep_existing"
    REPLACE = "replace"
    MERGE = "merge"
    CREATE_NEW = "create_new"


class DuplicateStatus(str, Enum):
    """Status of a duplicate record."""
    PENDING = "pending"
    RESOLVED = "resolved"
    SKIPPED = "skipped"


class DuplicateMatch(BaseModel):
    """Represents a potential duplicate match with an existing patient."""
    patient_id: str
    patient_name: str
    patient_phone: Optional[str] = None
    patient_email: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    match_reasons: List[str] = Field(default_factory=list)


class GoogleContactsSyncJob(Document):
    """Tracks individual sync job progress and results."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: Indexed(str)
    status: SyncJobStatus = SyncJobStatus.PENDING
    job_type: SyncJobType = SyncJobType.INITIAL

    # Progress tracking
    total_contacts: int = 0
    processed_contacts: int = 0
    created_patients: int = 0
    updated_patients: int = 0
    skipped_contacts: int = 0

    # Duplicate handling
    duplicates_found: int = 0
    duplicates_resolved: int = 0
    pending_duplicates: List[str] = Field(default_factory=list)

    # Sync metadata
    google_sync_token: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    # Cancellation support
    cancel_requested: bool = False

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "google_contacts_sync_jobs"
        indexes = [
            IndexModel([("user_id", 1), ("created_at", -1)]),
            IndexModel([("user_id", 1), ("status", 1)])
        ]

    async def save(self, *args, **kwargs):
        self.updated_at = datetime.now(timezone.utc)
        await super().save(*args, **kwargs)


class DuplicateRecord(Document):
    """Stores pending duplicate decisions for user review."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    sync_job_id: Indexed(str)
    user_id: Indexed(str)

    # The incoming Google contact (raw data)
    google_contact: Dict[str, Any] = Field(default_factory=dict)

    # Matched existing patient(s)
    matched_patients: List[DuplicateMatch] = Field(default_factory=list)

    # Resolution
    status: DuplicateStatus = DuplicateStatus.PENDING
    resolution: Optional[DuplicateResolution] = None
    resolved_patient_id: Optional[str] = None
    resolved_at: Optional[datetime] = None

    # Confidence metrics
    highest_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    match_reasons: List[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "duplicate_records"
        indexes = [
            IndexModel([("sync_job_id", 1)]),
            IndexModel([("user_id", 1), ("status", 1)]),
            IndexModel([("user_id", 1), ("created_at", -1)])
        ]


# Request/Response schemas for API endpoints

class SyncJobCreate(BaseModel):
    """Request to create a new sync job."""
    job_type: SyncJobType = SyncJobType.INITIAL


class SyncJobProgress(BaseModel):
    """Progress update for a sync job."""
    id: str
    status: SyncJobStatus
    job_type: SyncJobType
    total_contacts: int
    processed_contacts: int
    created_patients: int
    updated_patients: int
    skipped_contacts: int
    duplicates_found: int
    duplicates_resolved: int
    pending_duplicates_count: int
    progress_percentage: float
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str]

    @classmethod
    def from_job(cls, job: GoogleContactsSyncJob) -> "SyncJobProgress":
        progress = 0.0
        if job.total_contacts > 0:
            progress = (job.processed_contacts / job.total_contacts) * 100
        return cls(
            id=job.id,
            status=job.status,
            job_type=job.job_type,
            total_contacts=job.total_contacts,
            processed_contacts=job.processed_contacts,
            created_patients=job.created_patients,
            updated_patients=job.updated_patients,
            skipped_contacts=job.skipped_contacts,
            duplicates_found=job.duplicates_found,
            duplicates_resolved=job.duplicates_resolved,
            pending_duplicates_count=len(job.pending_duplicates),
            progress_percentage=progress,
            started_at=job.started_at,
            completed_at=job.completed_at,
            error_message=job.error_message
        )


class DuplicateRecordResponse(BaseModel):
    """Response for a duplicate record."""
    id: str
    sync_job_id: str
    google_contact: Dict[str, Any]
    matched_patients: List[DuplicateMatch]
    status: DuplicateStatus
    resolution: Optional[DuplicateResolution]
    resolved_patient_id: Optional[str]
    highest_confidence: float
    match_reasons: List[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ResolveDuplicateRequest(BaseModel):
    """Request to resolve a duplicate."""
    resolution: DuplicateResolution
    merge_fields: Optional[Dict[str, str]] = None  # For merge resolution: field -> source (google|existing)


class BatchResolveDuplicatesRequest(BaseModel):
    """Request to resolve multiple duplicates."""
    resolutions: List[Dict[str, Any]]  # [{id: str, resolution: str, merge_fields?: Dict}]


class GoogleContactsConnectionStatus(BaseModel):
    """Status of Google Contacts connection."""
    is_connected: bool
    connected_at: Optional[datetime] = None
    last_sync_at: Optional[datetime] = None
    total_synced_patients: int = 0
