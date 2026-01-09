from pydantic import BaseModel, Field
from datetime import datetime, timezone
from typing import Optional, Literal
import uuid
from beanie import Document, Indexed


class SyncEvent(Document):
    """
    Tracks sync events with detailed metrics for monitoring and debugging.

    Attributes:
        user_id: The user who initiated the sync
        success: Whether the sync completed successfully
        duration_ms: Time taken for the sync operation in milliseconds
        records_synced: Total number of records processed (created + updated + deleted)
        conflict_count: Number of conflicts encountered during sync
        sync_mode: Type of sync operation ('pull', 'push', 'batched_pull')
        error_message: Error details if sync failed (only populated on failure)
        created_at: Timestamp when the sync event was recorded
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    user_id: Indexed(str)
    success: bool
    duration_ms: Optional[int] = Field(default=None, description="Sync duration in milliseconds")
    records_synced: Optional[int] = Field(default=None, description="Total records processed")
    conflict_count: Optional[int] = Field(default=0, description="Number of conflicts encountered")
    sync_mode: Optional[Literal["pull", "push", "batched_pull"]] = Field(default=None, description="Type of sync operation")
    error_message: Optional[str] = Field(default=None, description="Error details if sync failed")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "sync_events"
