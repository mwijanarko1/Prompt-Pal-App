import { ConvexHttpClient } from "convex/browser";
import { getClerkInstance } from '@clerk/clerk-expo';
import { logger } from "./logger";

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

// Initialize authentication on client creation
setupAuth().catch(error => {
  console.error('ConvexHttpClient: Failed to initialize auth:', error);
});

// Set up authentication refresh (every 45 minutes)
setInterval(() => {
  setupAuth().catch(error => {
    console.error('ConvexHttpClient: Failed to refresh auth:', error);
  });
}, 45 * 60 * 1000);

// Export the client (authentication will be set up automatically)
export { client as convexHttpClient };