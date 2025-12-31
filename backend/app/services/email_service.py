"""
Email Service - Async email sending for OTP and password reset.

Uses OAuth 2.0 (XOAUTH2) for Gmail when configured, falls back to basic SMTP,
and logs to console in development mode.
"""
import logging
import os
from typing import Optional, Tuple
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Handles sending emails for OTP verification and password reset."""
    
    def __init__(self):
        # Check OAuth configuration
        self.oauth_configured = all([
            os.getenv("GOOGLE_CLIENT_ID"),
            os.getenv("GOOGLE_CLIENT_SECRET"),
            os.getenv("GOOGLE_REFRESH_TOKEN")
        ])
        
        # Check basic SMTP configuration
        self.smtp_configured = all([
            settings.EMAIL_HOST,
            settings.EMAIL_PORT,
            settings.EMAIL_USER,
            settings.EMAIL_PASSWORD
        ])
        
        if self.oauth_configured:
            logger.info("[EMAIL_SERVICE] OAuth 2.0 configured - using XOAUTH2")
        elif self.smtp_configured:
            logger.info("[EMAIL_SERVICE] Basic SMTP configured")
        else:
            logger.warning("[EMAIL_SERVICE] No email configured. Emails will be logged to console.")
    
    def _get_oauth_service(self):
        """Lazy load OAuth service to avoid import errors if not configured"""
        try:
            from app.services.oauth_email_service import oauth_email_service
            return oauth_email_service
        except ImportError as e:
            logger.warning(f"[EMAIL_SERVICE] Could not import OAuth service: {e}")
            return None
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email. Priority: OAuth > Basic SMTP > Console logging
        
        Returns True if email sent successfully, False otherwise.
        """
        # Try OAuth first
        if self.oauth_configured:
            oauth_service = self._get_oauth_service()
            if oauth_service and oauth_service.is_configured():
                try:
                    success, message = oauth_service._send_email(
                        recipient_email=to_email,
                        subject=subject,
                        html_body=html_content,
                        text_body=text_content or ""
                    )
                    if success:
                        logger.info(f"[EMAIL_SERVICE] OAuth email sent to {to_email}")
                        return True
                    else:
                        logger.warning(f"[EMAIL_SERVICE] OAuth failed: {message}. Trying fallback...")
                except Exception as e:
                    logger.warning(f"[EMAIL_SERVICE] OAuth error: {e}. Trying fallback...")
        
        # Fallback to basic SMTP
        if self.smtp_configured:
            try:
                message = MIMEMultipart("alternative")
                message["From"] = settings.EMAIL_FROM
                message["To"] = to_email
                message["Subject"] = subject
                
                if text_content:
                    message.attach(MIMEText(text_content, "plain"))
                message.attach(MIMEText(html_content, "html"))
                
                await aiosmtplib.send(
                    message,
                    hostname=settings.EMAIL_HOST,
                    port=settings.EMAIL_PORT,
                    username=settings.EMAIL_USER,
                    password=settings.EMAIL_PASSWORD,
                    start_tls=True
                )
                logger.info(f"[EMAIL_SERVICE] SMTP email sent to {to_email}")
                return True
            except Exception as e:
                logger.error(f"[EMAIL_SERVICE] SMTP failed: {str(e)}")
        
        # Final fallback: console logging (development mode)
        logger.info(f"[EMAIL_SERVICE] [DEV MODE] Would send email to: {to_email}")
        logger.info(f"[EMAIL_SERVICE] [DEV MODE] Subject: {subject}")
        logger.info(f"[EMAIL_SERVICE] [DEV MODE] Content:\n{text_content or html_content[:500]}...")
        return True  # Return True in dev mode to not break flow
    
    async def send_otp_email(self, email: str, otp_code: str, full_name: str) -> Tuple[bool, str]:
        """Send OTP verification email."""
        subject = "Your HealLog Verification Code"

        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Verify Your Email</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased;">
    <!-- Preheader text (hidden but shows in email preview) -->
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

        text_content = f"""
HEALLOG - VERIFY YOUR EMAIL
============================

Hello {full_name},

Your verification code is:

    {otp_code}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.

Enter this code in the HealLog app to verify your email address and complete your registration.

SECURITY TIP: Never share this code with anyone. HealLog staff will never ask for your verification code.

If you didn't create an account with HealLog, you can safely ignore this email.

---
HealLog - Patient Management Made Simple
https://heallog.com

(c) 2025 HealLog. All rights reserved.
        """
        
        success = await self.send_email(email, subject, html_content, text_content)
        if success:
            return True, "OTP email sent successfully"
        return False, "Failed to send OTP email"
    
    async def send_password_reset_email(self, email: str, reset_token: str, full_name: str) -> Tuple[bool, str]:
        """Send password reset email with token."""
        subject = "Reset Your HealLog Password"

        html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Your Password</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f7fa; -webkit-font-smoothing: antialiased;">
    <!-- Preheader text (hidden but shows in email preview) -->
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

        text_content = f"""
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
        
        success = await self.send_email(email, subject, html_content, text_content)
        if success:
            return True, "Password reset email sent successfully"
        return False, "Failed to send password reset email"


# Singleton instance
email_service = EmailService()
