"""User models for authentication and authorization."""

import enum
import uuid
from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """User roles in the system."""

    ADMIN = "admin"
    CLIENT = "client"  # AI companies who create projects
    ANNOTATOR = "annotator"  # People who do the annotation work
    REVIEWER = "reviewer"  # Expert reviewers for quality control


class User(Base, TimestampMixin):
    """User account model."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.ANNOTATOR,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
