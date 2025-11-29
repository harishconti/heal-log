from fastapi import APIRouter, status, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

class KnownIssue(BaseModel):
    id: str
    title: str
    description: str
    severity: str
    status: str
    reported_date: datetime
    workaround: Optional[str] = None

known_issues_db: List[KnownIssue] = [
    KnownIssue(
        id="KI-001",
        title="App crashes on startup on Android 12",
        description="Some users on Android 12 are reporting that the application closes immediately after opening. We are investigating this critical issue.",
        severity="critical",
        status="investigating",
        reported_date=datetime(2025, 11, 10),
        workaround="Try clearing the app cache and restarting your device. If the problem persists, please contact support."
    ),
    KnownIssue(
        id="KI-002",
        title="Patient data sync fails in offline mode",
        description="When the device is offline, creating a new patient record and then syncing it after coming back online sometimes results in a sync conflict that is not properly resolved.",
        severity="high",
        status="in_progress",
        reported_date=datetime(2025, 11, 5),
    ),
    KnownIssue(
        id="KI-003",
        title="Dark mode theme not applying to settings screen",
        description="The dark mode theme is not being applied correctly to all elements on the user settings screen, causing some text to be unreadable.",
        severity="medium",
        status="in_progress",
        reported_date=datetime(2025, 11, 12),
    ),
    KnownIssue(
        id="KI-004",
        title="Minor UI glitch on the login button",
        description="The login button has a minor visual artifact on screens with a resolution higher than 1080p.",
        severity="low",
        status="fixed",
        reported_date=datetime(2025, 10, 28),
    ),
]

@router.get("/known-issues", response_model=List[KnownIssue], status_code=status.HTTP_200_OK)
async def get_known_issues(current_user: User = Depends(get_current_user)):
    """
    Retrieve a list of known issues for the beta.
    Restricted to beta testers only.
    """
    if not current_user.is_beta_tester:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to beta testers only."
        )
    return known_issues_db
