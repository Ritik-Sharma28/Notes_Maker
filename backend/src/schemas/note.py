from pydantic import BaseModel
import uuid
from datetime import datetime

class NoteResponse(BaseModel):
    id: uuid.UUID
    topic_id: uuid.UUID
    content_markdown: str
    diagrams: list[dict]
    version: int
    updated_at: datetime

    class Config:
        from_attributes = True

class NoteVersionResponse(BaseModel):
    id: uuid.UUID
    version: int
    content_markdown: str
    created_at: datetime

    class Config:
        from_attributes = True
