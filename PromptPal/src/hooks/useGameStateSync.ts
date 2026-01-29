import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { useGameStore } from '@/features/game/store';
import { createApiClient, apiClient } from '@/lib/api';
import { logger } from '@/lib/logger';

/**
 * Hook that syncs game state with the backend on app startup
 * Uses dependency injection to create authenticated API client with token from Clerk
 */
export function useGameStateSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { syncFromBackend, getStateForBackend } = useGameStore();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    // Only sync once when authentication becomes ready
    if (!isLoaded || !isSignedIn || hasSyncedRef.current) {
      return;
    }

    // Mark as synced to prevent re-runs
    hasSyncedRef.current = true;

    const syncGameState = async () => {
      try {
        // Get fresh token for this request
        const token = await getToken();
        if (!token) {
          logger.warn('GameStateSync', 'No token available for game state sync');
          // Reset flag so we can try again later if needed
          hasSyncedRef.current = false;
          return;
        }

        // Create authenticated API client with the token
        const authenticatedClient = createApiClient(token);

        // Load game state from backend
        const backendGameState = await authenticatedClient.getGameState();
        logger.info('GameStateSync', 'Loaded game state from backend', backendGameState);

        // Sync with local store
        syncFromBackend(backendGameState);

        logger.info('GameStateSync', 'Game state synced successfully');
      } catch (error) {
        logger.error('GameStateSync', error, { operation: 'syncGameState' });
        // If backend sync fails, we'll use local state (already initialized with defaults)
        logger.warn('GameStateSync', 'Using local game state due to backend sync failure');
        // Reset flag so we can try again later if needed
        hasSyncedRef.current = false;
      }
    };

    syncGameState();
  }, [isLoaded, isSignedIn]); // Only depend on auth state, not functions

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
      const client = createApiClient(token);
      await client.updateGameState(localState);
      logger.info('GameStateSync', 'Synced game state to backend');
    } catch (error) {
      logger.error('GameStateSync', error, { operation: 'syncToBackend' });
      throw error;
    }
  };

  return { syncToBackend };
}