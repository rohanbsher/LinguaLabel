"""Annotator models for the marketplace."""

import enum
import uuid
from typing import Optional
from sqlalchemy import String, Float, Integer, Boolean, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from .base import Base, TimestampMixin


class AnnotatorStatus(str, enum.Enum):
    """Annotator account status."""

    PENDING = "pending"  # Just registered, needs approval
    TESTING = "testing"  # Taking qualification tests
    APPROVED = "approved"  # Passed tests, ready to work
    ACTIVE = "active"  # Currently working on projects
    INACTIVE = "inactive"  # Temporarily not working
    SUSPENDED = "suspended"  # Account suspended for quality issues


class ProficiencyLevel(str, enum.Enum):
    """Language proficiency levels."""

    NATIVE = "native"
    FLUENT = "fluent"
    ADVANCED = "advanced"
    INTERMEDIATE = "intermediate"


class Annotator(Base, TimestampMixin):
    """Annotator profile in the marketplace.

    This extends the base User model with annotator-specific information
    like language skills, qualifications, and performance metrics.
    """

    __tablename__ = "annotators"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        unique=True,
    )
    status: Mapped[AnnotatorStatus] = mapped_column(
        Enum(AnnotatorStatus),
        default=AnnotatorStatus.PENDING,
        nullable=False,
    )

    # Profile information
    country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )
    timezone: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Performance metrics
    rating: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    tasks_completed: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    accuracy_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    # Earnings tracking
    total_earnings: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )
    pending_earnings: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    # Payment information
    stripe_account_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
    )
    payment_method: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )

    # Preferences
    available_hours_per_week: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )
    preferred_task_types: Mapped[Optional[list]] = mapped_column(
        ARRAY(String),
        nullable=True,
    )

    # Relationships
    language_skills: Mapped[list["LanguageSkill"]] = relationship(
        "LanguageSkill",
        back_populates="annotator",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Annotator {self.id} ({self.status})>"


class LanguageSkill(Base, TimestampMixin):
    """Language proficiency for an annotator.

    Each annotator can have multiple language skills with different
    proficiency levels. Native speakers get priority for tasks.
    """

    __tablename__ = "language_skills"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    annotator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("annotators.id"),
        nullable=False,
    )
    language_code: Mapped[str] = mapped_column(
        String(10),
        ForeignKey("languages.code"),
        nullable=False,
    )
    proficiency: Mapped[ProficiencyLevel] = mapped_column(
        Enum(ProficiencyLevel),
        nullable=False,
    )
    is_native: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Qualification tracking
    is_qualified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    qualification_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    tasks_in_language: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    annotator: Mapped["Annotator"] = relationship(
        "Annotator",
        back_populates="language_skills",
    )

    def __repr__(self) -> str:
        return f"<LanguageSkill {self.language_code}: {self.proficiency}>"
