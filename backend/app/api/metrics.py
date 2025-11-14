from fastapi import APIRouter, Depends
from app.core.security import require_role, get_current_user
from app.schemas.user import User
from app.services.user_service import user_service
import time

router = APIRouter()

# In-memory storage for metrics (for simplicity)
metrics_data = {
    "total_requests": 0,
    "error_rate": 0,
    "response_times": [],
    "active_users": set(),
}

@router.get("/metrics", dependencies=[Depends(require_role("ADMIN"))])
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

    # Update active users
    metrics_data["active_users"].add(current_user.id)

    return {
        "total_requests": metrics_data["total_requests"],
        "average_response_time": f"{avg_response_time:.2f}ms",
        "error_rate": f"{metrics_data['error_rate']:.2%}",
        "active_users": len(metrics_data["active_users"]),
    }

def update_metrics(response_time: float, error: bool = False):
    """
    Updates the in-memory metrics.
    """
    metrics_data["total_requests"] += 1
    metrics_data["response_times"].append(response_time)
    if error:
        metrics_data["error_rate"] = (
            (metrics_data["error_rate"] * (metrics_data["total_requests"] - 1)) + 1
        ) / metrics_data["total_requests"]
