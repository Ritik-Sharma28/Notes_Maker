import uuid
from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from .base import Base, UUIDMixin, TimestampMixin
from src.config.settings import settings

class Topic(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "topics"

    title: Mapped[str] = mapped_column(String, nullable=False)
    parent_topic_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(settings.EMBEDDING_DIMENSION))
    is_dirty: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # children = relationship("Topic")
