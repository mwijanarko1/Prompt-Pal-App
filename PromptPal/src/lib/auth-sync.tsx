import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setTokenProvider } from './aiProxy';
import { logger } from './logger';

/**
 * Component that synchronizes the Clerk authentication token with the AI Proxy client.
 * This must be rendered within a ClerkProvider.
 */
export function AuthTokenSync() {
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
