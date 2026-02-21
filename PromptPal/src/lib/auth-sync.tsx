import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { AppState, AppStateStatus } from 'react-native';
import { logger } from './logger';
import { registerSignOutCallback } from './session-manager';

import { SyncManager } from './syncManager';
import { refreshAuth } from './convex-client';
import { initializeNetworkListener } from './network';

/**
 * Component that monitors Clerk authentication session health.
 * Convex client handles authentication automatically via tokenCache.
 */
function AuthTokenSyncInner() {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let isCancelled = false;
    let networkUnsubscribe: (() => void) | null = null;
    let appStateSubscription: { remove: () => void } | null = null;

    const stopSyncServices = () => {
      try {
        networkUnsubscribe?.();
      } catch (error) {
        logger.error('AuthTokenSync', 'Failed to stop network listener', { error });
      }
      networkUnsubscribe = null;

      try {
        appStateSubscription?.remove();
      } catch (error) {
        logger.error('AuthTokenSync', 'Failed to remove AppState listener', { error });
      }
      appStateSubscription = null;

      SyncManager.stopPeriodicSync();
    };

    const startSyncServices = () => {
      SyncManager.startPeriodicSync().catch((error) => {
        logger.error('AuthTokenSync', 'Failed to start periodic sync', { error });
      });

      try {
        networkUnsubscribe = initializeNetworkListener();
      } catch (error) {
        logger.error('AuthTokenSync', 'Failed to initialize network listener', { error });
      }

      try {
        appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            SyncManager.setOnlineStatus(true);
            SyncManager.syncUserProgress();
          } else if (nextAppState === 'background') {
            SyncManager.syncUserProgress();
          }
        });
      } catch (error) {
        logger.error('AuthTokenSync', 'Failed to initialize AppState listener', { error });
      }
    };

    if (!isSignedIn) {
      logger.warn('AuthTokenSync', 'User not signed in');
      SyncManager.setAuthenticated(false);
      stopSyncServices();
      return;
    }

    logger.info('AuthTokenSync', 'User signed in, refreshing auth and syncing');

    const initializeAuthenticatedSync = async () => {
      try {
        await refreshAuth();
      } catch (error) {
        logger.error('AuthTokenSync', 'Failed to refresh auth', { error });
      }

      if (isCancelled) {
        return;
      }

      SyncManager.setAuthenticated(true);
      startSyncServices();
    };

    initializeAuthenticatedSync();

    return () => {
      isCancelled = true;
      stopSyncServices();
    };
  }, [isLoaded, isSignedIn]);

  return null;
}

/**
 * Session Monitor component that checks for session validity and handles expiration.
 */
export function SessionMonitor() {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Register sign-out callback
    registerSignOutCallback(async () => {
      try {
        await signOut();
      } catch (error) {
        logger.error('SessionMonitor', error, { operation: 'signOut' });
        throw error;
      }
    });

    // For mobile apps, we want to monitor session health
    // If user appears signed in but API calls fail with 401,
    // it likely means session has expired server-side
    const checkSessionHealth = async () => {
      if (isSignedIn) {
        try {
          // Try to get a token to verify session is still valid
          const token = await getToken();
          if (!token) {
            logger.warn('SessionMonitor', 'Session appears invalid, signing out');
            await signOut();
          }
        } catch (error) {
          logger.error('SessionMonitor', error, { operation: 'checkSessionHealth' });
          // If we can't get a token, session is likely expired
          await signOut();
        }
      }
    };

    // Check session health periodically (every 5 minutes)
    const interval = setInterval(checkSessionHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, signOut, getToken]);

  return null;
}

/**
 * Wrapper component that only renders AuthTokenSync when Clerk is configured.
 * This prevents the "useAuth can only be used within ClerkProvider" error when Clerk is not set up.
 */
export function AuthTokenSync() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = publishableKey && publishableKey !== 'your_clerk_publishable_key_here';

  // Only render inner component if Clerk is configured
  if (!isClerkConfigured) {
    return null;
  }

  return <AuthTokenSyncInner />;
}
