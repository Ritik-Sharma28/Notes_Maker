import uuid
from sqlalchemy import ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base, UUIDMixin, TimestampMixin

class Note(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "notes"

    topic_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), unique=True, nullable=False)
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    diagrams: Mapped[list] = mapped_column(JSONB, server_default='[]')
    version: Mapped[int] = mapped_column(Integer, default=1)
