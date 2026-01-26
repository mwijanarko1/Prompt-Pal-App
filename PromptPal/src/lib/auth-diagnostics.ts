import { logger } from './logger';

export interface AuthDiagnostics {
  hasTokenProvider: boolean;
  lastTokenRefreshTime: number | null;
  recent401Errors: Array<{ url: string; time: number }>;
  signOutTriggered: boolean;
  lastSignOutTime: number | null;
}

const MAX_RECENT_ERRORS = 10;
const ERROR_WINDOW_MS = 60000; // 1 minute

let lastTokenRefreshTime: number | null = null;
let recent401Errors: Array<{ url: string; time: number }> = [];
let signOutTriggered = false;
let lastSignOutTime: number | null = null;

export const recordTokenRefresh = () => {
  lastTokenRefreshTime = Date.now();
  logger.debug('AuthDiagnostics', 'Token refresh recorded');
};

export const record401Error = (url: string) => {
  const now = Date.now();
  recent401Errors.push({ url, time: now });

  // Clean up old errors outside the window
  recent401Errors = recent401Errors.filter(e => now - e.time < ERROR_WINDOW_MS);

  // Keep only the most recent errors
  if (recent401Errors.length > MAX_RECENT_ERRORS) {
    recent401Errors = recent401Errors.slice(-MAX_RECENT_ERRORS);
  }

  logger.warn('AuthDiagnostics', '401 error recorded', {
    url,
    recentCount: recent401Errors.length
  });

  // If we're seeing too many 401s in a short time, log a warning
  if (recent401Errors.length >= 5) {
    logger.warn('AuthDiagnostics', 'Multiple 401 errors detected - possible authentication issue', {
      count: recent401Errors.length,
      window: ERROR_WINDOW_MS,
      urls: recent401Errors.map(e => e.url)
    });
  }
};

export const recordSignOut = () => {
  signOutTriggered = true;
  lastSignOutTime = Date.now();
};

export const resetDiagnostics = () => {
  lastTokenRefreshTime = null;
  recent401Errors = [];
  signOutTriggered = false;
  lastSignOutTime = null;
};

export const getDiagnostics = (): AuthDiagnostics => {
  return {
    hasTokenProvider: true,
    lastTokenRefreshTime,
    recent401Errors: recent401Errors.filter(e => Date.now() - e.time < ERROR_WINDOW_MS),
    signOutTriggered,
    lastSignOutTime
  };
};

export const logDiagnostics = () => {
  const diagnostics = getDiagnostics();
  logger.info('AuthDiagnostics', 'Current authentication diagnostics', {
    ...diagnostics,
    recent401Count: diagnostics.recent401Errors.length
  });
};
