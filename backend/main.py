"""
LinguaLabel API Server

The backend for the multilingual AI annotation platform.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import uvicorn

from app.core.config import settings
from app.core.database import get_db, engine
from app.models.base import Base
from app.routers.auth import router as auth_router
from app.routers.projects import router as projects_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup: Create tables if they don't exist (for development)
    # In production, use Alembic migrations instead
    # Base.metadata.create_all(bind=engine)
    yield
    # Shutdown


# Initialize FastAPI app
app = FastAPI(
    title="LinguaLabel API",
    description="Multilingual AI Annotation Platform for Low-Resource Languages",
    version="0.1.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(projects_router)


# =============================================================================
# Models
# =============================================================================

class HealthResponse(BaseModel):
    status: str
    version: str


class Language(BaseModel):
    code: str
    name: str
    native_name: str
    script: str  # e.g., "Latin", "Devanagari", "Arabic"
    direction: str  # "ltr" or "rtl"
    speakers: int  # approximate number of speakers
    region: str


class AnnotatorCreate(BaseModel):
    email: str
    name: str
    languages: list[str]  # Language codes
    country: str
    is_native_speaker: bool = True


class Annotator(AnnotatorCreate):
    id: str
    status: str  # "pending", "approved", "active", "inactive"
    rating: Optional[float] = None
    tasks_completed: int = 0


class ProjectCreate(BaseModel):
    name: str
    description: str
    language_code: str
    annotation_type: str  # "ner", "sentiment", "classification", "transcription"
    instructions: str
    price_per_task: float  # USD


class Project(ProjectCreate):
    id: str
    status: str  # "draft", "active", "completed", "paused"
    task_count: int = 0
    completed_tasks: int = 0


# =============================================================================
# Supported Languages (Phase 1)
# =============================================================================

SUPPORTED_LANGUAGES = [
    Language(
        code="hi",
        name="Hindi",
        native_name="हिन्दी",
        script="Devanagari",
        direction="ltr",
        speakers=600000000,
        region="Indian",
    ),
    Language(
        code="bn",
        name="Bengali",
        native_name="বাংলা",
        script="Bengali",
        direction="ltr",
        speakers=230000000,
        region="Indian",
    ),
    Language(
        code="sw",
        name="Swahili",
        native_name="Kiswahili",
        script="Latin",
        direction="ltr",
        speakers=100000000,
        region="African",
    ),
    Language(
        code="yo",
        name="Yoruba",
        native_name="Yorùbá",
        script="Latin",
        direction="ltr",
        speakers=45000000,
        region="African",
    ),
    Language(
        code="ar-eg",
        name="Egyptian Arabic",
        native_name="مصري",
        script="Arabic",
        direction="rtl",
        speakers=100000000,
        region="Arabic",
    ),
    Language(
        code="ar-gulf",
        name="Gulf Arabic",
        native_name="خليجي",
        script="Arabic",
        direction="rtl",
        speakers=36000000,
        region="Arabic",
    ),
]


# =============================================================================
# API Routes
# =============================================================================

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint."""
    return HealthResponse(status="healthy", version="0.1.0")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check for monitoring."""
    return HealthResponse(status="healthy", version="0.1.0")


# -----------------------------------------------------------------------------
# Languages
# -----------------------------------------------------------------------------

@app.get("/api/languages", response_model=list[Language])
async def list_languages():
    """Get all supported languages."""
    return SUPPORTED_LANGUAGES


@app.get("/api/languages/{code}", response_model=Language)
async def get_language(code: str):
    """Get a specific language by code."""
    for lang in SUPPORTED_LANGUAGES:
        if lang.code == code:
            return lang
    raise HTTPException(status_code=404, detail="Language not found")


@app.get("/api/languages/region/{region}", response_model=list[Language])
async def get_languages_by_region(region: str):
    """Get languages by region (Indian, African, Arabic)."""
    return [lang for lang in SUPPORTED_LANGUAGES if lang.region.lower() == region.lower()]


# -----------------------------------------------------------------------------
# Annotators
# -----------------------------------------------------------------------------

# In-memory storage for demo (replace with database)
annotators_db: dict[str, Annotator] = {}


@app.post("/api/annotators", response_model=Annotator)
async def create_annotator(annotator: AnnotatorCreate):
    """Register a new annotator."""
    import uuid

    annotator_id = str(uuid.uuid4())
    new_annotator = Annotator(
        id=annotator_id,
        status="pending",
        **annotator.model_dump()
    )
    annotators_db[annotator_id] = new_annotator
    return new_annotator


@app.get("/api/annotators", response_model=list[Annotator])
async def list_annotators(
    language: Optional[str] = None,
    status: Optional[str] = None
):
    """List all annotators, optionally filtered by language or status."""
    result = list(annotators_db.values())

    if language:
        result = [a for a in result if language in a.languages]
    if status:
        result = [a for a in result if a.status == status]

    return result


@app.get("/api/annotators/{annotator_id}", response_model=Annotator)
async def get_annotator(annotator_id: str):
    """Get a specific annotator by ID."""
    if annotator_id not in annotators_db:
        raise HTTPException(status_code=404, detail="Annotator not found")
    return annotators_db[annotator_id]


# -----------------------------------------------------------------------------
# Projects
# -----------------------------------------------------------------------------

# In-memory storage for demo (replace with database)
projects_db: dict[str, Project] = {}


@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    """Create a new annotation project."""
    import uuid

    # Validate language exists
    valid_codes = [lang.code for lang in SUPPORTED_LANGUAGES]
    if project.language_code not in valid_codes:
        raise HTTPException(
            status_code=400,
            detail=f"Language code must be one of: {valid_codes}"
        )

    project_id = str(uuid.uuid4())
    new_project = Project(
        id=project_id,
        status="draft",
        **project.model_dump()
    )
    projects_db[project_id] = new_project
    return new_project


@app.get("/api/projects", response_model=list[Project])
async def list_projects(
    language: Optional[str] = None,
    status: Optional[str] = None
):
    """List all projects, optionally filtered."""
    result = list(projects_db.values())

    if language:
        result = [p for p in result if p.language_code == language]
    if status:
        result = [p for p in result if p.status == status]

    return result


@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    """Get a specific project by ID."""
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]


# -----------------------------------------------------------------------------
# Stats
# -----------------------------------------------------------------------------

@app.get("/api/stats")
async def get_stats():
    """Get platform statistics."""
    return {
        "languages_supported": len(SUPPORTED_LANGUAGES),
        "total_speakers_reached": sum(lang.speakers for lang in SUPPORTED_LANGUAGES),
        "annotators_registered": len(annotators_db),
        "projects_created": len(projects_db),
        "regions": list(set(lang.region for lang in SUPPORTED_LANGUAGES)),
    }


# =============================================================================
# Main
# =============================================================================

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
