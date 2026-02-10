import { ConvexHttpClient } from "convex/browser";
import { getClerkInstance } from '@clerk/clerk-expo';
import { logger } from "./logger";

// Base64 decoding for React Native
function atob(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  
  for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  
  return output;
}

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("EXPO_PUBLIC_CONVEX_URL environment variable is not set");
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
  } else {
    client.clearAuth();
  }
}

// Export the function to allow manual refreshment (e.g., on sign-in)
export async function refreshAuth(): Promise<void> {
  await setupAuth();
}

// Initialize authentication on client creation
setupAuth().catch(error => {
  console.error('ConvexHttpClient: Failed to initialize auth:', error);
});

// Parse JWT token to get expiration time
function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null; // Convert to milliseconds
  } catch {
    return null;
  }
}

// Refresh token 5 minutes before expiry
async function scheduleTokenRefresh(token: string): Promise<void> {
  const expiry = getTokenExpiry(token);
  if (!expiry) {
    // Fallback: refresh every 45 minutes if we can't parse expiry
    setTimeout(() => {
      refreshAuth().catch(error => {
        logger.error('ConvexHttpClient', 'Scheduled refresh failed', error);
      });
    }, 45 * 60 * 1000);
    return;
  }
  
  const refreshTime = expiry - 5 * 60 * 1000; // 5 minutes before expiry
  const delay = Math.max(0, refreshTime - Date.now());
  
  logger.debug('ConvexHttpClient', 'Token refresh scheduled', { 
    refreshInMinutes: Math.round(delay / 60000),
    expiresAt: new Date(expiry).toISOString()
  });
  
  setTimeout(() => {
    refreshAuth().catch(error => {
      logger.error('ConvexHttpClient', 'Scheduled refresh failed', error);
    });
  }, delay);
}

// Schedule initial token refresh after setup
setupAuth().then(async () => {
  const token = await getFreshToken();
  if (token) {
    await scheduleTokenRefresh(token);
  }
}).catch(error => {
  logger.error('ConvexHttpClient', 'Failed to initialize auth', error);
});

// Export the client (authentication will be set up automatically)
export { client as convexHttpClient };