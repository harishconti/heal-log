/**
 * Simple logger utility for consistent console logging
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      console.log('[HealLog]', ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDev) {
      console.info('[HealLog]', ...args);
    }
  },

  warn: (...args: unknown[]): void => {
    console.warn('[HealLog]', ...args);
  },

  error: (message: string, error?: unknown): void => {
    console.error('[HealLog Error]', message, error);
  },

  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug('[HealLog Debug]', ...args);
    }
  },
};
