import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

import logging
from app.core.config import settings

def before_send(event, hint):
    if 'request' in event.get('contexts', {}):
        request_info = event['contexts']['request']
        if 'data' in request_info:
            # Sanitize sensitive data from the request payload
            if 'password' in request_info['data']:
                request_info['data']['password'] = "[REDACTED]"
            if 'token' in request_info['data']:
                request_info['data']['token'] = "[REDACTED]"
    return event

def init_monitoring():
    """
    Initializes Sentry monitoring and error tracking.
    """
    if not settings.SENTRY_DSN:
        logging.warning("SENTRY_DSN not found. Sentry monitoring is disabled.")
        return

    try:
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[
                FastApiIntegration(),
                LoggingIntegration(
                    level=logging.INFO,        # Capture info and above as breadcrumbs
                    event_level=logging.ERROR  # Send errors as events
                ),

            ],
            environment=settings.SENTRY_ENVIRONMENT,
            traces_sample_rate=0.1,
            release="clinic-os-lite@1.0.0-beta",
            before_send=before_send,
        )
        logging.info(f"Sentry monitoring initialized for environment: {settings.SENTRY_ENVIRONMENT}")
    except Exception as e:
        logging.error(f"Failed to initialize Sentry: {e}")

def capture_exception_with_boundary(e: Exception):
    """
    Provides a simple error boundary to capture and report exceptions to Sentry.
    """
    with sentry_sdk.push_scope() as scope:
        scope.set_extra("unhandled_exception", True)
        sentry_sdk.capture_exception(e)
    logging.error(f"Unhandled exception caught by boundary: {e}", exc_info=True)
