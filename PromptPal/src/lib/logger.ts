/**
 * Centralized logging utility for consistent error handling and debugging
 * with automatic sensitive data redaction for production safety.
 */

// Fields that should be redacted from logs
const SENSITIVE_FIELDS = new Set([
  'password',
  'token',
  'authToken',
  'accessToken',
  'refreshToken',
  'apiKey',
  'apiSecret',
  'secret',
  'privateKey',
  'creditCard',
  'ssn',
  'email',
  'phone',
  'address',
  'authorization',
  'cookie',
  'sessionId',
]);

/**
 * Redact sensitive values from an object
 */
function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (typeof data === 'string') {
    // Check if the string itself might be sensitive (e.g., a token)
    if (data.length > 20 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data)) {
      // Likely a JWT token - redact
      return '[REDACTED_JWT]';
    }
    return data;
  }
  
  if (typeof data !== 'object') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }
  
  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = Array.from(SENSITIVE_FIELDS).some(sensitive => 
      lowerKey.includes(sensitive.toLowerCase())
    );
    
    if (isSensitive) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactSensitiveData(value);
    }
  }
  
  return redacted;
}

/**
 * Check if running in production environment
 */
function isProduction(): boolean {
  return !__DEV__;
}

export const logger = {
  /**
   * Log error messages with context
   * @param context - The context/module where the error occurred
   * @param error - The error object or message
   * @param additionalData - Optional additional data to log
   */
  error: (context: string, error: unknown, additionalData?: Record<string, unknown>) => {
    const redactedData = additionalData ? redactSensitiveData(additionalData) : undefined;
    
    if (isProduction()) {
      // In production, log to a structured logging service
      // For now, use console.error with redacted data
      console.error(`[ERROR][${context}]`, error, redactedData || '');
    } else {
      console.error(`[${context}]`, error, redactedData || '');
    }
  },

  /**
   * Log warning messages with context
   * @param context - The context/module where the warning occurred
   * @param message - The warning message
   * @param additionalData - Optional additional data to log
   */
  warn: (context: string, message: string, additionalData?: Record<string, unknown>) => {
    const redactedData = additionalData ? redactSensitiveData(additionalData) : undefined;
    
    if (isProduction()) {
      console.warn(`[WARN][${context}]`, message, redactedData || '');
    } else {
      console.warn(`[${context}]`, message, redactedData || '');
    }
  },

  /**
   * Log info messages with context
   * @param context - The context/module
   * @param message - The info message
   * @param additionalData - Optional additional data to log
   */
  info: (context: string, message: string, additionalData?: Record<string, unknown>) => {
    const redactedData = additionalData ? redactSensitiveData(additionalData) : undefined;
    
    if (isProduction()) {
      console.info(`[INFO][${context}]`, message, redactedData || '');
    } else {
      console.info(`[${context}]`, message, redactedData || '');
    }
  },

  /**
   * Log debug messages with context
   * Only logs in development mode
   * @param context - The context/module
   * @param message - The debug message
   * @param additionalData - Optional additional data to log
   */
  debug: (context: string, message: string, additionalData?: Record<string, unknown>) => {
    if (__DEV__) {
      const redactedData = additionalData ? redactSensitiveData(additionalData) : undefined;
      console.debug(`[DEBUG][${context}]`, message, redactedData || '');
    }
  },
  
  /**
   * Log structured events for analytics/monitoring
   * @param event - Event name
   * @param data - Event data (will be redacted)
   */
  event: (event: string, data?: Record<string, unknown>) => {
    const redactedData = data ? redactSensitiveData(data) : undefined;
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      data: redactedData,
    };
    
    if (isProduction()) {
      // In production, send to analytics service
      console.log(JSON.stringify(logEntry));
    } else {
      console.log('[EVENT]', logEntry);
    }
  },
};