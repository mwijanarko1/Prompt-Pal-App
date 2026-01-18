/**
 * Centralized logging utility for consistent error handling and debugging
 */
export const logger = {
  /**
   * Log error messages with context
   * @param context - The context/module where the error occurred
   * @param error - The error object or message
   * @param additionalData - Optional additional data to log
   */
  error: (context: string, error: unknown, additionalData?: Record<string, unknown>) => {
    console.error(`[${context}]`, error, additionalData || '');
  },

  /**
   * Log warning messages with context
   * @param context - The context/module where the warning occurred
   * @param message - The warning message
   * @param additionalData - Optional additional data to log
   */
  warn: (context: string, message: string, additionalData?: Record<string, unknown>) => {
    console.warn(`[${context}]`, message, additionalData || '');
  },

  /**
   * Log info messages with context
   * @param context - The context/module
   * @param message - The info message
   * @param additionalData - Optional additional data to log
   */
  info: (context: string, message: string, additionalData?: Record<string, unknown>) => {
    console.info(`[${context}]`, message, additionalData || '');
  },

  /**
   * Log debug messages with context
   * @param context - The context/module
   * @param message - The debug message
   * @param additionalData - Optional additional data to log
   */
  debug: (context: string, message: string, additionalData?: Record<string, unknown>) => {
    if (__DEV__) {
      console.debug(`[${context}]`, message, additionalData || '');
    }
  },
};