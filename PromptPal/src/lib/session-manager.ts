import { logger } from './logger';

type SignOutCallback = () => Promise<void>;

let signOutCallback: SignOutCallback | null = null;

let lastSignOutTime = 0;
const SIGN_OUT_DEBOUNCE_MS = 5000;

export const registerSignOutCallback = (callback: SignOutCallback) => {
  signOutCallback = callback;
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

export const hasSignOutCallback = () => {
  return signOutCallback !== null;
};
