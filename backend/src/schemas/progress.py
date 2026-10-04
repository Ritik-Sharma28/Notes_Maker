"""Schemas for progress tracking."""
from pydantic import BaseModel
import uuid
from datetime import datetime


class ProgressResponse(BaseModel):
    """Progress response schema."""
    source_id: uuid.UUID
    current_agent: str
    current_step: str | None
    percentage: int
    message: str | None
    error_message: str | None
    retry_count: int
    updated_at: datetime

    class Config:
        from_attributes = True
