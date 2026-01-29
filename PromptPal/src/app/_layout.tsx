import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProviderWrapper } from '@/lib/clerk';
import { validateEnvironment } from '@/lib/env';
import { SyncManager } from '@/lib/syncManager';
import { AuthTokenSync, SessionMonitor } from '@/lib/auth-sync';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeNetworkListener } from '@/lib/network';
import { useGameStateSync } from '@/hooks/useGameStateSync';
import "./global.css";

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
    logger.info('App', 'Started background sync');

    // Initialize network connectivity listener
    const networkUnsubscribe = initializeNetworkListener();
    logger.info('App', 'Initialized network listener');

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
      logger.info('App', 'Stopped background sync');
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
      <AppInitializer />
    </ClerkProviderWrapper>
  );
}
