"""Label Studio integration service.

Provides a wrapper around the Label Studio SDK for managing annotation projects,
importing tasks, and syncing annotations back to the database.
"""

import logging
from typing import Optional
from label_studio_sdk import Client
from label_studio_sdk.project import Project as LSProject

from app.core.config import settings

logger = logging.getLogger(__name__)


# Default label configs for different annotation types
DEFAULT_LABEL_CONFIGS = {
    "classification": """
<View>
  <Text name="text" value="$text"/>
  <Choices name="label" toName="text" choice="single">
    <Choice value="positive"/>
    <Choice value="negative"/>
    <Choice value="neutral"/>
  </Choices>
</View>
""",
    "sentiment": """
<View>
  <Text name="text" value="$text"/>
  <Choices name="sentiment" toName="text" choice="single">
    <Choice value="very_positive" alias="Very Positive"/>
    <Choice value="positive" alias="Positive"/>
    <Choice value="neutral" alias="Neutral"/>
    <Choice value="negative" alias="Negative"/>
    <Choice value="very_negative" alias="Very Negative"/>
  </Choices>
</View>
""",
    "ner": """
<View>
  <Labels name="label" toName="text">
    <Label value="PER" background="#FF0000"/>
    <Label value="ORG" background="#00FF00"/>
    <Label value="LOC" background="#0000FF"/>
    <Label value="MISC" background="#FFFF00"/>
  </Labels>
  <Text name="text" value="$text"/>
</View>
""",
    "transcription": """
<View>
  <Audio name="audio" value="$audio"/>
  <TextArea name="transcription" toName="audio"
            rows="4" editable="true" maxSubmissions="1"/>
</View>
""",
    "translation": """
<View>
  <Text name="source_text" value="$text"/>
  <Header value="Translation"/>
  <TextArea name="translation" toName="source_text"
            rows="4" editable="true" maxSubmissions="1"/>
</View>
""",
    "span_labeling": """
<View>
  <Labels name="label" toName="text">
    <Label value="Entity" background="#FFA39E"/>
    <Label value="Relation" background="#D4380D"/>
  </Labels>
  <Text name="text" value="$text"/>
</View>
""",
    "qa": """
<View>
  <Text name="context" value="$context"/>
  <Header value="Question: $question"/>
  <TextArea name="answer" toName="context"
            rows="2" editable="true" maxSubmissions="1"/>
</View>
""",
}


class LabelStudioService:
    """Service for interacting with Label Studio API.

    Handles project creation, task import, and annotation retrieval.
    Designed to fail gracefully when Label Studio is unavailable.
    """

    def __init__(self):
        self._client: Optional[Client] = None
        self._initialized = False

    @property
    def client(self) -> Optional[Client]:
        """Get or initialize the Label Studio client."""
        if not self._initialized:
            self._initialize_client()
        return self._client

    @property
    def is_available(self) -> bool:
        """Check if Label Studio is configured and reachable."""
        if not settings.label_studio_url or not settings.label_studio_api_key:
            return False
        return self.client is not None

    def _initialize_client(self) -> None:
        """Initialize the Label Studio SDK client."""
        self._initialized = True

        if not settings.label_studio_url or not settings.label_studio_api_key:
            logger.warning("Label Studio URL or API key not configured")
            return

        try:
            self._client = Client(
                url=settings.label_studio_url,
                api_key=settings.label_studio_api_key,
            )
            # Test connection
            self._client.get_projects()
            logger.info(f"Connected to Label Studio at {settings.label_studio_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Label Studio: {e}")
            self._client = None

    def get_label_config(self, annotation_type: str, custom_labels: Optional[list] = None) -> str:
        """Get label configuration XML for an annotation type.

        Args:
            annotation_type: Type of annotation (classification, ner, etc.)
            custom_labels: Optional list of custom label names

        Returns:
            Label Studio XML configuration string
        """
        config = DEFAULT_LABEL_CONFIGS.get(annotation_type)
        if not config:
            # Default to classification if type not found
            config = DEFAULT_LABEL_CONFIGS["classification"]

        # If custom labels provided, update the config
        if custom_labels and annotation_type == "classification":
            choices = "\n".join([f'    <Choice value="{label}"/>' for label in custom_labels])
            config = f"""
<View>
  <Text name="text" value="$text"/>
  <Choices name="label" toName="text" choice="single">
{choices}
  </Choices>
</View>
"""
        return config.strip()

    def create_project(
        self,
        title: str,
        description: str,
        annotation_type: str,
        label_config: Optional[str] = None,
    ) -> Optional[int]:
        """Create a new Label Studio project.

        Args:
            title: Project title
            description: Project description
            annotation_type: Type of annotation for default config
            label_config: Optional custom label configuration XML

        Returns:
            Label Studio project ID or None if creation failed
        """
        if not self.is_available:
            logger.warning("Label Studio not available, skipping project creation")
            return None

        try:
            config = label_config or self.get_label_config(annotation_type)
            project = self.client.start_project(
                title=title,
                description=description,
                label_config=config,
            )
            logger.info(f"Created Label Studio project: {project.id}")
            return project.id
        except Exception as e:
            logger.error(f"Failed to create Label Studio project: {e}")
            return None

    def get_project(self, project_id: int) -> Optional[LSProject]:
        """Get a Label Studio project by ID.

        Args:
            project_id: Label Studio project ID

        Returns:
            Label Studio project or None
        """
        if not self.is_available:
            return None

        try:
            return self.client.get_project(project_id)
        except Exception as e:
            logger.error(f"Failed to get Label Studio project {project_id}: {e}")
            return None

    def import_tasks(
        self,
        project_id: int,
        tasks: list[dict],
    ) -> Optional[list[int]]:
        """Import tasks into a Label Studio project.

        Args:
            project_id: Label Studio project ID
            tasks: List of task data dicts (e.g., [{"text": "Sample text"}, ...])

        Returns:
            List of created task IDs or None if import failed
        """
        if not self.is_available:
            logger.warning("Label Studio not available, skipping task import")
            return None

        try:
            project = self.client.get_project(project_id)
            result = project.import_tasks(tasks)

            # The SDK returns different formats, handle both
            if isinstance(result, list):
                task_ids = [t.get("id") or t for t in result]
            else:
                task_ids = [result]

            logger.info(f"Imported {len(task_ids)} tasks to project {project_id}")
            return task_ids
        except Exception as e:
            logger.error(f"Failed to import tasks to project {project_id}: {e}")
            return None

    def get_tasks(self, project_id: int) -> list[dict]:
        """Get all tasks from a Label Studio project.

        Args:
            project_id: Label Studio project ID

        Returns:
            List of task dicts
        """
        if not self.is_available:
            return []

        try:
            project = self.client.get_project(project_id)
            return project.get_tasks()
        except Exception as e:
            logger.error(f"Failed to get tasks from project {project_id}: {e}")
            return []

    def get_annotations(self, project_id: int) -> list[dict]:
        """Get all annotations from a Label Studio project.

        Args:
            project_id: Label Studio project ID

        Returns:
            List of annotation dicts with task and result data
        """
        if not self.is_available:
            return []

        try:
            project = self.client.get_project(project_id)
            tasks = project.get_tasks()

            annotations = []
            for task in tasks:
                for ann in task.get("annotations", []):
                    annotations.append({
                        "task_id": task["id"],
                        "annotation_id": ann["id"],
                        "result": ann.get("result", []),
                        "completed_by": ann.get("completed_by"),
                        "created_at": ann.get("created_at"),
                        "updated_at": ann.get("updated_at"),
                    })

            logger.info(f"Retrieved {len(annotations)} annotations from project {project_id}")
            return annotations
        except Exception as e:
            logger.error(f"Failed to get annotations from project {project_id}: {e}")
            return []

    def delete_project(self, project_id: int) -> bool:
        """Delete a Label Studio project.

        Args:
            project_id: Label Studio project ID

        Returns:
            True if deletion succeeded
        """
        if not self.is_available:
            return False

        try:
            project = self.client.get_project(project_id)
            project.delete()
            logger.info(f"Deleted Label Studio project: {project_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete Label Studio project {project_id}: {e}")
            return False

    def get_project_url(self, project_id: int) -> Optional[str]:
        """Get the URL to open a project in Label Studio.

        Args:
            project_id: Label Studio project ID

        Returns:
            URL string or None
        """
        if not settings.label_studio_url:
            return None
        return f"{settings.label_studio_url}/projects/{project_id}"

    def sync_project_stats(self, project_id: int) -> Optional[dict]:
        """Get project statistics from Label Studio.

        Args:
            project_id: Label Studio project ID

        Returns:
            Dict with task and annotation counts
        """
        if not self.is_available:
            return None

        try:
            project = self.client.get_project(project_id)
            tasks = project.get_tasks()

            total = len(tasks)
            annotated = sum(1 for t in tasks if t.get("annotations"))

            return {
                "total_tasks": total,
                "annotated_tasks": annotated,
                "pending_tasks": total - annotated,
            }
        except Exception as e:
            logger.error(f"Failed to sync project stats for {project_id}: {e}")
            return None


# Global service instance
label_studio_service = LabelStudioService()
