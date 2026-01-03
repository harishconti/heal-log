/**
 * Centralized logging utility for the application.
 *
 * In development, logs are output to console.
 * In production, logs can be configured to send to a monitoring service.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Failed to fetch data', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = __DEV__;

// In production, you might want to suppress certain log levels
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level for production (only warn and error)
const PRODUCTION_MIN_LEVEL: LogLevel = 'warn';

function shouldLog(level: LogLevel): boolean {
  if (isDevelopment) {
    return true;
  }
  return LOG_LEVELS[level] >= LOG_LEVELS[PRODUCTION_MIN_LEVEL];
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    };
  }
  return { value: String(error) };
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, context));
    }
  },

  warn(message: string, context?: LogContext): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  error(message: string, error?: unknown, context?: LogContext): void {
    if (shouldLog('error')) {
      const errorContext = error ? { ...context, error: sanitizeError(error) } : context;
      console.error(formatMessage('error', message, errorContext));
    }
  },

  /**
   * Log a sync operation (commonly used in the app)
   */
  sync(message: string, context?: LogContext): void {
    this.info(`[Sync] ${message}`, context);
  },

  /**
   * Log an API operation
   */
  api(message: string, context?: LogContext): void {
    this.debug(`[API] ${message}`, context);
  },

  /**
   * Log an auth operation
   */
  auth(message: string, context?: LogContext): void {
    this.info(`[Auth] ${message}`, context);
  },
};

export default logger;
