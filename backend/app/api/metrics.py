from collections import deque
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.core.security import require_role, get_current_user
from app.schemas.user import User
from app.schemas.role import UserRole

router = APIRouter()

# Configuration for metrics storage limits
MAX_RESPONSE_TIMES = 1000  # Keep only last 1000 response times
MAX_ACTIVE_USERS = 10000   # Maximum unique users to track
ACTIVE_USER_TTL_SECONDS = 3600  # 1 hour TTL for active users

# In-memory storage for metrics with bounded collections
metrics_data = {
    "total_requests": 0,
    "error_rate": 0,
    "response_times": deque(maxlen=MAX_RESPONSE_TIMES),  # Bounded deque
    "active_users": {},  # Dict with timestamps for TTL: {user_id: last_seen_timestamp}
}

def _cleanup_expired_users():
    """Remove users that haven't been active within the TTL period."""
    current_time = datetime.now(timezone.utc).timestamp()
    expired_users = [
        user_id for user_id, last_seen in metrics_data["active_users"].items()
        if current_time - last_seen > ACTIVE_USER_TTL_SECONDS
    ]
    for user_id in expired_users:
        del metrics_data["active_users"][user_id]


def _add_active_user(user_id: str):
    """Add or update an active user with current timestamp, enforcing max limit."""
    current_time = datetime.now(timezone.utc).timestamp()

    # Clean up expired users first
    _cleanup_expired_users()

    # If at capacity and user is new, remove oldest user
    if user_id not in metrics_data["active_users"] and len(metrics_data["active_users"]) >= MAX_ACTIVE_USERS:
        # Find and remove the oldest user
        oldest_user = min(metrics_data["active_users"].items(), key=lambda x: x[1])
        del metrics_data["active_users"][oldest_user[0]]

    # Add/update user with current timestamp
    metrics_data["active_users"][user_id] = current_time


@router.get("/metrics", dependencies=[Depends(require_role(UserRole.ADMIN))])
async def get_metrics(current_user: User = Depends(get_current_user)):
    """
    API metrics endpoint (admin only).
    """
    # Calculate average response time
    avg_response_time = (
        sum(metrics_data["response_times"]) / len(metrics_data["response_times"])
        if metrics_data["response_times"]
        else 0
    )

    # Update active users with TTL-based tracking
    _add_active_user(str(current_user.id))

    return {
        "total_requests": metrics_data["total_requests"],
        "average_response_time": f"{avg_response_time:.2f}ms",
        "error_rate": f"{metrics_data['error_rate']:.2%}",
        "active_users": len(metrics_data["active_users"]),
    }


def update_metrics(response_time: float, error: bool = False):
    """
    Updates the in-memory metrics.
    Response times are automatically bounded by deque maxlen.
    """
    metrics_data["total_requests"] += 1
    metrics_data["response_times"].append(response_time)
    if error:
        metrics_data["error_rate"] = (
            (metrics_data["error_rate"] * (metrics_data["total_requests"] - 1)) + 1
        ) / metrics_data["total_requests"]
