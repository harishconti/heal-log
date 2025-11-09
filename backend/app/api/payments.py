import logging

from fastapi import APIRouter, Depends, Request, status

from app.core.exceptions import BetaUserException, NotFoundException
from app.core.limiter import limiter
from app.core.security import get_current_user
from app.services import user_service


router = APIRouter()

@router.post("/create-checkout-session", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
async def create_checkout_session(
    request: Request,
    current_user_id: str = Depends(get_current_user)
):
    """
    Creates a new checkout session for a user to upgrade to the PRO plan.
    """
    # In a real application, this would integrate with a payment provider like Stripe.
    # For this implementation, we will simulate the process.

    # 1. Get the user from the database.
    user = await user_service.get_user_by_id(current_user_id)
    if not user:
        raise NotFoundException(detail="User not found")

    # 2. Check if the user is a beta user.
    if user.role != "beta":
        raise BetaUserException()

    # 3. Check if the user is already on the PRO plan.
    if user.plan == "pro":
        raise BetaUserException(detail="User is already on the PRO plan.")

    # 4. Simulate the creation of a checkout session.
    # In a real app, you would get a session ID and URL from the payment provider.
    checkout_session_url = f"https://example.com/checkout?user_id={user.id}"

    return {"checkout_url": checkout_session_url}

@router.post("/webhooks/stripe", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request):
    """
    Handles incoming webhooks from Stripe (or another payment provider).
    """
    # This is a simplified webhook handler. In a real application, you would:
    # 1. Verify the webhook signature to ensure it's from a trusted source.
    # 2. Parse the event payload to determine the event type.
    # 3. Handle the 'checkout.session.completed' event to update the user's subscription.

    payload = await request.json()
    event_type = payload.get("type")

    if event_type == "checkout.session.completed":
        user_id = payload.get("data", {}).get("object", {}).get("user_id")
        if user_id:
            updated_user = await user_service.update_user(
                user_id,
                {"plan": "pro", "status": "active"}
            )
            if not updated_user:
                logging.error(f"Failed to upgrade subscription for user: {user_id}")
                raise NotFoundException(detail="User not found")
            logging.info(f"Successfully upgraded subscription for user: {user_id}")

    return {"status": "received"}
