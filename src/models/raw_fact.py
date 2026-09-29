import uuid
from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, UUIDMixin, TimestampMixin

class RawFact(Base, UUIDMixin):
    __tablename__ = "raw_facts"

    topic_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sources.id", ondelete="CASCADE"), nullable=False)
    angle: Mapped[str | None] = mapped_column(String, nullable=True)
    fact_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # We only need created_at, which is in a different mixin or we can just redefine here or inherit TimestampMixin.
    # We'll just inherit TimestampMixin, which gives updated_at as well, that's fine.
