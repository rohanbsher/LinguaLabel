"""Stripe payment integration service.

Handles Stripe Connect for annotator payouts and payment processing.
Uses Stripe Connect Express accounts for easy onboarding.
"""

import logging
from typing import Optional
import stripe

from app.core.config import settings

logger = logging.getLogger(__name__)


class StripeService:
    """Service for Stripe payment operations.

    Handles:
    - Connect account creation for annotators
    - Payment processing
    - Transfer/payout to annotators
    """

    def __init__(self):
        self._initialized = False
        self._available = False

    @property
    def is_available(self) -> bool:
        """Check if Stripe is configured."""
        if not self._initialized:
            self._initialize()
        return self._available

    def _initialize(self) -> None:
        """Initialize Stripe with API key."""
        self._initialized = True

        if not settings.stripe_secret_key:
            logger.warning("Stripe secret key not configured")
            return

        try:
            stripe.api_key = settings.stripe_secret_key
            # Test the connection
            stripe.Account.retrieve()
            self._available = True
            logger.info("Stripe initialized successfully")
        except stripe.error.AuthenticationError:
            logger.error("Invalid Stripe API key")
        except Exception as e:
            logger.error(f"Failed to initialize Stripe: {e}")

    def create_connect_account(
        self,
        email: str,
        country: str = "US",
        business_type: str = "individual",
    ) -> Optional[dict]:
        """Create a Stripe Connect Express account for an annotator.

        Args:
            email: Annotator's email address
            country: Two-letter country code
            business_type: 'individual' or 'company'

        Returns:
            Dict with account_id and onboarding_url, or None if failed
        """
        if not self.is_available:
            logger.warning("Stripe not available, skipping account creation")
            return None

        try:
            # Create Express account
            account = stripe.Account.create(
                type="express",
                country=country,
                email=email,
                business_type=business_type,
                capabilities={
                    "transfers": {"requested": True},
                },
            )

            logger.info(f"Created Stripe Connect account: {account.id}")
            return {"account_id": account.id}

        except stripe.error.StripeError as e:
            logger.error(f"Failed to create Connect account: {e}")
            return None

    def create_account_link(
        self,
        account_id: str,
        refresh_url: str,
        return_url: str,
    ) -> Optional[str]:
        """Create an account link for Connect onboarding.

        Args:
            account_id: Stripe Connect account ID
            refresh_url: URL to redirect if link expires
            return_url: URL to redirect after completion

        Returns:
            Onboarding URL or None if failed
        """
        if not self.is_available:
            return None

        try:
            account_link = stripe.AccountLink.create(
                account=account_id,
                refresh_url=refresh_url,
                return_url=return_url,
                type="account_onboarding",
            )

            return account_link.url

        except stripe.error.StripeError as e:
            logger.error(f"Failed to create account link: {e}")
            return None

    def get_account_status(self, account_id: str) -> Optional[dict]:
        """Get the status of a Connect account.

        Args:
            account_id: Stripe Connect account ID

        Returns:
            Dict with account status info
        """
        if not self.is_available:
            return None

        try:
            account = stripe.Account.retrieve(account_id)

            return {
                "id": account.id,
                "charges_enabled": account.charges_enabled,
                "payouts_enabled": account.payouts_enabled,
                "details_submitted": account.details_submitted,
                "requirements": {
                    "currently_due": account.requirements.currently_due if account.requirements else [],
                    "eventually_due": account.requirements.eventually_due if account.requirements else [],
                },
            }

        except stripe.error.StripeError as e:
            logger.error(f"Failed to get account status: {e}")
            return None

    def create_transfer(
        self,
        destination_account_id: str,
        amount_cents: int,
        currency: str = "usd",
        description: Optional[str] = None,
    ) -> Optional[dict]:
        """Transfer funds to a Connect account (annotator payout).

        Args:
            destination_account_id: Stripe Connect account ID
            amount_cents: Amount in cents (e.g., 1000 = $10.00)
            currency: Currency code (default: 'usd')
            description: Optional transfer description

        Returns:
            Dict with transfer details or None if failed
        """
        if not self.is_available:
            logger.warning("Stripe not available, skipping transfer")
            return None

        try:
            transfer = stripe.Transfer.create(
                amount=amount_cents,
                currency=currency,
                destination=destination_account_id,
                description=description,
            )

            logger.info(f"Created transfer {transfer.id} for ${amount_cents/100:.2f}")
            return {
                "transfer_id": transfer.id,
                "amount": amount_cents,
                "currency": currency,
                "destination": destination_account_id,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Failed to create transfer: {e}")
            return None

    def get_balance(self, account_id: Optional[str] = None) -> Optional[dict]:
        """Get Stripe balance (platform or connected account).

        Args:
            account_id: Optional Connect account ID. If None, gets platform balance.

        Returns:
            Dict with balance info
        """
        if not self.is_available:
            return None

        try:
            if account_id:
                balance = stripe.Balance.retrieve(stripe_account=account_id)
            else:
                balance = stripe.Balance.retrieve()

            # Parse available and pending balances
            available = {}
            pending = {}

            for b in balance.available:
                available[b.currency] = b.amount / 100

            for b in balance.pending:
                pending[b.currency] = b.amount / 100

            return {
                "available": available,
                "pending": pending,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Failed to get balance: {e}")
            return None

    def create_payout(
        self,
        account_id: str,
        amount_cents: int,
        currency: str = "usd",
    ) -> Optional[dict]:
        """Create a payout from Connect account to annotator's bank.

        Args:
            account_id: Stripe Connect account ID
            amount_cents: Amount in cents
            currency: Currency code

        Returns:
            Dict with payout details or None if failed
        """
        if not self.is_available:
            return None

        try:
            payout = stripe.Payout.create(
                amount=amount_cents,
                currency=currency,
                stripe_account=account_id,
            )

            logger.info(f"Created payout {payout.id} for ${amount_cents/100:.2f}")
            return {
                "payout_id": payout.id,
                "amount": amount_cents,
                "currency": currency,
                "status": payout.status,
                "arrival_date": payout.arrival_date,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Failed to create payout: {e}")
            return None

    def create_payment_intent(
        self,
        amount_cents: int,
        currency: str = "usd",
        customer_email: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> Optional[dict]:
        """Create a payment intent for client payments.

        Args:
            amount_cents: Amount in cents
            currency: Currency code
            customer_email: Optional customer email
            description: Payment description
            metadata: Optional metadata dict

        Returns:
            Dict with payment intent details
        """
        if not self.is_available:
            return None

        try:
            intent_params = {
                "amount": amount_cents,
                "currency": currency,
                "automatic_payment_methods": {"enabled": True},
            }

            if description:
                intent_params["description"] = description
            if metadata:
                intent_params["metadata"] = metadata
            if customer_email:
                intent_params["receipt_email"] = customer_email

            intent = stripe.PaymentIntent.create(**intent_params)

            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "amount": amount_cents,
                "currency": currency,
                "status": intent.status,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Failed to create payment intent: {e}")
            return None

    def construct_webhook_event(
        self,
        payload: bytes,
        sig_header: str,
    ) -> Optional[stripe.Event]:
        """Construct and verify a webhook event.

        Args:
            payload: Raw request body
            sig_header: Stripe-Signature header value

        Returns:
            Verified Stripe event or None
        """
        if not settings.stripe_webhook_secret:
            logger.warning("Stripe webhook secret not configured")
            return None

        try:
            event = stripe.Webhook.construct_event(
                payload,
                sig_header,
                settings.stripe_webhook_secret,
            )
            return event

        except stripe.error.SignatureVerificationError:
            logger.error("Invalid webhook signature")
            return None
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return None


# Global service instance
stripe_service = StripeService()
