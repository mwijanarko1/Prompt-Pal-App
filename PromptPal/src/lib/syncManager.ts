import { useGameStore, GameState } from '@/features/game/store';
import { logger } from '@/lib/logger';
import { apiClient } from './api';

// Constants
const SYNC_INTERVAL_MS = 30000; // 30 seconds
const MAX_SYNC_RETRIES = 3;
const SYNC_RETRY_DELAY_MS = 1000; // 1 second
const OFFLINE_QUEUE_KEY = 'promptpal_offline_queue';
const LAST_SYNC_KEY = 'promptpal_last_sync_timestamp';

// Storage adapter (same pattern as game store)
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      if (typeof window !== "undefined") {
        return window.localStorage.getItem(name);
      } else {
        // Use expo-secure-store on native platforms
        const { SecureStore } = await import('expo-secure-store');
        return await SecureStore.getItemAsync(name);
      }
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(name, value);
      } else {
        const { SecureStore } = await import('expo-secure-store');
        await SecureStore.setItemAsync(name, value);
      }
    } catch {
      // Handle error silently
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(name);
      } else {
        const { SecureStore } = await import('expo-secure-store');
        await SecureStore.deleteItemAsync(name);
      }
    } catch {
      // Handle error silently
    }
  },
};

// Types
interface SyncQueueItem {
  id: string;
  timestamp: number;
  gameState: Partial<GameState>;
  retries: number;
}

interface ConflictResolution {
  strategy: 'local-wins' | 'server-wins' | 'merge' | 'manual';
  timestamp: number;
}

interface SyncStatus {
  isOnline: boolean;
  syncInProgress: boolean;
  periodicSyncActive: boolean;
  lastSyncTimestamp: number | null;
  queuedItems: number;
  lastError?: string;
}

/**
 * Manages synchronization of game state with the backend
 */
export class SyncManager {
  private static syncInProgress = false;
  private static syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private static isOnline = true;
  private static offlineQueue: SyncQueueItem[] = [];
  private static conflictResolution: ConflictResolution = {
    strategy: 'local-wins',
    timestamp: Date.now(),
  };

  /**
   * Starts periodic background synchronization
   */
  static async startPeriodicSync(): Promise<void> {
    if (this.syncIntervalId) {
      logger.warn('SyncManager', 'Periodic sync already running');
      return;
    }

    logger.info('SyncManager', 'Starting periodic sync', { interval: SYNC_INTERVAL_MS });
    await this.loadOfflineQueue();
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
   * Loads offline queue from storage
   */
  private static async loadOfflineQueue(): Promise<void> {
    try {
      const queueData = await secureStorage.getItem(OFFLINE_QUEUE_KEY);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
        logger.info('SyncManager', 'Loaded offline queue', { count: this.offlineQueue.length });
      }
    } catch (error) {
      logger.error('SyncManager', error, { operation: 'loadOfflineQueue' });
    }
  }

  /**
   * Saves offline queue to storage
   */
  private static async saveOfflineQueue(): Promise<void> {
    try {
      await secureStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.offlineQueue));
    } catch (error) {
      logger.error('SyncManager', error, { operation: 'saveOfflineQueue' });
    }
  }

  /**
   * Processes offline queue
   */
  private static async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    logger.info('SyncManager', 'Processing offline queue', { count: this.offlineQueue.length });

    const processedIds: string[] = [];

    for (const item of this.offlineQueue) {
      try {
        if (!this.isValidGameState(item.gameState)) {
          logger.warn('SyncManager', 'Invalid game state in queue, dropping', { id: item.id });
          processedIds.push(item.id);
          continue;
        }

        await this.performSync(item.gameState as GameState);
        processedIds.push(item.id);
        logger.debug('SyncManager', 'Processed queued item', { id: item.id });
      } catch (error) {
        item.retries++;
        if (item.retries >= MAX_SYNC_RETRIES) {
          logger.warn('SyncManager', 'Dropping item after max retries', { id: item.id });
          processedIds.push(item.id);
        }
      }
    }

    this.offlineQueue = this.offlineQueue.filter(item => !processedIds.includes(item.id));
    await this.saveOfflineQueue();
  }

  /**
   * Validates game state has required fields
   */
  private static isValidGameState(state: Partial<GameState>): boolean {
    return !!(
      state &&
      Array.isArray(state.unlockedLevels) &&
      Array.isArray(state.completedLevels)
    );
  }

  /**
   * Adds game state to offline queue
   */
  private static async addToOfflineQueue(gameState: Partial<GameState>): Promise<void> {
    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      gameState,
      retries: 0,
    };

    this.offlineQueue.push(item);
    await this.saveOfflineQueue();

    logger.info('SyncManager', 'Added item to offline queue', { id: item.id });
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

      // Process offline queue first
      await this.processOfflineQueue();

      // Get local game state
      const gameState = useGameStore.getState();

      // Perform sync with conflict resolution
      await this.performSync(gameState);

      // Update last sync timestamp
      await this.updateLastSyncTimestamp();

      logger.info('SyncManager', 'Progress synced successfully');

    } catch (error) {
      logger.error('SyncManager', error, { operation: 'syncUserProgress' });
      
      // Add to offline queue if sync fails
      const gameState = useGameStore.getState();
      await this.addToOfflineQueue(gameState);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Updates last sync timestamp in storage
   */
  private static async updateLastSyncTimestamp(): Promise<void> {
    try {
      await secureStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      logger.error('SyncManager', error, { operation: 'updateLastSyncTimestamp' });
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
      // Fetch server state for conflict resolution
      const serverState = await this.fetchServerProgress();

      // Resolve conflicts between local and server state
      const resolvedState = this.resolveConflicts(gameState, serverState);

      // Send resolved state to server
      await this.sendProgressToServer(resolvedState);

      // Simulate network delay (remove in production)
      // await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      if (retryCount < MAX_SYNC_RETRIES) {
        const backoffDelay = SYNC_RETRY_DELAY_MS * Math.pow(2, retryCount);
        logger.warn('SyncManager', `Sync failed, retrying (${retryCount + 1}/${MAX_SYNC_RETRIES})`, { delay: backoffDelay });
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.performSync(gameState, retryCount + 1);
      }

      // Mark as offline if sync consistently fails
      this.isOnline = false;
      throw error;
    }
  }

  /**
   * Fetches user progress from server
   */
  private static async fetchServerProgress(): Promise<Partial<GameState> | null> {
    try {
      // In a real implementation, fetch from backend
      // const serverData = await apiClient.getUserProgress(userId);
      // return serverData;

      // Placeholder: return null for now
      return null;
    } catch (error) {
      logger.warn('SyncManager', 'Failed to fetch server progress', { error });
      return null;
    }
  }

  /**
   * Sends resolved progress to server
   */
  private static async sendProgressToServer(state: Partial<GameState>): Promise<void> {
    try {
      // In a real implementation, send to backend
      // await apiClient.updateUserProgress(userId, state);

      // Placeholder: simulate success
      logger.debug('SyncManager', 'Progress sent to server', { state });
    } catch (error) {
      logger.error('SyncManager', error, { operation: 'sendProgressToServer' });
      throw error;
    }
  }

  /**
   * Resolves conflicts between local and server state
   */
  private static resolveConflicts(
    localState: GameState,
    serverState: Partial<GameState> | null
  ): Partial<GameState> {
    if (!serverState) {
      return {
        unlockedLevels: localState.unlockedLevels,
        completedLevels: localState.completedLevels,
      };
    }

    switch (this.conflictResolution.strategy) {
      case 'local-wins':
        return {
          unlockedLevels: localState.unlockedLevels,
          completedLevels: localState.completedLevels,
        };

      case 'server-wins':
        return {
          unlockedLevels: serverState.unlockedLevels || localState.unlockedLevels,
          completedLevels: serverState.completedLevels || localState.completedLevels,
        };

      case 'merge':
        return {
          unlockedLevels: Array.from(new Set([
            ...localState.unlockedLevels,
            ...(serverState.unlockedLevels || []),
          ])),
          completedLevels: Array.from(new Set([
            ...localState.completedLevels,
            ...(serverState.completedLevels || []),
          ])),
        };

      case 'manual':
        // For manual resolution, we'd typically prompt the user
        // For now, we'll use merge strategy
        return {
          unlockedLevels: Array.from(new Set([
            ...localState.unlockedLevels,
            ...(serverState.unlockedLevels || []),
          ])),
          completedLevels: Array.from(new Set([
            ...localState.completedLevels,
            ...(serverState.completedLevels || []),
          ])),
        };

      default:
        return {
          unlockedLevels: localState.unlockedLevels,
          completedLevels: localState.completedLevels,
        };
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
    } else if (!online && wasOnline) {
      logger.info('SyncManager', 'Going offline, queueing pending syncs');
    }
  }

  /**
   * Gets current sync status
   * @returns Object with sync status information
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    let lastSyncTimestamp: number | null = null;
    
    try {
      const lastSync = await secureStorage.getItem(LAST_SYNC_KEY);
      if (lastSync) {
        lastSyncTimestamp = parseInt(lastSync, 10);
      }
    } catch (error) {
      logger.warn('SyncManager', 'Failed to read last sync timestamp', { error });
    }

    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      periodicSyncActive: this.syncIntervalId !== null,
      lastSyncTimestamp,
      queuedItems: this.offlineQueue.length,
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

  /**
   * Sets conflict resolution strategy
   * @param strategy - Resolution strategy to use
   */
  static setConflictResolutionStrategy(
    strategy: 'local-wins' | 'server-wins' | 'merge' | 'manual'
  ): void {
    this.conflictResolution = {
      strategy,
      timestamp: Date.now(),
    };
    logger.info('SyncManager', 'Conflict resolution strategy updated', { strategy });
  }

  /**
   * Gets current conflict resolution strategy
   * @returns Current resolution strategy
   */
  static getConflictResolutionStrategy(): ConflictResolution {
    return { ...this.conflictResolution };
  }

  /**
   * Clears the offline queue
   */
  static async clearOfflineQueue(): Promise<void> {
    this.offlineQueue = [];
    await this.saveOfflineQueue();
    logger.info('SyncManager', 'Offline queue cleared');
  }

  /**
   * Gets offline queue items count
   * @returns Number of items in queue
   */
  static getOfflineQueueCount(): number {
    return this.offlineQueue.length;
  }

  /**
   * Gets detailed offline queue status
   * @returns Array of queued items
   */
  static getOfflineQueueStatus(): SyncQueueItem[] {
    return [...this.offlineQueue];
  }

  /**
   * Initializes the sync manager
   */
  static async initialize(): Promise<void> {
    await this.loadOfflineQueue();
    logger.info('SyncManager', 'Initialized');
  }

  /**
   * Cleanup sync manager
   */
  static cleanup(): void {
    this.stopPeriodicSync();
    this.offlineQueue = [];
    logger.info('SyncManager', 'Cleaned up');
  }
}
