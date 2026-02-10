import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
// TypeScript can miss export when package "react-native" field points to source; runtime is correct.
// @ts-expect-error - GestureHandlerRootView is exported by react-native-gesture-handler (lib/typescript/index.d.ts)
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ClerkProviderWrapper, useAuth } from '@/lib/clerk';
import { validateEnvironment } from '@/lib/env';
import { SyncManager } from '@/lib/syncManager';
import { refreshConvexAuth } from '@/lib/convex-client';
import { AuthTokenSync, SessionMonitor } from '@/lib/auth-sync';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeNetworkListener } from '@/lib/network';
import { useGameStateSync } from '@/hooks/useGameStateSync';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import "./global.css";

// Initialize Convex client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

/**
 * Convex provider wrapper that uses Clerk's useAuth hook
 */
function ConvexProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}

/**
 * Component that syncs game state after authentication is available
 */
function GameStateInitializer() {
  useGameStateSync();
  return null; // This component doesn't render anything
}

/**
 * Component that handles app initialization after Clerk provider is set up.
 * Only starts SyncManager when user is signed in to avoid "User must be authenticated" errors.
 */
function AppInitializer() {
  const { isLoaded, isSignedIn } = useAuth();

  // Validate environment variables on app startup (non-blocking in development)
  useEffect(() => {
    validateEnvironment();
  }, []);

  useEffect(() => {
    const networkUnsubscribe = initializeNetworkListener();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (!isLoaded || !isSignedIn) return;
      if (nextAppState === 'active') {
        SyncManager.setOnlineStatus(true);
        SyncManager.syncUserProgress();
      } else if (nextAppState === 'background') {
        SyncManager.syncUserProgress();
      }
    });

    return () => {
      networkUnsubscribe?.();
      subscription?.remove();
    };
  }, [isLoaded, isSignedIn]);

  // Start/stop SyncManager only when signed in. Refresh Convex HTTP auth first so sync has a token.
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      let cancelled = false;
      (async () => {
        await refreshConvexAuth();
        if (cancelled) return;
        SyncManager.startPeriodicSync();
        SyncManager.setOnlineStatus(true);
        SyncManager.syncUserProgress();
      })();
      return () => {
        cancelled = true;
        SyncManager.stopPeriodicSync();
      };
    } else {
      SyncManager.stopPeriodicSync();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthTokenSync />
        <SessionMonitor />
        <GameStateInitializer />
        <Slot />
        <StatusBar style="light" />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
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
