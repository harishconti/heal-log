"""
Logging configuration for the application.

This module provides:
- Context variables for request/user tracking across async call stack
- JSON formatter for production logs
- Standard logging setup with file rotation
- Integration with structlog for structured logging
"""
import logging
import sys
import json
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from app.core.config import settings

# Context variable for request-scoped data propagation
# This allows the request ID to be accessed anywhere in the async call stack
request_id_var: ContextVar[str] = ContextVar("request_id", default="")
user_id_var: ContextVar[str] = ContextVar("user_id", default="")


def get_request_id() -> str:
    """Get the current request ID from context. Returns empty string if not set."""
    return request_id_var.get()


def set_request_id(request_id: str) -> None:
    """Set the request ID in the current context."""
    request_id_var.set(request_id)


def get_context_user_id() -> str:
    """Get the current user ID from context. Returns empty string if not set."""
    return user_id_var.get()


def set_context_user_id(user_id: str) -> None:
    """Set the user ID in the current context."""
    user_id_var.set(user_id)


class JsonFormatter(logging.Formatter):
    """
    JSON log formatter that automatically includes request context.
    Request ID and user ID are pulled from contextvars when available.
    """
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
        }
        # Include request context if available
        request_id = get_request_id()
        if request_id:
            log_record["request_id"] = request_id

        user_id = get_context_user_id()
        if user_id and user_id not in ("anonymous", "invalid_token"):
            log_record["user_id"] = user_id

        if record.exc_info:
            log_record['exc_info'] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logging():
    """
    Configure application logging with file rotation and optional Sentry integration.

    Also configures structlog for structured logging with sensitive data masking.
    """
    log_level = logging.DEBUG if settings.ENV == "development" else logging.INFO
    is_production = settings.ENV == "production"

    root_logger = logging.getLogger()
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    logging.basicConfig(level=log_level, stream=sys.stdout)

    # File handler
    file_handler = RotatingFileHandler(
        "app.log", maxBytes=1024 * 1024 * 5, backupCount=5
    )
    file_handler.setLevel(log_level)

    # Formatter
    if is_production:
        formatter = JsonFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # Sentry handler
    if getattr(settings, 'SENTRY_DSN', None):
        from sentry_sdk.integrations.logging import SentryHandler
        sentry_handler = SentryHandler(level=logging.ERROR)
        root_logger.addHandler(sentry_handler)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Configure structlog for structured logging with sensitive data masking
    from app.core.logger import configure_structlog
    configure_structlog(json_format=is_production)

    logging.info("Logging configured successfully with structured logging support.")
