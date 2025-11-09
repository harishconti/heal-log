import logging
import sys
import json
from logging.handlers import RotatingFileHandler
from app.core.config import settings

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "name": record.name,
        }
        if record.exc_info:
            log_record['exc_info'] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logging():
    log_level = logging.DEBUG if settings.ENV == "development" else logging.INFO

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
    if settings.ENV == "production":
        formatter = JsonFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    file_handler.setFormatter(formatter)
    root_logger.addHandler(file_handler)

    # Sentry handler
    if settings.SENTRY_DSN:
        from sentry_sdk.integrations.logging import SentryHandler
        sentry_handler = SentryHandler(level=logging.ERROR)
        root_logger.addHandler(sentry_handler)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    logging.info("Logging configured successfully.")
