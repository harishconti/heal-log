from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid
from beanie import Document

class QueryPerformanceEvent(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    query: str
    execution_time: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "query_performance_events"
