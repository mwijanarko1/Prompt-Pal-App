import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ClerkProviderWrapper } from '@/lib/clerk';
import { validateEnvironment } from '@/lib/env';
import { SyncManager } from '@/lib/syncManager';
import { logger } from '@/lib/logger';

// Validate environment variables on app startup
validateEnvironment();

export default function RootLayout() {
  useEffect(() => {
    // Start background sync when app loads
    SyncManager.startPeriodicSync();
    logger.info('App', 'Started background sync');

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

    // Handle network connectivity changes
    const networkSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // In a real app, you'd use NetInfo from @react-native-community/netinfo
      // For now, assume we're online when app is active
      SyncManager.setOnlineStatus(nextAppState === 'active');
    });

    return () => {
      SyncManager.stopPeriodicSync();
      subscription?.remove();
      networkSubscription?.remove();
      logger.info('App', 'Stopped background sync');
    };
  }, []);

  return (
    <ClerkProviderWrapper>
      <Slot />
      <StatusBar style="light" />
    </ClerkProviderWrapper>
  );
}
