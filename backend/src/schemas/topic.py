from pydantic import BaseModel
import uuid
from datetime import datetime

class TopicResponse(BaseModel):
    id: uuid.UUID
    title: str
    parent_topic_id: uuid.UUID | None
    is_dirty: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
