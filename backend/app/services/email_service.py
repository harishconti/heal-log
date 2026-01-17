"""
Email Service - Async email sending for OTP and password reset.

Priority: Resend API > OAuth 2.0 > Basic SMTP > Console logging (dev only)
"""
import os
from typing import Optional, Tuple
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

# Try to import resend
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("resend_not_installed", message="Install with: pip install resend")


class EmailService:
    """Handles sending emails for OTP verification and password reset."""
    
    def __init__(self):
        # Check Resend configuration (preferred for cloud deployments)
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        self.resend_configured = RESEND_AVAILABLE and bool(self.resend_api_key)
        
        if self.resend_configured:
            resend.api_key = self.resend_api_key
        
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
        
        if self.resend_configured:
            logger.info("email_service_init", provider="resend_api")
        elif self.oauth_configured:
            logger.info("email_service_init", provider="oauth_xoauth2")
        elif self.smtp_configured:
            logger.info("email_service_init", provider="basic_smtp")
        else:
            logger.warning("email_service_init", provider="console_only", message="No email configured")

    def _get_oauth_service(self):
        """Lazy load OAuth service to avoid import errors if not configured"""
        try:
            from app.services.oauth_email_service import oauth_email_service
            return oauth_email_service
        except ImportError as e:
            logger.warning("oauth_service_import_failed", error=str(e))
            return None
    
    async def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email. Priority: Resend API > OAuth > Basic SMTP > Console logging
        
        Returns True if email sent successfully, False otherwise.
        """
        # Try Resend API first (works on cloud platforms like Railway)
        if self.resend_configured:
            try:
                logger.info("email_send_attempt", provider="resend", to_email=to_email)
                # Use verified heallog.com domain
                from_email = "HealLog <support@heallog.com>"

                result = resend.Emails.send({
                    "from": from_email,
                    "to": to_email,
                    "subject": subject,
                    "html": html_content,
                    "text": text_content or ""
                })

                if result and result.get("id"):
                    logger.info("email_sent", provider="resend", to_email=to_email, email_id=result.get("id"))
                    return True
                else:
                    logger.warning("email_send_unexpected_result", provider="resend", result=str(result))
            except Exception as e:
                logger.warning("email_send_error", provider="resend", error=str(e))

        # Try OAuth second
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
                        logger.info("email_sent", provider="oauth", to_email=to_email)
                        return True
                    else:
                        logger.warning("email_send_failed", provider="oauth", message=message)
                except Exception as e:
                    logger.warning("email_send_error", provider="oauth", error=str(e))

        # Fallback to basic SMTP
        if self.smtp_configured:
            try:
                logger.info("email_send_attempt", provider="smtp", to_email=to_email, host=settings.EMAIL_HOST, port=settings.EMAIL_PORT)
                message = MIMEMultipart("alternative")
                message["From"] = settings.EMAIL_FROM
                message["To"] = to_email
                message["Subject"] = subject

                if text_content:
                    message.attach(MIMEText(text_content, "plain"))
                message.attach(MIMEText(html_content, "html"))

                # Port 465 uses implicit TLS (use_tls=True)
                # Port 587 uses STARTTLS (start_tls=True)
                use_ssl = settings.EMAIL_PORT == 465

                await aiosmtplib.send(
                    message,
                    hostname=settings.EMAIL_HOST,
                    port=settings.EMAIL_PORT,
                    username=settings.EMAIL_USER,
                    password=settings.EMAIL_PASSWORD,
                    use_tls=use_ssl,
                    start_tls=not use_ssl
                )
                logger.info("email_sent", provider="smtp", to_email=to_email)
                return True
            except aiosmtplib.SMTPAuthenticationError as e:
                logger.error(
                    "smtp_auth_failed",
                    error=str(e),
                    hint="If using Gmail, ensure App Password is used with 2-Step Verification enabled"
                )
            except aiosmtplib.SMTPConnectError as e:
                logger.error(
                    "smtp_connect_failed",
                    host=settings.EMAIL_HOST,
                    port=settings.EMAIL_PORT,
                    error=str(e)
                )
            except Exception as e:
                logger.error("smtp_error", error_type=type(e).__name__, error=str(e))

        # Final fallback: console logging (development mode only)
        if settings.ENV == "development":
            logger.info("email_dev_mode", to_email=to_email, subject=subject)
            return True  # Return True in dev mode to not break flow
        else:
            # In production, fail if no email method worked
            logger.error(
                "email_send_failed_all_providers",
                to_email=to_email,
                oauth_configured=self.oauth_configured,
                smtp_configured=self.smtp_configured
            )
            return False
    
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
    <!-- SECURITY: Do not expose any part of the token in preheader to prevent caching by email clients -->
    <div style="display: none; max-height: 0; overflow: hidden;">
        Reset your HealLog password. Valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f7fa;">
        <tr>
            <td style="padding: 40px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 24px 16px 24px; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;">🏥</div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #10b981;">HealLog</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 24px;">
                            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600; color: #dc2626; text-align: center;">Password Reset Request</h2>
                            <p style="margin: 0 0 6px 0; font-size: 15px; color: #6b7280; line-height: 1.5;">Hello <strong style="color: #1f2937;">{full_name}</strong>,</p>
                            <p style="margin: 0 0 20px 0; font-size: 15px; color: #6b7280; line-height: 1.5;">Copy the token below and paste it in the HealLog app to reset your password:</p>
                        </td>
                    </tr>

                    <!-- Reset Token Box - Mobile Friendly -->
                    <tr>
                        <td style="padding: 0 24px;">
                            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 12px; padding: 20px 16px; text-align: center;">
                                <p style="margin: 0 0 8px 0; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">📋 TAP & HOLD TO COPY</p>
                                <p style="margin: 0; font-size: 16px; font-weight: 700; color: #ffffff; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Courier New', monospace; word-break: break-all; line-height: 1.6; letter-spacing: 0.5px; -webkit-user-select: all; user-select: all;">{reset_token}</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Copy Hint -->
                    <tr>
                        <td style="padding: 12px 24px 0 24px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                💡 <strong>Tip:</strong> Long-press the token above to select and copy it
                            </p>
                        </td>
                    </tr>

                    <!-- Timer Warning -->
                    <tr>
                        <td style="padding: 16px 24px 0 24px;">
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 12px 14px;">
                                <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.4;">
                                    ⏰ <strong>Expires in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes</strong>
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 12px 24px 0 24px;">
                            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 12px 14px;">
                                <p style="margin: 0; font-size: 12px; color: #991b1b; line-height: 1.4;">
                                    <strong>Didn't request this?</strong> Ignore this email. Your password won't change.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 24px 28px 24px;">
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0 0 16px 0;">
                            <p style="margin: 0; font-size: 11px; color: #9ca3af; text-align: center;">
                                &copy; 2026 HealLog. All rights reserved.<br>
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

YOUR RESET TOKEN (copy this):
-----------------------------
{reset_token}
-----------------------------

This token expires in {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes.

Open the HealLog app, go to "Forgot Password", and paste this token to create a new password.

DIDN'T REQUEST THIS?
If you didn't request a password reset, ignore this email. Your password won't change.

---
HealLog - Patient Management Made Simple
https://heallog.com

(c) 2026 HealLog. All rights reserved.
        """
        
        success = await self.send_email(email, subject, html_content, text_content)
        if success:
            return True, "Password reset email sent successfully"
        return False, "Failed to send password reset email"


# Singleton instance
email_service = EmailService()

