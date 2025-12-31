#!/usr/bin/env python3
"""
Quick script to test email sending with the current SMTP configuration.
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

import asyncio
from app.services.email_service import email_service

async def test_email():
    """Test sending an OTP email."""
    test_email = "ngharish.develop@gmail.com"
    test_otp = "12345678"
    test_name = "Test User"

    print(f"Testing email configuration...")
    print(f"Sending test OTP email to: {test_email}")
    print(f"OTP Code: {test_otp}")
    print("-" * 50)

    success, message = await email_service.send_otp_email(
        email=test_email,
        otp_code=test_otp,
        full_name=test_name
    )

    if success:
        print(f"SUCCESS: {message}")
        print(f"\nCheck your inbox at {test_email} for the OTP email!")
    else:
        print(f"FAILED: {message}")

    return success

if __name__ == "__main__":
    result = asyncio.run(test_email())
    sys.exit(0 if result else 1)
