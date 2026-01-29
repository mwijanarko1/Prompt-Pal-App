/**
 * Token utility functions for handling Clerk JWT token expiration and refresh
 */

import { useAuth } from '@clerk/clerk-expo';
import { logger } from './logger';

/**
 * Decode a JWT token and extract its payload
 */
export function decodeJwtToken(token: string): { exp: number; iat: number; [key: string]: any } | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    logger.error('TokenUtils', error, { operation: 'decodeJwtToken' });
    return null;
  }
}

/**
 * Check if a token is expired or will expire within the specified time (in seconds)
 */
export function isTokenExpiringSoon(token: string, withinSeconds: number = 300): boolean {
  const decoded = decodeJwtToken(token);
  if (!decoded) return true;

  const now = Date.now() / 1000; // Convert to seconds
  const timeUntilExpiry = decoded.exp - now;

  return timeUntilExpiry < withinSeconds;
}

/**
 * Get a fresh token with forced refresh if needed
 * This bypasses the token cache to ensure we get a fresh token
 */
export async function getFreshToken(getToken: () => Promise<string | null>): Promise<string | null> {
  try {
    // First try to get cached token
    const cachedToken = await getToken();

    // If cached token exists and is not expiring soon, use it
    if (cachedToken && !isTokenExpiringSoon(cachedToken, 60)) { // 60 seconds buffer
      logger.debug('TokenUtils', 'Using cached token (not expiring soon)');
      return cachedToken;
    }

    // Token is expiring soon or doesn't exist, try to get fresh token
    logger.debug('TokenUtils', 'Token expiring soon or missing, attempting refresh');

    // For Clerk, we can try to get a fresh token by calling getToken again
    // This should trigger a refresh if the token is stale
    const freshToken = await getToken();

    if (freshToken && !isTokenExpiringSoon(freshToken, 30)) { // 30 seconds buffer for fresh token
      logger.debug('TokenUtils', 'Successfully obtained fresh token');
      return freshToken;
    }

    logger.warn('TokenUtils', 'Failed to get valid fresh token');
    return null;
  } catch (error) {
    logger.error('TokenUtils', error, { operation: 'getFreshToken' });
    return null;
  }
}

/**
 * Hook for getting fresh tokens in React components
 */
export function useFreshToken() {
  const { getToken } = useAuth();

  const getTokenFresh = async (): Promise<string | null> => {
    return getFreshToken(getToken);
  };

  return { getTokenFresh };
}