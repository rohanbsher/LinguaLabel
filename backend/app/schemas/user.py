"""User schemas for API validation."""

from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid


class UserBase(BaseModel):
    """Base user fields."""
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str
    role: str = "annotator"  # "annotator" or "client"


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(UserBase):
    """Schema for user response."""
    id: uuid.UUID
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserWithToken(UserResponse):
    """User response with access token."""
    access_token: str
    token_type: str = "bearer"
