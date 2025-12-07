"""Application configuration using Pydantic settings."""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "LinguaLabel"
    app_version: str = "0.1.0"
    debug: bool = True

    # Database
    database_url: str = "postgresql://localhost/lingualabel"

    # Security
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_USE_LONG_RANDOM_STRING"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
    ]

    # Label Studio
    label_studio_url: Optional[str] = None
    label_studio_api_key: Optional[str] = None

    # Stripe
    stripe_secret_key: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None

    # AI Services
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
