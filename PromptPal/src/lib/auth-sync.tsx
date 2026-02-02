import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { logger } from './logger';
import { registerSignOutCallback, registerTokenRefreshCallback } from './session-manager';
import { getFreshToken } from './token-utils';

// Import API_BASE_URL from api.ts
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:1337";

/**
 * Component that synchronizes the Clerk authentication token with the AI Proxy client.
 * This must be rendered within a ClerkProvider.
 *
 * For mobile apps, we use a more robust token provider that handles refresh failures
 * and ensures tokens are always fresh.
 */
function AuthTokenSyncInner() {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      const tokenProvider = async () => {
        try {
          if (!isSignedIn) {
            logger.warn('AuthTokenSync', 'User not signed in, cannot provide token');
            return null;
          }

          // For AI proxy calls, always get a fresh token to avoid cached token expiration
          // This is critical because AI proxy tokens expire after ~2.5 minutes
          const token = await getFreshToken(getToken);

          if (!token) {
            logger.error('AuthTokenSync', 'Failed to get fresh token - session may be invalid');
            // For mobile apps, if we can't get a token, the session is likely expired
            // Sign out to force re-authentication
            await signOut();
            return null;
          }

          return token;
        } catch (error) {
          logger.error('AuthTokenSync', error, { operation: 'getFreshToken' });

          // If token refresh fails, the session is likely expired
          // Sign out to force clean re-authentication
          try {
            await signOut();
          } catch (signOutError) {
            logger.error('AuthTokenSync', signOutError, { operation: 'signOut' });
          }

          return null;
        }
      };

      // Set token provider for Unified API Client (new)
      import('./unified-api').then(({ setSharedClientTokenProvider }) => {
        setSharedClientTokenProvider(tokenProvider);
      });
    };

    if (isSignedIn) {
      // Token provider is already set above - no additional action needed
    } else {
      // Clear tokens
      import('./unified-api').then(({ setSharedClientTokenProvider }) => {
        setSharedClientTokenProvider(() => Promise.resolve(null));
      });
    }
  }, [isLoaded, isSignedIn, getToken, signOut]);

  return null;
}

/**
 * Session Monitor component that checks for session validity and handles expiration.
 * This should be used in addition to AuthTokenSync for better mobile session management.
 */
export function SessionMonitor() {
  const { getToken, isLoaded, isSignedIn, signOut } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;

    // Register the sign-out callback for use by API interceptors
    registerSignOutCallback(async () => {
      try {
        await signOut();
      } catch (error) {
        logger.error('SessionMonitor', error, { operation: 'signOut' });
        throw error;
      }
    });

    // Register the token refresh callback for use by API interceptors
    registerTokenRefreshCallback(async () => {
      try {
        if (!isSignedIn) return null;
        const token = await getToken();
        if (token) {
          // Update the shared client with the refreshed token
          import('./unified-api').then(({ setSharedClientTokenProvider }) => {
            setSharedClientTokenProvider(() => Promise.resolve(token));
          });
          logger.debug('SessionMonitor', 'API client token refreshed');
        }
        return token;
      } catch (error) {
        logger.error('SessionMonitor', error, { operation: 'refreshToken' });
        return null;
      }
    });

    // For mobile apps, we want to monitor session health
    // If user appears signed in but API calls fail with 401,
    // it likely means the session has expired server-side
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

  // Only render the inner component if Clerk is configured
  // This prevents useAuth from being called when ClerkProvider is not available
  if (!isClerkConfigured) {
    return null;
  }

  return <AuthTokenSyncInner />;
}
