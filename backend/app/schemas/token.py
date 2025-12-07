"""Token schemas for authentication."""

from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data extracted from JWT token."""
    user_id: Optional[str] = None
    email: Optional[str] = None
