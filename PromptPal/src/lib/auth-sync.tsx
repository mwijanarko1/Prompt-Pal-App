import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setTokenProvider } from './aiProxy';
import { logger } from './logger';

/**
 * Component that synchronizes the Clerk authentication token with the AI Proxy client.
 * This must be rendered within a ClerkProvider.
 */
function AuthTokenSyncInner() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      logger.debug('AuthTokenSync', 'Registering token provider', { isSignedIn });
      
      setTokenProvider(async () => {
        try {
          if (!isSignedIn) {
            return null;
          }
          return await getToken();
        } catch (error) {
          logger.error('AuthTokenSync', error, { operation: 'getToken' });
          return null;
        }
      });
    }
  }, [isLoaded, isSignedIn, getToken]);

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
