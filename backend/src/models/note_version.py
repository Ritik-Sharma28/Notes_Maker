import uuid
from sqlalchemy import ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base, UUIDMixin, TimestampMixin


class NoteVersion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "note_versions"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("auth.users", ondelete="CASCADE"), nullable=False
    )
    note_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("notes.id", ondelete="CASCADE"), nullable=False
    )
    content_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    diagrams: Mapped[list] = mapped_column(JSONB, server_default='[]')
    version: Mapped[int] = mapped_column(Integer, nullable=False)
