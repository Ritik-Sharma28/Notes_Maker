import uuid
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base, UUIDMixin, TimestampMixin


class ComparisonTable(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "comparison_tables"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("auth.users", ondelete="CASCADE"), nullable=False
    )
    topic_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )
    source_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("sources.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    rows: Mapped[list] = mapped_column(JSONB, nullable=False)
