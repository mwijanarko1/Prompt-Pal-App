import NetInfo from '@react-native-community/netinfo';
import { SyncManager } from './syncManager';

// Debounce timer for network reconnection sync
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 5000; // 5 seconds debounce

export function initializeNetworkListener() {
  const unsubscribe = NetInfo.addEventListener(state => {
    SyncManager.setOnlineStatus(state.isConnected ?? false);

    if (state.isConnected) {
      // Clear any existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      // Debounce sync to avoid rapid triggers during network fluctuations
      debounceTimer = setTimeout(() => {
        SyncManager.syncUserProgress();
        debounceTimer = null;
      }, DEBOUNCE_MS);
    }
  });

  // Return cleanup function that also clears the debounce timer
  return () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    unsubscribe();
  };
}

export async function getNetworkState() {
  const state = await NetInfo.fetch();
  return state;
}

export function isOnline(): Promise<boolean> {
  return NetInfo.fetch().then(state => state.isConnected ?? false);
}
