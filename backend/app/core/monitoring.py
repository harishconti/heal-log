import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import os
import logging

def init_monitoring():
    """
    Initializes Sentry monitoring and error tracking.
    """
    sentry_dsn = os.getenv("SENTRY_DSN")
    environment = os.getenv("SENTRY_ENVIRONMENT", "beta")

    if not sentry_dsn:
        logging.warning("SENTRY_DSN not found. Sentry monitoring is disabled.")
        return

    try:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FastApiIntegration(),
                LoggingIntegration(
                    level=logging.INFO,        # Capture info and above as breadcrumbs
                    event_level=logging.ERROR  # Send errors as events
                ),
            ],
            environment=environment,
            traces_sample_rate=0.1,
            # Set release to track deployments
            release="clinic-os-lite@1.0.0-beta"
        )
        logging.info(f"Sentry monitoring initialized for environment: {environment}")
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
