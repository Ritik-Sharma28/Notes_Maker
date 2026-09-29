from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB
from .base import Base, UUIDMixin, TimestampMixin

class Source(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "sources"

    platform: Mapped[str] = mapped_column(String, nullable=False)
    share_url: Mapped[str | None] = mapped_column(String, nullable=True)
    raw_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String, default="pending")
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)
