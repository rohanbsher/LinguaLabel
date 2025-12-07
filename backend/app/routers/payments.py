"""Payments router for Stripe Connect and earnings management."""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.annotator import Annotator
from app.schemas.payment import (
    ConnectOnboardRequest,
    ConnectOnboardResponse,
    ConnectStatusResponse,
    EarningsResponse,
    WithdrawRequest,
    WithdrawResponse,
)
from app.services.stripe_service import stripe_service
from .auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])


def get_annotator_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Annotator:
    """Get the annotator profile for the current user."""
    if current_user.role != UserRole.ANNOTATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only annotators can access payment features"
        )

    annotator = db.query(Annotator).filter(
        Annotator.user_id == current_user.id
    ).first()

    if not annotator:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Annotator profile not found. Please complete your profile setup."
        )

    return annotator


@router.get("/status", response_model=ConnectStatusResponse)
async def get_connect_status(
    annotator: Annotator = Depends(get_annotator_profile),
):
    """Get the Stripe Connect account status for the current annotator."""
    if not annotator.stripe_account_id:
        return ConnectStatusResponse(
            is_connected=False,
            message="No Stripe account connected. Please complete onboarding to receive payments."
        )

    if not stripe_service.is_available:
        return ConnectStatusResponse(
            account_id=annotator.stripe_account_id,
            is_connected=True,
            message="Stripe is not configured. Contact support."
        )

    account_status = stripe_service.get_account_status(annotator.stripe_account_id)

    if not account_status:
        return ConnectStatusResponse(
            account_id=annotator.stripe_account_id,
            is_connected=True,
            message="Unable to retrieve account status. Please try again."
        )

    return ConnectStatusResponse(
        account_id=account_status["id"],
        is_connected=True,
        charges_enabled=account_status["charges_enabled"],
        payouts_enabled=account_status["payouts_enabled"],
        details_submitted=account_status["details_submitted"],
        requirements_due=account_status["requirements"]["currently_due"],
        message="Account connected" if account_status["payouts_enabled"] else "Complete account setup to receive payouts"
    )


@router.post("/connect/onboard", response_model=ConnectOnboardResponse)
async def start_connect_onboarding(
    request: ConnectOnboardRequest,
    current_user: User = Depends(get_current_user),
    annotator: Annotator = Depends(get_annotator_profile),
    db: Session = Depends(get_db),
):
    """Start Stripe Connect onboarding for an annotator."""
    if not stripe_service.is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured. Contact support."
        )

    # Create or retrieve Connect account
    if not annotator.stripe_account_id:
        result = stripe_service.create_connect_account(
            email=current_user.email,
            country=request.country,
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create Stripe account. Please try again."
            )

        annotator.stripe_account_id = result["account_id"]
        db.commit()

    # Create account link for onboarding
    onboarding_url = stripe_service.create_account_link(
        account_id=annotator.stripe_account_id,
        refresh_url=request.refresh_url,
        return_url=request.return_url,
    )

    if not onboarding_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create onboarding link. Please try again."
        )

    return ConnectOnboardResponse(
        account_id=annotator.stripe_account_id,
        onboarding_url=onboarding_url,
    )


@router.get("/earnings", response_model=EarningsResponse)
async def get_earnings(
    annotator: Annotator = Depends(get_annotator_profile),
):
    """Get earnings summary for the current annotator."""
    # Calculate available balance (total - pending)
    available = annotator.total_earnings - annotator.pending_earnings

    return EarningsResponse(
        total_earned=annotator.total_earnings,
        pending=annotator.pending_earnings,
        available=max(0, available),
    )


@router.post("/withdraw", response_model=WithdrawResponse)
async def request_withdrawal(
    request: WithdrawRequest,
    annotator: Annotator = Depends(get_annotator_profile),
    db: Session = Depends(get_db),
):
    """Request a withdrawal of available earnings."""
    # Calculate available balance
    available = annotator.total_earnings - annotator.pending_earnings

    if request.amount > available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: ${available:.2f}"
        )

    if not annotator.stripe_account_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please connect your Stripe account first"
        )

    if not stripe_service.is_available:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe is not configured. Contact support."
        )

    # Check if payouts are enabled
    account_status = stripe_service.get_account_status(annotator.stripe_account_id)
    if not account_status or not account_status["payouts_enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please complete your Stripe account setup to receive payouts"
        )

    # Convert to cents for Stripe
    amount_cents = int(request.amount * 100)

    # First, transfer to the connected account
    transfer = stripe_service.create_transfer(
        destination_account_id=annotator.stripe_account_id,
        amount_cents=amount_cents,
        description=f"LinguaLabel earnings withdrawal",
    )

    if not transfer:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process withdrawal. Please try again."
        )

    # Then create a payout from the connected account to their bank
    payout = stripe_service.create_payout(
        account_id=annotator.stripe_account_id,
        amount_cents=amount_cents,
    )

    # Update annotator balance (deduct the withdrawn amount)
    # Note: In production, you'd want to track this more carefully with transactions
    annotator.total_earnings -= request.amount
    db.commit()

    return WithdrawResponse(
        payout_id=payout["payout_id"] if payout else None,
        amount=request.amount,
        status="processing" if payout else "transferred",
        estimated_arrival=datetime.fromtimestamp(payout["arrival_date"]) if payout and payout.get("arrival_date") else None,
        message="Withdrawal initiated successfully. Funds will arrive in 1-2 business days."
    )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")

    if not sig_header:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header"
        )

    event = stripe_service.construct_webhook_event(payload, sig_header)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook signature"
        )

    # Handle different event types
    event_type = event["type"]

    if event_type == "account.updated":
        # Connect account was updated
        account = event["data"]["object"]
        # You could update the annotator's Stripe status here
        pass

    elif event_type == "payout.paid":
        # Payout was successful
        payout = event["data"]["object"]
        # You could update transaction status here
        pass

    elif event_type == "payout.failed":
        # Payout failed
        payout = event["data"]["object"]
        # You could notify the user and refund their balance
        pass

    elif event_type == "payment_intent.succeeded":
        # Client payment succeeded
        payment_intent = event["data"]["object"]
        # You could mark the project as funded
        pass

    return {"status": "received"}
