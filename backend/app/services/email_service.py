"""
Email Service - Async email sending for OTP and password reset.

Falls back to console logging when SMTP is not configured (development mode).
"""
import logging
from typing import Optional
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Handles sending emails for OTP verification and password reset."""
    
    def __init__(self):
        self.is_configured = all([
            settings.EMAIL_HOST,
            settings.EMAIL_PORT,
            settings.EMAIL_USER,
            settings.EMAIL_PASSWORD
        ])
        if not self.is_configured:
            logger.warning("[EMAIL_SERVICE] SMTP not configured. Emails will be logged to console.")
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email. Falls back to console logging if SMTP not configured.
        
        Returns True if email sent successfully, False otherwise.
        """
        if not self.is_configured:
            logger.info(f"[EMAIL_SERVICE] Would send email to: {to_email}")
            logger.info(f"[EMAIL_SERVICE] Subject: {subject}")
            logger.info(f"[EMAIL_SERVICE] Content: {text_content or html_content}")
            return True
        
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
            logger.info(f"[EMAIL_SERVICE] Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"[EMAIL_SERVICE] Failed to send email to {to_email}: {str(e)}")
            return False
    
    async def send_otp_email(self, email: str, otp_code: str, full_name: str) -> bool:
        """Send OTP verification email."""
        subject = "HealLog - Verify Your Email"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2ecc71;">Welcome to HealLog!</h2>
            <p>Hello {full_name},</p>
            <p>Your verification code is:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
                    {otp_code}
                </span>
            </div>
            <p>This code is valid for <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>.</p>
            <p>If you didn't create an account with HealLog, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">
                HealLog - Patient Management Made Simple<br>
                <a href="https://heallog.com" style="color: #2ecc71;">heallog.com</a>
            </p>
        </body>
        </html>
        """
        
        text_content = f"""
        Welcome to HealLog!
        
        Hello {full_name},
        
        Your verification code is: {otp_code}
        
        This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes.
        
        If you didn't create an account with HealLog, please ignore this email.
        
        ---
        HealLog - Patient Management Made Simple
        https://heallog.com
        """
        
        return await self.send_email(email, subject, html_content, text_content)
    
    async def send_password_reset_email(self, email: str, reset_token: str, full_name: str) -> bool:
        """Send password reset email with token."""
        subject = "HealLog - Reset Your Password"
        
        # In a real app, this would be a link to a password reset page
        # For API-only reset, we send the token directly
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #e74c3c;">Password Reset Request</h2>
            <p>Hello {full_name},</p>
            <p>We received a request to reset your password. Use the following token to reset your password:</p>
            <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
                <code style="font-size: 14px; word-break: break-all;">
                    {reset_token}
                </code>
            </div>
            <p>This token is valid for <strong>{settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes</strong>.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #888; font-size: 12px;">
                HealLog - Patient Management Made Simple<br>
                <a href="https://heallog.com" style="color: #2ecc71;">heallog.com</a>
            </p>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request
        
        Hello {full_name},
        
        We received a request to reset your password. Use the following token to reset your password:
        
        {reset_token}
        
        This token is valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.
        
        If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        
        ---
        HealLog - Patient Management Made Simple
        https://heallog.com
        """
        
        return await self.send_email(email, subject, html_content, text_content)


# Singleton instance
email_service = EmailService()
