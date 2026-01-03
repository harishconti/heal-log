/**
 * Centralized logging utility for the web dashboard.
 *
 * In development, logs are output to console.
 * In production, error logs are still output but debug/info are suppressed.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.info('User logged in', { userId: '123' });
 *   logger.error('Failed to fetch data', error);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDevelopment = import.meta.env.DEV;

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Minimum log level for production
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
};

export default logger;
