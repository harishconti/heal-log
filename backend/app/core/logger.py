"""
Structured logging utilities with sensitive data masking.

This module provides:
- get_logger(): Factory for creating module-specific structured loggers
- LoggerMixin: Mixin class for adding logging to services
- Sensitive data masking functions for emails, tokens, IDs, etc.
- Consistent log format across all services
"""
import re
import structlog
from typing import Any, Dict, Optional, Set
from functools import lru_cache

from app.core.logging_config import get_request_id, get_context_user_id


# Fields that should always be masked in logs
SENSITIVE_FIELDS: Set[str] = frozenset({
    'password',
    'password_hash',
    'current_password',
    'new_password',
    'token',
    'access_token',
    'refresh_token',
    'otp_code',
    'otp',
    'secret',
    'api_key',
    'authorization',
    'cookie',
    'ssn',
    'credit_card',
})

# Partial masking fields (show partial info)
PARTIAL_MASK_FIELDS: Set[str] = frozenset({
    'email',
    'phone',
    'ip_address',
    'client_ip',
})


def mask_email(email: Optional[str]) -> str:
    """
    Mask email for logging.

    Examples:
        test@example.com -> tes***@***.com
        ab@x.co -> ab***@***.co
    """
    if not email or '@' not in email:
        return '***'

    local, domain = email.rsplit('@', 1)

    # Mask local part: show first 3 chars max
    if len(local) <= 3:
        masked_local = local[0] + '***' if local else '***'
    else:
        masked_local = local[:3] + '***'

    # Mask domain: show only TLD
    domain_parts = domain.rsplit('.', 1)
    if len(domain_parts) == 2:
        masked_domain = '***.' + domain_parts[1]
    else:
        masked_domain = '***'

    return f"{masked_local}@{masked_domain}"


def mask_phone(phone: Optional[str]) -> str:
    """
    Mask phone number for logging.

    Examples:
        +1234567890 -> +1***7890
        1234567890 -> ***7890
    """
    if not phone:
        return '***'

    # Remove non-digit characters for processing
    digits = re.sub(r'\D', '', phone)

    if len(digits) <= 4:
        return '***'

    # Show last 4 digits
    prefix = '+' if phone.startswith('+') else ''
    return f"{prefix}***{digits[-4:]}"


def mask_ip(ip: Optional[str]) -> str:
    """
    Mask IP address for logging.

    Examples:
        192.168.1.100 -> 192.168.***.***
        2001:db8::1 -> 2001:db8::***
    """
    if not ip:
        return '***'

    # IPv4
    if '.' in ip and ':' not in ip:
        parts = ip.split('.')
        if len(parts) == 4:
            return f"{parts[0]}.{parts[1]}.***.***"

    # IPv6
    if ':' in ip:
        parts = ip.split(':')
        if len(parts) >= 2:
            return f"{parts[0]}:{parts[1]}::***"

    return '***'


def mask_token(token: Optional[str]) -> str:
    """
    Mask tokens for logging (show first 8 chars only).

    Examples:
        eyJhbGciOiJIUzI1NiIs... -> eyJhbGci...
    """
    if not token:
        return '***'

    if len(token) <= 8:
        return '***'

    return f"{token[:8]}..."


def mask_id(id_value: Optional[str]) -> str:
    """
    Mask IDs for logging (show first 8 chars).

    Examples:
        550e8400-e29b-41d4-a716-446655440000 -> 550e8400...
    """
    if not id_value:
        return '***'

    id_str = str(id_value)
    if len(id_str) <= 8:
        return id_str

    return f"{id_str[:8]}..."


def mask_value(key: str, value: Any) -> Any:
    """
    Automatically mask a value based on its key name.
    """
    if value is None:
        return None

    key_lower = key.lower()

    # Fully masked fields
    if key_lower in SENSITIVE_FIELDS:
        return '***'

    # Partial masking
    if key_lower == 'email':
        return mask_email(str(value))
    if key_lower in ('phone', 'phone_number'):
        return mask_phone(str(value))
    if key_lower in ('ip', 'ip_address', 'client_ip'):
        return mask_ip(str(value))
    if 'token' in key_lower:
        return mask_token(str(value))
    if key_lower.endswith('_id') and key_lower not in ('request_id',):
        return mask_id(str(value))

    return value


def mask_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mask sensitive fields in a dictionary.

    Args:
        data: Dictionary that may contain sensitive values

    Returns:
        New dictionary with sensitive values masked
    """
    if not data:
        return data

    return {key: mask_value(key, value) for key, value in data.items()}


class ContextProcessor:
    """
    Structlog processor that adds request context to all log entries.
    """

    def __call__(
        self,
        logger: Any,
        method_name: str,
        event_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Add request context
        request_id = get_request_id()
        if request_id:
            event_dict['request_id'] = request_id

        user_id = get_context_user_id()
        if user_id and user_id not in ('anonymous', 'invalid_token', ''):
            event_dict['user_id'] = mask_id(user_id)

        return event_dict


class SensitiveDataProcessor:
    """
    Structlog processor that masks sensitive data in log entries.
    """

    def __call__(
        self,
        logger: Any,
        method_name: str,
        event_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Mask sensitive fields
        for key in list(event_dict.keys()):
            if key not in ('event', 'level', 'timestamp', 'logger', 'module'):
                event_dict[key] = mask_value(key, event_dict[key])

        return event_dict


def configure_structlog(json_format: bool = False) -> None:
    """
    Configure structlog with custom processors for the application.

    Args:
        json_format: If True, output JSON format (for production)
    """
    processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        ContextProcessor(),
        SensitiveDataProcessor(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_format:
        processors.append(structlog.processors.JSONRenderer())
    else:
        processors.append(structlog.dev.ConsoleRenderer(colors=True))

    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


@lru_cache(maxsize=128)
def get_logger(module: str) -> structlog.BoundLogger:
    """
    Get a structured logger for a specific module.

    Args:
        module: The module name (typically __name__)

    Returns:
        A bound structlog logger with the module context

    Example:
        logger = get_logger(__name__)
        logger.info("user_created", user_id=user_id, plan="basic")
    """
    return structlog.get_logger(module=module)


class LoggerMixin:
    """
    Mixin class that provides a logger property to any class.

    The logger is lazily initialized with the class name as the module.

    Example:
        class UserService(LoggerMixin):
            def create_user(self, email: str):
                self.logger.info("creating_user", email=email)
    """

    _logger: Optional[structlog.BoundLogger] = None

    @property
    def logger(self) -> structlog.BoundLogger:
        if self._logger is None:
            self._logger = get_logger(self.__class__.__name__)
        return self._logger


# Convenience functions for logging with automatic masking
def log_info(logger: structlog.BoundLogger, event: str, **kwargs: Any) -> None:
    """Log info with automatic sensitive data masking."""
    logger.info(event, **mask_dict(kwargs))


def log_warning(logger: structlog.BoundLogger, event: str, **kwargs: Any) -> None:
    """Log warning with automatic sensitive data masking."""
    logger.warning(event, **mask_dict(kwargs))


def log_error(logger: structlog.BoundLogger, event: str, **kwargs: Any) -> None:
    """Log error with automatic sensitive data masking."""
    logger.error(event, **mask_dict(kwargs))


def log_debug(logger: structlog.BoundLogger, event: str, **kwargs: Any) -> None:
    """Log debug with automatic sensitive data masking."""
    logger.debug(event, **mask_dict(kwargs))
