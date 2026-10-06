import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID


class UserRole(str, Enum):
    """User roles for access control."""
    ADMIN = "admin"
    REGULAR = "regular"


class Base(DeclarativeBase):
    pass

from sqlalchemy import Table, Column
from sqlalchemy.dialects.postgresql import UUID

# Define a stub for auth.users so SQLAlchemy knows about it for ForeignKeys
Table(
    "users",
    Base.metadata,
    Column("id", UUID(as_uuid=True), primary_key=True),
    schema="auth",
)

class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4, 
        server_default=func.gen_random_uuid()
    )

class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), 
        onupdate=func.now()
    )
