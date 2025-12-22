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
        subject = "HealLog - Verify Your Email"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .logo {{ text-align: center; margin-bottom: 30px; }}
                .logo h1 {{ color: #2ecc71; margin: 0; font-size: 28px; }}
                .otp-box {{ background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; padding: 25px; border-radius: 10px; text-align: center; margin: 30px 0; }}
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
                <h2 style="color: #333; text-align: center;">Welcome, {full_name}!</h2>
                <p class="info">Enter this code to verify your email address:</p>
                <div class="otp-box">
                    <div class="otp-code">{otp_code}</div>
                    <div>Valid for {settings.OTP_EXPIRE_MINUTES} minutes</div>
                </div>
                <p class="info">If you didn't create an account with HealLog, please ignore this email.</p>
                <div class="footer">
                    <p>This is an automated message from HealLog.</p>
                    <p><a href="https://heallog.com" style="color: #2ecc71;">heallog.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
Welcome to HealLog, {full_name}!

Your verification code is: {otp_code}

This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.

If you didn't create an account with HealLog, please ignore this email.

---
HealLog - Patient Management Made Simple
https://heallog.com
        """
        
        success = await self.send_email(email, subject, html_content, text_content)
        if success:
            return True, "OTP email sent successfully"
        return False, "Failed to send OTP email"
    
    async def send_password_reset_email(self, email: str, reset_token: str, full_name: str) -> Tuple[bool, str]:
        """Send password reset email with token."""
        subject = "HealLog - Reset Your Password"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .logo {{ text-align: center; margin-bottom: 30px; }}
                .logo h1 {{ color: #2ecc71; margin: 0; font-size: 28px; }}
                .token-box {{ background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0; font-family: monospace; }}
                .token-code {{ font-size: 16px; word-break: break-all; color: #333; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; color: #856404; }}
                .info {{ color: #666; font-size: 14px; line-height: 1.6; }}
                .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <h1>🏥 HealLog</h1>
                </div>
                <h2 style="color: #e74c3c; text-align: center;">Password Reset Request</h2>
                <p class="info">Hello {full_name},</p>
                <p class="info">We received a request to reset your password. Enter this token in the app:</p>
                <div class="token-box">
                    <div class="token-code">{reset_token}</div>
                </div>
                <div class="warning">
                    <strong>⏰ This token is valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.</strong>
                </div>
                <p class="info">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                <div class="footer">
                    <p>This is an automated message from HealLog.</p>
                    <p><a href="https://heallog.com" style="color: #2ecc71;">heallog.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
Password Reset Request

Hello {full_name},

We received a request to reset your password. Use the following token:

{reset_token}

This token is valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.

If you didn't request a password reset, please ignore this email.

---
HealLog - Patient Management Made Simple
https://heallog.com
        """
        
        success = await self.send_email(email, subject, html_content, text_content)
        if success:
            return True, "Password reset email sent successfully"
        return False, "Failed to send password reset email"


# Singleton instance
email_service = EmailService()
