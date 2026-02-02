import { useAuth } from '@clerk/clerk-expo';
import { useGameStore } from '@/features/game/store';
import { createClientWithToken } from '@/lib/unified-api';
import { logger } from '@/lib/logger';

/**
 * Hook that provides functionality to manually sync game state with the backend
 * Auto-sync on app startup is now handled by the SyncManager
 */
export function useGameStateSync() {
  const { getToken } = useAuth();
  const { getStateForBackend } = useGameStore();

  // Return function to manually sync back to backend
  const syncToBackend = async () => {
    try {
      const localState = getStateForBackend();

      // Get fresh token for this request
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Create authenticated client for this operation
      const client = createClientWithToken(token);
      await client.updateGameState(localState);
      logger.info('GameStateSync', 'Synced game state to backend');
    } catch (error) {
      logger.error('GameStateSync', error, { operation: 'syncToBackend' });
      throw error;
    }
  };

  return { syncToBackend };
}