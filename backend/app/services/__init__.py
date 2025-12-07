"""Service layer for external integrations."""

from .label_studio import LabelStudioService, label_studio_service

__all__ = ["LabelStudioService", "label_studio_service"]
