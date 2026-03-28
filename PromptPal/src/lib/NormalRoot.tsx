import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProviderWrapper, useAuth } from '@/lib/clerk';
import { validateEnvironment } from '@/lib/env';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { refreshAuth } from '@/lib/convex-client';
import { configureRevenueCat } from '@/lib/subscriptions';
import { useSubscriptionStore } from '@/features/subscription/store';
import "../app/global.css";

// Initialize Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error(
    "EXPO_PUBLIC_CONVEX_URL is required. Set it via EAS: eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value <url>"
  );
}
const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
});

/**
 * Convex provider wrapper that uses Clerk's useAuth hook
 */
function ConvexProviderWrapper({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = !!publishableKey && publishableKey !== 'your_clerk_publishable_key_here';

  if (!isClerkConfigured) {
    return (
      <ConvexProvider client={convex}>
        {children}
      </ConvexProvider>
    );
  }

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

/**
 * Component that handles app initialization after Clerk provider is set up
 */
function AppInitializer() {
  const { isSignedIn, userId } = useAuth();
  const syncFromRevenueCat = useSubscriptionStore((state) => state.syncFromRevenueCat);
  const finishGateCheckWithoutClient = useSubscriptionStore((state) => state.finishGateCheckWithoutClient);

  // Handle non-reactive Convex client authentication
  useEffect(() => {
    if (isSignedIn) {
      refreshAuth().catch(err => console.error('Failed to refresh Convex auth', err));
    }
  }, [isSignedIn]);

  useEffect(() => {
    configureRevenueCat(userId)
      .then((configured) => {
        if (configured) {
          return syncFromRevenueCat();
        }
        finishGateCheckWithoutClient();
      })
      .catch((error) => {
        console.warn('[RevenueCat] Configure failed', error);
        finishGateCheckWithoutClient();
      });
  }, [syncFromRevenueCat, finishGateCheckWithoutClient, userId]);

  // Validate environment variables on app startup (non-blocking in development)
  useEffect(() => {
    try {
      validateEnvironment();
    } catch (error) {
      // Avoid hard-aborting startup from environment validation in release builds.
      console.error('[Environment]', error);
    }
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="paywall" />
          <Stack.Screen name="game" />
          <Stack.Screen name="library/[resourceId]" />
        </Stack>
        <StatusBar style="light" />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function NormalRoot() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ClerkProviderWrapper>
        <ConvexProviderWrapper>
          <AppInitializer />
        </ConvexProviderWrapper>
      </ClerkProviderWrapper>
    </GestureHandlerRootView>
  );
}
