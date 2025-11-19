/**
 * Logger Utility
 *
 * Purpose: Conditional logging for development vs production
 * Only logs in development mode to reduce console noise
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (always)
   */
  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Log errors (always)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log debug messages (only in development with verbose flag)
   */
  debug: (...args: any[]) => {
    if (isDevelopment && localStorage.getItem('debug') === 'true') {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log auth-related messages (controllable)
   */
  auth: (...args: any[]) => {
    if (isDevelopment && localStorage.getItem('debug_auth') !== 'false') {
      console.log('🔐', ...args);
    }
  },

  /**
   * Log group start (only in development)
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * Log group end (only in development)
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
};

export default logger;
