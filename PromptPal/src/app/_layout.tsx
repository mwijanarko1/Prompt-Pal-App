import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProviderWrapper, useAuth } from '@/lib/clerk';
import { validateEnvironment } from '@/lib/env';
import { SyncManager } from '@/lib/syncManager';
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
 * Component that handles app initialization after Clerk provider is set up
 */
function AppInitializer() {
  // Validate environment variables on app startup (non-blocking in development)
  useEffect(() => {
    validateEnvironment();
  }, []);

  useEffect(() => {
    // Start background sync when app loads
    SyncManager.startPeriodicSync();

    // Initialize network connectivity listener
    const networkUnsubscribe = initializeNetworkListener();

    // Sync on app focus and handle online/offline status
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        SyncManager.setOnlineStatus(true);
        SyncManager.syncUserProgress();
      } else if (nextAppState === 'background') {
        // App going to background, ensure final sync
        SyncManager.syncUserProgress();
      }
    });

    return () => {
      networkUnsubscribe?.();
      SyncManager.stopPeriodicSync();
      subscription?.remove();
    };
  }, []);

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
    <ClerkProviderWrapper>
      <ConvexProviderWrapper>
        <AppInitializer />
      </ConvexProviderWrapper>
    </ClerkProviderWrapper>
  );
}
