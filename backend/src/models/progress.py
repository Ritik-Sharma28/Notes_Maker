import uuid
from sqlalchemy import String, Text, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base, UUIDMixin, TimestampMixin


class Progress(Base, UUIDMixin, TimestampMixin):
    """Progress tracking model for pipeline execution."""
    __tablename__ = "progress"

    source_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("sources.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("auth.users", ondelete="CASCADE"), nullable=False
    )
    current_agent: Mapped[str] = mapped_column(String(50), nullable=False)
    current_step: Mapped[str | None] = mapped_column(String(100), nullable=True)
    percentage: Mapped[int] = mapped_column(Integer, default=0)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    last_agent_state: Mapped[dict] = mapped_column(JSONB, nullable=True)
    user_role: Mapped[str] = mapped_column(String(20), default="regular")
