"""
Version API Endpoint
Provides version information and build details for the deployed backend.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter

router = APIRouter()

# Track server start time for uptime calculation
SERVER_START_TIME = datetime.now(timezone.utc)

def get_version_info() -> dict:
    """Load version information from VERSION.json"""
    version_file = Path(__file__).parent.parent.parent / "VERSION.json"
    
    try:
        if version_file.exists():
            with open(version_file, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading version file: {e}")
    
    # Default version info if file not found
    return {
        "version": "unknown",
        "build_date": "unknown",
        "commit": "unknown"
    }

@router.get("/version")
async def get_version():
    """
    Get the current version of the backend API.

    Returns:
        Minimal version information for public consumption.
        Sensitive details like commit hash, uptime, and environment are omitted.
    """
    version_info = get_version_info()

    # Return minimal version info - avoid exposing internal details
    return {
        "status": "ok",
        "version": version_info.get("version", "unknown"),
        "build_date": version_info.get("build_date", "unknown"),
    }

@router.get("/version/short")
async def get_version_short():
    """
    Get a short version string for quick checks.
    
    Returns:
        Simple version string like "1.0.1 (abc1234)"
    """
    version_info = get_version_info()
    commit = os.getenv("RAILWAY_GIT_COMMIT_SHA", version_info.get("commit", "local"))[:7]
    version = version_info.get("version", "unknown")
    
    return {
        "version": f"{version} ({commit})",
        "status": "ok"
    }
