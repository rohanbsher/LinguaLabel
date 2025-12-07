"""Pydantic schemas for payment-related API operations."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ConnectOnboardRequest(BaseModel):
    """Request to start Stripe Connect onboarding."""

    country: str = Field(default="US", min_length=2, max_length=2)
    return_url: str = Field(..., description="URL to redirect after onboarding")
    refresh_url: str = Field(..., description="URL to redirect if link expires")


class ConnectOnboardResponse(BaseModel):
    """Response with onboarding URL."""

    account_id: str
    onboarding_url: str
    message: str = "Redirect user to complete onboarding"


class ConnectStatusResponse(BaseModel):
    """Response with Connect account status."""

    account_id: Optional[str] = None
    is_connected: bool = False
    charges_enabled: bool = False
    payouts_enabled: bool = False
    details_submitted: bool = False
    requirements_due: list[str] = []
    message: str


class EarningsResponse(BaseModel):
    """Response with annotator earnings."""

    total_earned: float = Field(..., description="Total lifetime earnings in USD")
    pending: float = Field(..., description="Pending earnings (not yet approved)")
    available: float = Field(..., description="Available for withdrawal")
    currency: str = "USD"


class WithdrawRequest(BaseModel):
    """Request to withdraw earnings."""

    amount: float = Field(..., gt=0, description="Amount to withdraw in USD")


class WithdrawResponse(BaseModel):
    """Response after withdrawal request."""

    payout_id: Optional[str] = None
    amount: float
    currency: str = "USD"
    status: str
    estimated_arrival: Optional[datetime] = None
    message: str


class PaymentIntentRequest(BaseModel):
    """Request to create a payment intent (for clients)."""

    amount: float = Field(..., gt=0, description="Amount in USD")
    project_id: Optional[str] = None
    description: Optional[str] = None


class PaymentIntentResponse(BaseModel):
    """Response with payment intent details."""

    payment_intent_id: str
    client_secret: str
    amount: float
    currency: str = "USD"
    status: str


class TransactionBase(BaseModel):
    """Base transaction schema."""

    amount: float
    currency: str = "USD"
    type: str  # 'earning', 'payout', 'payment'
    status: str  # 'pending', 'completed', 'failed'
    description: Optional[str] = None


class TransactionResponse(TransactionBase):
    """Transaction in response."""

    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """List of transactions."""

    transactions: list[TransactionResponse]
    total: int
