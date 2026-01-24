import { useGameStore, GameState } from '@/features/game/store';
import { logger } from '@/lib/logger';

// Constants
const SYNC_INTERVAL_MS = 30000; // 30 seconds
const MAX_SYNC_RETRIES = 3;
const SYNC_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Manages synchronization of game state with the backend
 */
export class SyncManager {
  private static syncInProgress = false;
  private static syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private static isOnline = true;

  /**
   * Starts periodic background synchronization
   */
  static startPeriodicSync(): void {
    if (this.syncIntervalId) {
      logger.warn('SyncManager', 'Periodic sync already running');
      return;
    }

    logger.info('SyncManager', 'Starting periodic sync', { interval: SYNC_INTERVAL_MS });
    this.syncIntervalId = setInterval(() => {
      this.syncUserProgress();
    }, SYNC_INTERVAL_MS);
  }

  /**
   * Stops periodic background synchronization
   */
  static stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
      logger.info('SyncManager', 'Stopped periodic sync');
    }
  }

  /**
   * Manually triggers a sync of user progress
   * @returns Promise that resolves when sync is complete
   */
  static async syncUserProgress(): Promise<void> {
    if (this.syncInProgress) {
      logger.debug('SyncManager', 'Sync already in progress, skipping');
      return;
    }

    if (!this.isOnline) {
      logger.debug('SyncManager', 'Offline, skipping sync');
      return;
    }

    try {
      this.syncInProgress = true;

      // Get local game state
      const gameState = useGameStore.getState();

      // For now, we'll implement a placeholder sync
      // In a real implementation, this would call the backend API
      await this.performSync(gameState);

      logger.info('SyncManager', 'Progress synced successfully');

    } catch (error) {
      logger.error('SyncManager', error, { operation: 'syncUserProgress' });
      // Don't throw - sync failures shouldn't break gameplay
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Performs the actual synchronization with retry logic
   * @param gameState - Current game state to sync
   * @param retryCount - Current retry attempt (internal use)
   */
  private static async performSync(
    gameState: GameState,
    retryCount = 0
  ): Promise<void> {
    try {
      // Placeholder: In a real implementation, this would make an API call
      // await api.post('/user-progress/sync', gameState);

      // TODO: Replace with actual backend sync API call
      // await api.post('/user-progress/sync', gameState);

      // Simulate network delay for now (remove in production)
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      if (retryCount < MAX_SYNC_RETRIES) {
        logger.warn('SyncManager', `Sync failed, retrying (${retryCount + 1}/${MAX_SYNC_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, SYNC_RETRY_DELAY_MS * (retryCount + 1)));
        return this.performSync(gameState, retryCount + 1);
      }

      // Mark as offline if sync consistently fails
      this.isOnline = false;
      throw error;
    }
  }

  /**
   * Updates online status and triggers sync if coming back online
   * @param online - Whether the device is online
   */
  static setOnlineStatus(online: boolean): void {
    const wasOffline = !this.isOnline;
    this.isOnline = online;

    if (online && wasOffline) {
      logger.info('SyncManager', 'Back online, triggering sync');
      // Trigger immediate sync when coming back online
      this.syncUserProgress();
    }
  }

  /**
   * Gets current sync status
   * @returns Object with sync status information
   */
  static getSyncStatus(): {
    isOnline: boolean;
    syncInProgress: boolean;
    periodicSyncActive: boolean;
  } {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      periodicSyncActive: this.syncIntervalId !== null,
    };
  }

  /**
   * Forces a sync regardless of current state (useful for manual sync)
   * @returns Promise that resolves when sync is complete
   */
  static async forceSync(): Promise<void> {
    const previousSyncState = this.syncInProgress;
    this.syncInProgress = false; // Allow forced sync

    try {
      await this.syncUserProgress();
    } finally {
      this.syncInProgress = previousSyncState;
    }
  }
}