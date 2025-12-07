"""Pydantic schemas for project-related API operations."""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    """Base schema for project data."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    language_code: str = Field(..., min_length=2, max_length=10)
    annotation_type: str = Field(..., min_length=1)
    instructions: str = Field(..., min_length=1)
    price_per_task: float = Field(..., gt=0)
    estimated_time_per_task: Optional[int] = None
    min_annotators_per_task: int = Field(default=1, ge=1)
    require_native_speakers: bool = True
    min_annotator_rating: Optional[float] = Field(default=None, ge=0, le=5)
    deadline: Optional[datetime] = None


class ProjectCreate(ProjectBase):
    """Schema for creating a new project."""

    label_config: Optional[dict] = None
    custom_labels: Optional[list[str]] = None


class ProjectUpdate(BaseModel):
    """Schema for updating an existing project."""

    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, min_length=1)
    instructions: Optional[str] = None
    price_per_task: Optional[float] = Field(default=None, gt=0)
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    min_annotators_per_task: Optional[int] = Field(default=None, ge=1)


class ProjectResponse(ProjectBase):
    """Schema for project response."""

    id: UUID
    client_id: UUID
    status: str
    total_tasks: int
    completed_tasks: int
    label_studio_project_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    """Schema for list of projects."""

    projects: list[ProjectResponse]
    total: int


class TaskBase(BaseModel):
    """Base schema for task data."""

    data: dict = Field(..., description="Task data (e.g., text, audio URL)")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""

    pass


class TaskBulkCreate(BaseModel):
    """Schema for bulk task creation."""

    tasks: list[TaskCreate] = Field(..., min_length=1)


class TaskResponse(BaseModel):
    """Schema for task response."""

    id: UUID
    project_id: UUID
    data: dict
    status: str
    assigned_to: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    time_spent: Optional[int] = None
    label_studio_task_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    """Schema for list of tasks."""

    tasks: list[TaskResponse]
    total: int


class AnnotationCreate(BaseModel):
    """Schema for creating an annotation."""

    result: dict = Field(..., description="Annotation result data")


class AnnotationResponse(BaseModel):
    """Schema for annotation response."""

    id: UUID
    task_id: UUID
    annotator_id: UUID
    result: dict
    is_approved: Optional[bool] = None
    quality_score: Optional[float] = None
    reviewer_notes: Optional[str] = None
    payment_amount: float
    is_paid: bool
    label_studio_annotation_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LabelStudioSyncRequest(BaseModel):
    """Schema for Label Studio sync request."""

    sync_annotations: bool = True


class LabelStudioSyncResponse(BaseModel):
    """Schema for Label Studio sync response."""

    label_studio_project_id: Optional[int] = None
    label_studio_url: Optional[str] = None
    synced_tasks: int = 0
    synced_annotations: int = 0
    is_available: bool = False
    message: str
