from fastapi import APIRouter, Request, Response, status, Header, HTTPException
import logging
import hmac
import hashlib
import os

router = APIRouter()

# Stripe webhook secret - must be set in environment for production
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Maximum payload size for webhooks (1MB - matches Stripe's typical max)
MAX_WEBHOOK_PAYLOAD_SIZE = 1 * 1024 * 1024  # 1MB


def verify_stripe_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verifies the Stripe webhook signature using HMAC-SHA256.
    """
    if not secret:
        return False

    try:
        elements = dict(item.split("=", 1) for item in signature.split(","))
        timestamp = elements.get("t")
        expected_sig = elements.get("v1")

        if not timestamp or not expected_sig:
            return False

        signed_payload = f"{timestamp}.{payload.decode('utf-8')}"
        computed_sig = hmac.new(
            secret.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_sig, expected_sig)
    except Exception as e:
        logging.error(f"Error verifying Stripe signature: {e}")
        return False


@router.post("/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature")
):
    """
    Webhook endpoint for Stripe with signature verification.
    """
    # Check Content-Length header before reading body to prevent large payload attacks
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > MAX_WEBHOOK_PAYLOAD_SIZE:
                logging.warning(f"Webhook payload too large: {content_length} bytes")
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Payload too large"
                )
        except ValueError:
            pass  # Invalid content-length header, let body reading handle it

    payload = await request.body()

    # Validate actual payload size
    if len(payload) > MAX_WEBHOOK_PAYLOAD_SIZE:
        logging.warning(f"Webhook payload exceeded size limit: {len(payload)} bytes")
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Payload too large"
        )

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

    # Signature verified - safe to log and process
    logging.info("Received verified Stripe webhook")

    return Response(status_code=status.HTTP_200_OK)