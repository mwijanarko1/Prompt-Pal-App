import { useGameStore } from '@/features/game/store';
import { convexHttpClient } from '@/lib/convex-client';
import { api } from '../../convex/_generated/api.js';
import { logger } from '@/lib/logger';

/**
 * Hook that provides functionality to manually sync game state with the backend
 * Auto-sync on app startup is now handled by the SyncManager
 */
export function useGameStateSync() {
  const { getStateForBackend } = useGameStore();

  // Return function to manually sync back to backend
  const syncToBackend = async () => {
    try {
      const localState = getStateForBackend();

      // Convex client is already authenticated with Clerk tokens
      await convexHttpClient.mutation(api.mutations.updateUserGameState, {
        appId: "prompt-pal",
        ...localState,
      });
      logger.info('GameStateSync', 'Synced game state to backend');
    } catch (error) {
      logger.error('GameStateSync', error, { operation: 'syncToBackend' });
      throw error;
    }
  };

  return { syncToBackend };
}