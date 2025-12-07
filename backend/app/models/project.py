"""Project and task models for annotation workflows."""

import enum
import uuid
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Integer, Boolean, Enum, ForeignKey, Text, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import Base, TimestampMixin


class ProjectStatus(str, enum.Enum):
    """Project lifecycle status."""

    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class AnnotationType(str, enum.Enum):
    """Types of annotation tasks supported."""

    NER = "ner"  # Named Entity Recognition
    SENTIMENT = "sentiment"
    CLASSIFICATION = "classification"
    TRANSLATION = "translation"
    TRANSCRIPTION = "transcription"  # Audio to text
    SPAN_LABELING = "span_labeling"
    RELATION_EXTRACTION = "relation_extraction"
    QA = "qa"  # Question answering
    SUMMARIZATION = "summarization"
    RLHF = "rlhf"  # Reinforcement Learning from Human Feedback


class TaskStatus(str, enum.Enum):
    """Individual task status."""

    AVAILABLE = "available"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class Project(Base, TimestampMixin):
    """Annotation project created by a client.

    A project contains multiple tasks of the same type and language.
    Clients pay per-task, and the platform matches annotators.
    """

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # Project details
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    language_code: Mapped[str] = mapped_column(
        String(10),
        ForeignKey("languages.code"),
        nullable=False,
    )
    annotation_type: Mapped[AnnotationType] = mapped_column(
        Enum(AnnotationType),
        nullable=False,
    )
    status: Mapped[ProjectStatus] = mapped_column(
        Enum(ProjectStatus),
        default=ProjectStatus.DRAFT,
        nullable=False,
    )

    # Instructions for annotators
    instructions: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    guidelines_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Label configuration (for NER, classification, etc.)
    label_config: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
    )

    # Pricing
    price_per_task: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    estimated_time_per_task: Mapped[Optional[int]] = mapped_column(
        Integer,  # in seconds
        nullable=True,
    )

    # Progress tracking
    total_tasks: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    completed_tasks: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Quality settings
    min_annotators_per_task: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    require_native_speakers: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    min_annotator_rating: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )

    # Deadlines
    deadline: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Label Studio integration
    label_studio_project_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # Relationships
    tasks: Mapped[list["Task"]] = relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Project {self.name} ({self.status})>"

    @property
    def progress_percentage(self) -> float:
        """Calculate project completion percentage."""
        if self.total_tasks == 0:
            return 0.0
        return (self.completed_tasks / self.total_tasks) * 100


class Task(Base, TimestampMixin):
    """Individual annotation task within a project.

    Each task represents one piece of data to annotate.
    """

    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id"),
        nullable=False,
    )

    # Task data
    data: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )
    status: Mapped[TaskStatus] = mapped_column(
        Enum(TaskStatus),
        default=TaskStatus.AVAILABLE,
        nullable=False,
    )

    # Assignment
    assigned_to: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("annotators.id"),
        nullable=True,
    )
    assigned_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Completion
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    time_spent: Mapped[Optional[int]] = mapped_column(
        Integer,  # in seconds
        nullable=True,
    )

    # Label Studio integration
    label_studio_task_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # Relationships
    project: Mapped["Project"] = relationship(
        "Project",
        back_populates="tasks",
    )
    annotations: Mapped[list["Annotation"]] = relationship(
        "Annotation",
        back_populates="task",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Task {self.id} ({self.status})>"


class Annotation(Base, TimestampMixin):
    """Annotation result for a task.

    Multiple annotations can exist per task for consensus scoring.
    """

    __tablename__ = "annotations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id"),
        nullable=False,
    )
    annotator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("annotators.id"),
        nullable=False,
    )

    # Annotation result (structure depends on annotation type)
    result: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    # Quality metrics
    is_approved: Mapped[Optional[bool]] = mapped_column(
        Boolean,
        nullable=True,
    )
    quality_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
    )
    reviewer_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    # Payment tracking
    payment_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    is_paid: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # Label Studio integration
    label_studio_annotation_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
    )

    # Relationships
    task: Mapped["Task"] = relationship(
        "Task",
        back_populates="annotations",
    )

    def __repr__(self) -> str:
        return f"<Annotation {self.id}>"
