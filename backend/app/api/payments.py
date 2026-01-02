import logging
import hmac
import hashlib
import os

from fastapi import APIRouter, Depends, Request, status, Header, HTTPException

from app.core.exceptions import BetaUserException, NotFoundException
from app.schemas.user import User
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.services import user_service


router = APIRouter()

# Stripe webhook secret - must be set in environment for production
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")


def verify_stripe_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verifies the Stripe webhook signature using HMAC-SHA256.

    Stripe sends a signature in the format: t=timestamp,v1=signature
    We verify using HMAC-SHA256(timestamp.payload, secret)
    """
    if not secret:
        logging.error("STRIPE_WEBHOOK_SECRET is not configured")
        return False

    try:
        # Parse the signature header
        elements = dict(item.split("=", 1) for item in signature.split(","))
        timestamp = elements.get("t")
        expected_sig = elements.get("v1")

        if not timestamp or not expected_sig:
            logging.error("Invalid Stripe signature format")
            return False

        # Create the signed payload string
        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"

        # Compute HMAC-SHA256
        computed_sig = hmac.new(
            secret.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Constant-time comparison to prevent timing attacks
        return hmac.compare_digest(computed_sig, expected_sig)
    except Exception as e:
        logging.error(f"Error verifying Stripe signature: {e}")
        return False


@router.post("/create-checkout-session", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def create_checkout_session(
    request: Request,
    user: User = Depends(get_current_user)
):
    """
    Creates a new checkout session for a user to upgrade to the PRO plan.
    """
    # In a real application, this would integrate with a payment provider like Stripe.
    # For this implementation, we will simulate the process.

    if not user:
        raise NotFoundException(detail="User not found")

    # 2. Check if the user is a beta user.
    if not user.is_beta_tester:
        raise BetaUserException()

    # 3. Check if the user is already on the PRO plan.
    if user.plan == "pro":
        raise BetaUserException(detail="User is already on the PRO plan.")

    # 4. Simulate the creation of a checkout session.
    # In a real app, you would get a session ID and URL from the payment provider.
    checkout_session_url = f"https://example.com/checkout?user_id={user.id}"

    return {"checkout_url": checkout_session_url}


@router.post("/webhooks/stripe", status_code=status.HTTP_200_OK)
@limiter.limit("100/minute")  # Rate limit webhook endpoint
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature")
):
    """
    Handles incoming webhooks from Stripe.
    Verifies webhook signature before processing.
    """
    # Get raw payload for signature verification
    payload = await request.body()

    # Verify webhook signature (CRITICAL: prevents forged webhook attacks)
    if not STRIPE_WEBHOOK_SECRET:
        logging.error("STRIPE_WEBHOOK_SECRET not configured - rejecting webhook")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing not configured"
        )

    if not stripe_signature:
        logging.warning("Stripe webhook received without signature header")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe-Signature header"
        )

    if not verify_stripe_signature(payload, stripe_signature, STRIPE_WEBHOOK_SECRET):
        logging.warning("Stripe webhook signature verification failed")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid webhook signature"
        )

    # Parse the verified payload
    try:
        import json
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )

    event_type = event.get("type")
    logging.info(f"Processing verified Stripe webhook: {event_type}")

    if event_type == "checkout.session.completed":
        user_id = event.get("data", {}).get("object", {}).get("metadata", {}).get("user_id")
        if user_id:
            updated_user = await user_service.update(
                user_id,
                {"plan": "pro", "status": "active"}
            )
            if not updated_user:
                logging.error(f"Failed to upgrade subscription for user: {user_id}")
                raise NotFoundException(detail="User not found")
            logging.info(f"Successfully upgraded subscription for user: {user_id}")

    return {"status": "received"}
