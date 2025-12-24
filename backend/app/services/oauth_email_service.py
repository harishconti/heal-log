"""
OAuth Email Service using Google OAuth 2.0 XOAUTH2
Replaces basic SMTP authentication for better security
"""

import os
import base64
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

class OAuthEmailService:
    """Email service using OAuth 2.0 XOAUTH2 authentication"""
    
    def __init__(self):
        self.email = os.getenv("SMTP_FROM_EMAIL", "support@heallog.com")
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN")
        self._access_token: Optional[str] = None
    
    def is_configured(self) -> bool:
        """Check if OAuth is configured"""
        return bool(self.client_id and self.client_secret and self.refresh_token)
    
    def get_access_token(self) -> Optional[str]:
        """Get fresh access token using refresh token"""
        if not self.is_configured():
            logger.warning("OAuth not configured - missing credentials")
            return None
            
        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            
            creds_info = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
                "token_uri": "https://oauth2.googleapis.com/token"
            }
            
            creds = Credentials.from_authorized_user_info(creds_info)
            
            if not creds.valid:
                creds.refresh(Request())
            
            self._access_token = creds.token
            return self._access_token
            
        except Exception as e:
            logger.error(f"Error getting access token: {str(e)}")
            return None
    
    def create_xoauth2_string(self, access_token: str) -> str:
        """Create XOAUTH2 authentication string"""
        auth_string = f"user={self.email}\x01auth=Bearer {access_token}\x01\x01"
        return base64.b64encode(auth_string.encode()).decode()
    
    def _send_email(self, recipient_email: str, subject: str, html_body: str, text_body: str = "") -> Tuple[bool, str]:
        """Internal method to send email using OAuth 2.0"""
        server = None
        try:
            # Get fresh access token
            access_token = self.get_access_token()
            if not access_token:
                return False, "Failed to get access token"

            # Create XOAUTH2 string
            auth_string = self.create_xoauth2_string(access_token)

            # Connect to Gmail SMTP
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.ehlo()
            server.starttls()
            server.ehlo()

            # Authenticate using XOAUTH2
            server.docmd('AUTH', 'XOAUTH2 ' + auth_string)

            # Create email message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"HealLog <{self.email}>"
            msg["To"] = recipient_email

            # Add both plain text and HTML
            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Send email
            server.sendmail(self.email, recipient_email, msg.as_string())

            logger.info(f"✅ Email sent to {recipient_email}")
            return True, "Email sent successfully"

        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"SMTP Authentication error: {str(e)}")
            return False, f"Authentication failed: {str(e)}"
        except Exception as e:
            logger.error(f"Email error: {str(e)}")
            return False, str(e)
        finally:
            # Ensure SMTP connection is always closed to prevent resource leaks
            if server:
                try:
                    server.quit()
                except Exception:
                    pass  # Ignore errors during cleanup
    
    async def send_otp_email(self, recipient_email: str, otp_code: str) -> Tuple[bool, str]:
        """Send OTP verification email"""
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .logo {{ text-align: center; margin-bottom: 30px; }}
                .logo h1 {{ color: #3b82f6; margin: 0; font-size: 28px; }}
                .otp-box {{ background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; }}
                .otp-code {{ font-size: 42px; letter-spacing: 8px; font-weight: bold; margin: 10px 0; }}
                .info {{ color: #666; font-size: 14px; line-height: 1.6; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <h1>🏥 HealLog</h1>
                </div>
                <h2 style="color: #333; text-align: center;">Email Verification</h2>
                <p class="info">Enter this code to verify your email address:</p>
                <div class="otp-box">
                    <div class="otp-code">{otp_code}</div>
                    <div>Valid for 10 minutes</div>
                </div>
                <p class="info">If you didn't request this code, please ignore this email.</p>
                <div class="footer">
                    <p>This is an automated message from HealLog. Please don't reply.</p>
                    <p>© 2024 HealLog. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
HealLog - Email Verification

Your OTP code is: {otp_code}

This code is valid for 10 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message from HealLog.
        """
        
        return self._send_email(
            recipient_email=recipient_email,
            subject="HealLog - Email Verification Code",
            html_body=html_body,
            text_body=text_body
        )
    
    async def send_password_reset_email(self, recipient_email: str, reset_token: str) -> Tuple[bool, str]:
        """Send password reset email"""
        
        # Create reset link (can be customized based on frontend URL)
        reset_link = f"http://localhost:8081/reset-password?token={reset_token}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .logo {{ text-align: center; margin-bottom: 30px; }}
                .logo h1 {{ color: #3b82f6; margin: 0; font-size: 28px; }}
                .reset-btn {{ display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
                .token-box {{ background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 20px 0; font-family: monospace; word-break: break-all; }}
                .info {{ color: #666; font-size: 14px; line-height: 1.6; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <h1>🏥 HealLog</h1>
                </div>
                <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                <p class="info">We received a request to reset your password. Use this token to reset your password:</p>
                <div class="token-box">
                    <strong>Reset Token:</strong> {reset_token}
                </div>
                <p class="info">Enter this token in the app to set a new password.</p>
                <p class="info" style="color: #e74c3c;"><strong>⏰ This token is valid for 1 hour.</strong></p>
                <p class="info">If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
                <div class="footer">
                    <p>This is an automated message from HealLog. Please don't reply.</p>
                    <p>© 2024 HealLog. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
HealLog - Password Reset Request

We received a request to reset your password.

Your reset token is: {reset_token}

Enter this token in the app to set a new password.

This token is valid for 1 hour.

If you didn't request this, please ignore this email.

---
This is an automated message from HealLog.
        """
        
        return self._send_email(
            recipient_email=recipient_email,
            subject="HealLog - Password Reset Request",
            html_body=html_body,
            text_body=text_body
        )


# Create singleton instance
oauth_email_service = OAuthEmailService()
