import { ConvexHttpClient } from "convex/browser";
import { getClerkInstance } from '@clerk/clerk-expo';
import { logger } from "./logger";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is required. For EAS builds: eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value <url>"
  );
}

const client = new ConvexHttpClient(convexUrl);

/**
 * Get a fresh JWT token from Clerk for Convex authentication
 */
async function getFreshToken(): Promise<string | null> {
  try {
    // Get the Clerk instance using the proper Expo method
    const clerk = getClerkInstance();

    if (!clerk) {
      return null;
    }

    // Wait for Clerk to be fully loaded
    if (!clerk.loaded) {
      await new Promise(resolve => {
        const checkLoaded = () => {
          if (clerk.loaded) {
            resolve(void 0);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    // Check if we have an active session
    const session = clerk.session;
    if (!session) {
      return null;
    }

    // Get the JWT token from Clerk session using the 'convex' template
    // This ensures the token has the correct audience claim that Convex expects
    const token = await session.getToken({
      template: 'convex',
      leewayInSeconds: 60, // Small leeway for clock skew
    });

    if (!token) {
      return null;
    }

    // Validate that we have a proper JWT format (3 base64 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    return token;
  } catch (error) {
    return null;
  }
}

/**
 * Set up authentication for ConvexHttpClient
 */
async function setupAuth(): Promise<void> {
  const token = await getFreshToken();
  if (token) {
    client.setAuth(token);
    await scheduleTokenRefresh(token);
  } else {
    client.clearAuth();
  }
}

// Export the function to allow manual refreshment (e.g., on sign-in)
export async function refreshAuth(): Promise<void> {
  await setupAuth();
}

// Refresh token on a fixed cadence to avoid startup JWT decoding work.
const TOKEN_REFRESH_INTERVAL_MS = 45 * 60 * 1000;
let refreshTimeout: NodeJS.Timeout | null = null;

async function scheduleTokenRefresh(token: string): Promise<void> {
  if (!token) {
    return;
  }

  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }

  logger.debug('ConvexHttpClient', 'Token refresh scheduled', {
    refreshInMinutes: Math.round(TOKEN_REFRESH_INTERVAL_MS / 60000),
  });

  refreshTimeout = setTimeout(() => {
    refreshAuth().catch(error => {
      logger.error('ConvexHttpClient', 'Scheduled refresh failed', error);
    });
  }, TOKEN_REFRESH_INTERVAL_MS);
}

// Automatically retry once after auth refresh on unauthenticated error
const originalQuery = client.query.bind(client);
const originalMutation = client.mutation.bind(client);
const originalAction = client.action.bind(client);

async function wrapWithAuthRetry<T>(originalFn: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
  try {
    return await originalFn(...args);
  } catch (error: any) {
    const isAuthError = error?.message?.includes('Not authenticated') || error?.message?.includes('User must be authenticated');

    if (isAuthError) {
      logger.warn('ConvexHttpClient', 'Auth error detected, refreshing token and retrying...');
      await refreshAuth();
      return await originalFn(...args);
    }
    throw error;
  }
}

// Override client methods to automatically handle auth retries
client.query = ((...args: any[]) => wrapWithAuthRetry(originalQuery, ...args)) as any;
client.mutation = ((...args: any[]) => wrapWithAuthRetry(originalMutation, ...args)) as any;
client.action = ((...args: any[]) => wrapWithAuthRetry(originalAction, ...args)) as any;

// Export the client (authentication will be set up automatically)
export { client as convexHttpClient };
