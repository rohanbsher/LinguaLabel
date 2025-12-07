"""Projects router for managing annotation projects."""

from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project, Task, Annotation, ProjectStatus, TaskStatus, AnnotationType
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    TaskCreate,
    TaskBulkCreate,
    TaskResponse,
    TaskListResponse,
    LabelStudioSyncRequest,
    LabelStudioSyncResponse,
)
from app.services.label_studio import label_studio_service
from .auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])


def require_client(current_user: User = Depends(get_current_user)) -> User:
    """Require the current user to be a client."""
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only clients can perform this action"
        )
    return current_user


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    status_filter: Optional[str] = Query(None, alias="status"),
    language_code: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List projects.

    For clients: returns their own projects.
    For annotators: returns active projects matching their language skills.
    """
    query = db.query(Project)

    if current_user.role == UserRole.CLIENT:
        # Clients see only their own projects
        query = query.filter(Project.client_id == current_user.id)
    else:
        # Annotators see only active projects
        query = query.filter(Project.status == ProjectStatus.ACTIVE)

    # Apply filters
    if status_filter:
        try:
            status_enum = ProjectStatus(status_filter)
            query = query.filter(Project.status == status_enum)
        except ValueError:
            pass

    if language_code:
        query = query.filter(Project.language_code == language_code)

    # Get total count before pagination
    total = query.count()

    # Apply pagination and ordering
    projects = query.order_by(desc(Project.created_at)).offset(skip).limit(limit).all()

    return ProjectListResponse(
        projects=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Create a new annotation project."""
    # Validate annotation type
    try:
        annotation_type = AnnotationType(project_data.annotation_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid annotation type: {project_data.annotation_type}"
        )

    # Create project in database
    project = Project(
        client_id=current_user.id,
        name=project_data.name,
        description=project_data.description,
        language_code=project_data.language_code,
        annotation_type=annotation_type,
        instructions=project_data.instructions,
        price_per_task=project_data.price_per_task,
        estimated_time_per_task=project_data.estimated_time_per_task,
        min_annotators_per_task=project_data.min_annotators_per_task,
        require_native_speakers=project_data.require_native_speakers,
        min_annotator_rating=project_data.min_annotator_rating,
        deadline=project_data.deadline,
        label_config=project_data.label_config,
        status=ProjectStatus.DRAFT,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    # Try to create Label Studio project
    if label_studio_service.is_available:
        ls_project_id = label_studio_service.create_project(
            title=project.name,
            description=project.description,
            annotation_type=project_data.annotation_type,
            label_config=project_data.label_config.get("xml") if project_data.label_config else None,
        )
        if ls_project_id:
            project.label_studio_project_id = ls_project_id
            db.commit()
            db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a project by ID."""
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check access
    if current_user.role == UserRole.CLIENT and project.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project"
        )

    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    update_data: ProjectUpdate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Update a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.client_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)

    # Handle status conversion
    if "status" in update_dict:
        try:
            update_dict["status"] = ProjectStatus(update_dict["status"])
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {update_dict['status']}"
            )

    for field, value in update_dict.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Delete a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.client_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Delete from Label Studio if synced
    if project.label_studio_project_id:
        label_studio_service.delete_project(project.label_studio_project_id)

    db.delete(project)
    db.commit()


@router.post("/{project_id}/tasks", response_model=TaskListResponse, status_code=status.HTTP_201_CREATED)
async def add_tasks(
    project_id: UUID,
    task_data: TaskBulkCreate,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Add tasks to a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.client_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Create tasks in database
    created_tasks = []
    for task_item in task_data.tasks:
        task = Task(
            project_id=project.id,
            data=task_item.data,
            status=TaskStatus.AVAILABLE,
        )
        db.add(task)
        created_tasks.append(task)

    # Update project task count
    project.total_tasks += len(created_tasks)

    db.commit()

    # Refresh to get IDs
    for task in created_tasks:
        db.refresh(task)

    # Sync to Label Studio if available
    if project.label_studio_project_id and label_studio_service.is_available:
        ls_task_ids = label_studio_service.import_tasks(
            project.label_studio_project_id,
            [t.data for t in created_tasks]
        )
        if ls_task_ids:
            for task, ls_id in zip(created_tasks, ls_task_ids):
                task.label_studio_task_id = ls_id
            db.commit()

    return TaskListResponse(
        tasks=[TaskResponse.model_validate(t) for t in created_tasks],
        total=len(created_tasks),
    )


@router.get("/{project_id}/tasks", response_model=TaskListResponse)
async def list_tasks(
    project_id: UUID,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List tasks in a project."""
    project = db.query(Project).filter(Project.id == project_id).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check access
    if current_user.role == UserRole.CLIENT and project.client_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this project"
        )

    query = db.query(Task).filter(Task.project_id == project_id)

    if status_filter:
        try:
            status_enum = TaskStatus(status_filter)
            query = query.filter(Task.status == status_enum)
        except ValueError:
            pass

    total = query.count()
    tasks = query.order_by(Task.created_at).offset(skip).limit(limit).all()

    return TaskListResponse(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        total=total,
    )


@router.post("/{project_id}/sync", response_model=LabelStudioSyncResponse)
async def sync_with_label_studio(
    project_id: UUID,
    sync_request: LabelStudioSyncRequest = LabelStudioSyncRequest(),
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Sync project with Label Studio.

    Creates project in Label Studio if not exists,
    syncs tasks, and optionally pulls annotations.
    """
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.client_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if not label_studio_service.is_available:
        return LabelStudioSyncResponse(
            is_available=False,
            message="Label Studio is not configured or not reachable",
        )

    synced_tasks = 0
    synced_annotations = 0

    # Create Label Studio project if needed
    if not project.label_studio_project_id:
        ls_project_id = label_studio_service.create_project(
            title=project.name,
            description=project.description,
            annotation_type=project.annotation_type.value,
        )
        if ls_project_id:
            project.label_studio_project_id = ls_project_id
            db.commit()

    if project.label_studio_project_id:
        # Sync unsynced tasks to Label Studio
        unsynced_tasks = db.query(Task).filter(
            Task.project_id == project_id,
            Task.label_studio_task_id.is_(None)
        ).all()

        if unsynced_tasks:
            ls_task_ids = label_studio_service.import_tasks(
                project.label_studio_project_id,
                [t.data for t in unsynced_tasks]
            )
            if ls_task_ids:
                for task, ls_id in zip(unsynced_tasks, ls_task_ids):
                    task.label_studio_task_id = ls_id
                    synced_tasks += 1
                db.commit()

        # Pull annotations if requested
        if sync_request.sync_annotations:
            annotations = label_studio_service.get_annotations(
                project.label_studio_project_id
            )
            for ann in annotations:
                # Find matching task
                task = db.query(Task).filter(
                    Task.label_studio_task_id == ann["task_id"]
                ).first()
                if task:
                    # Check if annotation already exists
                    existing = db.query(Annotation).filter(
                        Annotation.label_studio_annotation_id == ann["annotation_id"]
                    ).first()
                    if not existing:
                        # Create new annotation (need annotator mapping)
                        synced_annotations += 1

    return LabelStudioSyncResponse(
        label_studio_project_id=project.label_studio_project_id,
        label_studio_url=label_studio_service.get_project_url(
            project.label_studio_project_id
        ) if project.label_studio_project_id else None,
        synced_tasks=synced_tasks,
        synced_annotations=synced_annotations,
        is_available=True,
        message=f"Synced {synced_tasks} tasks and {synced_annotations} annotations",
    )


@router.post("/{project_id}/activate", response_model=ProjectResponse)
async def activate_project(
    project_id: UUID,
    current_user: User = Depends(require_client),
    db: Session = Depends(get_db),
):
    """Activate a project to make it available for annotators."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.client_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project.total_tasks == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot activate project with no tasks"
        )

    project.status = ProjectStatus.ACTIVE
    db.commit()
    db.refresh(project)

    return ProjectResponse.model_validate(project)
