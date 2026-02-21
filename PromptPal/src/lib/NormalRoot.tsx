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
  // Validate environment variables on app startup (non-blocking in development)
  useEffect(() => {
    validateEnvironment();
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
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
