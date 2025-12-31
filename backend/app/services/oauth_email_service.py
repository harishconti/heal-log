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
    
    async def send_otp_email(self, recipient_email: str, otp_code: str, full_name: str = "User") -> Tuple[bool, str]:
        """Send OTP verification email"""

        html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased;">
    <!-- Preheader text -->
    <div style="display: none; max-height: 0; overflow: hidden;">
        Your verification code is {otp_code}. Valid for {settings.OTP_EXPIRE_MINUTES} minutes.
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;">🏥</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #10b981;">HealLog</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1f2937; text-align: center;">Verify Your Email</h2>
                            <p style="margin: 0 0 8px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">Hello <strong style="color: #1f2937;">{full_name}</strong>,</p>
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">Enter the following code to verify your email address and complete your registration:</p>
                        </td>
                    </tr>

                    <!-- OTP Code Box -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 28px 20px; text-align: center;">
                                <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #ffffff; font-family: 'Courier New', monospace;">{otp_code}</div>
                                <div style="font-size: 13px; color: rgba(255, 255, 255, 0.9); margin-top: 12px;">Valid for {settings.OTP_EXPIRE_MINUTES} minutes</div>
                            </div>
                        </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 24px 40px 0 40px;">
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 16px;">
                                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                                    <strong>Security tip:</strong> Never share this code with anyone. HealLog staff will never ask for your verification code.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px 40px 40px;">
                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                                If you didn't create an account with HealLog, you can safely ignore this email.
                            </p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                                &copy; 2025 HealLog. All rights reserved.<br>
                                <a href="https://heallog.com" style="color: #10b981; text-decoration: none;">heallog.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """

        text_body = f"""
HEALLOG - VERIFY YOUR EMAIL
============================

Hello {full_name},

Your verification code is:

    {otp_code}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.

Enter this code in the HealLog app to verify your email address.

SECURITY TIP: Never share this code with anyone. HealLog staff will never ask for your verification code.

If you didn't create an account with HealLog, you can safely ignore this email.

---
HealLog - Patient Management Made Simple
https://heallog.com

(c) 2025 HealLog. All rights reserved.
        """

        return self._send_email(
            recipient_email=recipient_email,
            subject="Your HealLog Verification Code",
            html_body=html_body,
            text_body=text_body
        )
    
    async def send_password_reset_email(self, recipient_email: str, reset_token: str, full_name: str = "User") -> Tuple[bool, str]:
        """Send password reset email"""

        html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased;">
    <!-- Preheader text -->
    <div style="display: none; max-height: 0; overflow: hidden;">
        Use this token to reset your HealLog password. Valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;">🏥</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #10b981;">HealLog</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #dc2626; text-align: center;">Password Reset Request</h2>
                            <p style="margin: 0 0 8px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">Hello <strong style="color: #1f2937;">{full_name}</strong>,</p>
                            <p style="margin: 0 0 24px 0; font-size: 15px; color: #6b7280; line-height: 1.6;">We received a request to reset your password. Enter the following token in the app to create a new password:</p>
                        </td>
                    </tr>

                    <!-- Reset Token Box -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center;">
                                <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Reset Token</p>
                                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #1e293b; font-family: 'Courier New', monospace; word-break: break-all; line-height: 1.5;">{reset_token}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Timer Warning -->
                    <tr>
                        <td style="padding: 20px 40px 0 40px;">
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 14px 16px;">
                                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                                    <strong>⏰ Time-sensitive:</strong> This token expires in <strong>{settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes</strong>.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 16px 40px 0 40px;">
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 14px 16px;">
                                <p style="margin: 0; font-size: 13px; color: #991b1b; line-height: 1.5;">
                                    <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged. Consider changing your password if you suspect unauthorized access.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px 40px 40px;">
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 20px 0;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                                &copy; 2025 HealLog. All rights reserved.<br>
                                <a href="https://heallog.com" style="color: #10b981; text-decoration: none;">heallog.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """

        text_body = f"""
HEALLOG - PASSWORD RESET REQUEST
=================================

Hello {full_name},

We received a request to reset your password.

YOUR RESET TOKEN:
{reset_token}

This token is valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.

Enter this token in the HealLog app to create a new password.

DIDN'T REQUEST THIS?
If you didn't request a password reset, please ignore this email. Your password will remain unchanged. Consider changing your password if you suspect unauthorized access.

---
HealLog - Patient Management Made Simple
https://heallog.com

(c) 2025 HealLog. All rights reserved.
        """

        return self._send_email(
            recipient_email=recipient_email,
            subject="Reset Your HealLog Password",
            html_body=html_body,
            text_body=text_body
        )


# Create singleton instance
oauth_email_service = OAuthEmailService()
