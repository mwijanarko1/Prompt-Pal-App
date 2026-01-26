import NetInfo from '@react-native-community/netinfo';
import { SyncManager } from './syncManager';

export function initializeNetworkListener() {
  const unsubscribe = NetInfo.addEventListener(state => {
    SyncManager.setOnlineStatus(state.isConnected ?? false);
    if (state.isConnected) {
      SyncManager.syncUserProgress();
    }
  });
  return unsubscribe;
}

export async function getNetworkState() {
  const state = await NetInfo.fetch();
  return state;
}

export function isOnline(): Promise<boolean> {
  return NetInfo.fetch().then(state => state.isConnected ?? false);
}
