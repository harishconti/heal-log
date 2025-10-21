from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid
from beanie import Document as BeanieDocument, Indexed

class Document(BeanieDocument):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: Indexed(str)
    user_id: Indexed(str)
    file_name: str = Field(..., description="The name of the uploaded file.")
    storage_url: str = Field(..., description="The URL of the file in cloud storage.")
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "documents"

class DocumentCreate(BaseModel):
    patient_id: str
    file_name: str
    storage_url: str

class DocumentResponse(BaseModel):
    id: str
    patient_id: str
    user_id: str
    file_name: str
    storage_url: str
    uploaded_at: datetime