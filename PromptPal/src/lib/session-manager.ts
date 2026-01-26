import { logger } from './logger';

type SignOutCallback = () => Promise<void>;
type TokenRefreshCallback = () => Promise<string | null>;

let signOutCallback: SignOutCallback | null = null;
let tokenRefreshCallback: TokenRefreshCallback | null = null;

let lastSignOutTime = 0;
const SIGN_OUT_DEBOUNCE_MS = 5000;

export const registerSignOutCallback = (callback: SignOutCallback) => {
  signOutCallback = callback;
  logger.debug('SessionManager', 'Sign-out callback registered');
};

export const registerTokenRefreshCallback = (callback: TokenRefreshCallback) => {
  tokenRefreshCallback = callback;
  logger.debug('SessionManager', 'Token refresh callback registered');
};

export const triggerSignOut = async () => {
  if (signOutCallback) {
    const now = Date.now();
    if (now - lastSignOutTime < SIGN_OUT_DEBOUNCE_MS) {
      logger.debug('SessionManager', 'Sign-out recently triggered, skipping');
      return;
    }
    lastSignOutTime = now;

    try {
      logger.warn('SessionManager', 'Triggering sign-out due to session expiration');
      await signOutCallback();
    } catch (error) {
      logger.error('SessionManager', error, { operation: 'triggerSignOut' });
    }
  } else {
    logger.warn('SessionManager', 'No sign-out callback registered - cannot sign out');
  }
};

export const tryRefreshToken = async (): Promise<string | null> => {
  if (tokenRefreshCallback) {
    try {
      logger.debug('SessionManager', 'Attempting to refresh token');
      const newToken = await tokenRefreshCallback();
      if (newToken) {
        logger.info('SessionManager', 'Token refreshed successfully');
        return newToken;
      }
      logger.warn('SessionManager', 'Token refresh returned null');
    } catch (error) {
      logger.error('SessionManager', error, { operation: 'tryRefreshToken' });
    }
  } else {
    logger.warn('SessionManager', 'No token refresh callback registered');
  }
  return null;
};

export const hasSignOutCallback = () => {
  return signOutCallback !== null;
};
