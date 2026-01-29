import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "@/lib/api";
import { logger } from "@/lib/logger";

export type ChallengeType = 'image' | 'code' | 'copywriting';

export interface Level {
  id: string;
  moduleId?: string;
  type?: ChallengeType;
  title?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  targetImageUrl?: string;
  hiddenPromptKeywords?: string[];
  passingScore: number;
  unlocked: boolean;
  prerequisites?: string[];
  
  // Image Challenge specific
  targetImageUrl?: string;
  hiddenPromptKeywords?: string[];
  style?: string;

  // Code/Logic Challenge specific
  moduleTitle?: string;
  requirementBrief?: string;
  requirementImage?: string;
  language?: string;
  testCases?: { id: string; name: string; passed: boolean }[];

  // Copywriting Challenge specific
  briefTitle?: string;
  briefProduct?: string;
  briefTarget?: string;
  briefTone?: string;
  briefGoal?: string;
  metrics?: { label: string; value: number }[];
}

export interface GameState {
  // Current game state
  currentLevelId: string | null;
  lives: number;
  score: number;
  isPlaying: boolean;

  // Progress
  unlockedLevels: string[];
  completedLevels: string[];

  // Actions
  startLevel: (levelId: string) => void;
  endLevel: () => void;
  loseLife: () => void;
  resetLives: () => void;
  unlockLevel: (levelId: string) => void;
  completeLevel: (levelId: string) => void;
  resetProgress: () => void;
  isLevelUnlocked: (levelId: string, prerequisites?: string[]) => boolean;
  checkAndUnlockLevels: (allLevels: Level[]) => void;

  // Backend sync
  syncFromBackend: (backendState: Partial<GameState>) => void;
  getStateForBackend: () => GameState;
  syncToBackend: () => Promise<void>;
}

const initialState = {
  currentLevelId: null,
  lives: 3,
  score: 0,
  isPlaying: false,
  unlockedLevels: ["level_01"], // First level always unlocked
  completedLevels: [],
};

// Custom storage adapter for expo-secure-store (native) or localStorage (web)
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // Use SecureStore on native, localStorage on web
      if (typeof window !== "undefined") {
        // Web platform
        return window.localStorage.getItem(name);
      } else {
        // Native platform
        return await SecureStore.getItemAsync(name);
      }
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      if (typeof window !== "undefined") {
        // Web platform
        window.localStorage.setItem(name, value);
      } else {
        // Native platform
        await SecureStore.setItemAsync(name, value);
      }
    } catch {
      // Handle error silently
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      if (typeof window !== "undefined") {
        // Web platform
        window.localStorage.removeItem(name);
      } else {
        // Native platform
        await SecureStore.deleteItemAsync(name);
      }
    } catch {
      // Handle error silently
    }
  },
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      startLevel: (levelId: string) => {
        // Don't reset lives - preserve them across level attempts
        // Only reset score for the new level
        set({
          currentLevelId: levelId,
          isPlaying: true,
          score: 0,
        });
      },

      endLevel: () => {
        set({
          currentLevelId: null,
          isPlaying: false,
        });
      },

      loseLife: () => {
        const currentLives = get().lives;
        if (currentLives > 0) {
          const newLives = currentLives - 1;
          set({ lives: newLives });
          
          // If lives reach 0, end the current level but don't reset lives
          // This allows the level select to show locked state
          if (newLives === 0) {
            set({
              currentLevelId: null,
              isPlaying: false,
            });
          }
        }
      },

      resetLives: () => {
        set({ lives: 3 });
      },

      unlockLevel: (levelId: string) => {
        const unlockedLevels = get().unlockedLevels;
        if (!unlockedLevels.includes(levelId)) {
          set({ unlockedLevels: [...unlockedLevels, levelId] });
        }
      },

      completeLevel: (levelId: string) => {
        const completedLevels = get().completedLevels;
        if (!completedLevels.includes(levelId)) {
          set({ completedLevels: [...completedLevels, levelId] });
        }
      },

      resetProgress: () => {
        set(initialState);
      },

      isLevelUnlocked: (levelId: string, prerequisites?: string[]) => {
        const state = get();

        if (!prerequisites || prerequisites.length === 0) {
          return state.unlockedLevels.includes(levelId);
        }

        const allPrerequisitesMet = prerequisites.every(prereqId =>
          state.completedLevels.includes(prereqId)
        );

        return state.unlockedLevels.includes(levelId) && allPrerequisitesMet;
      },

      checkAndUnlockLevels: (allLevels: Level[]) => {
        const state = get();
        const newlyUnlocked: string[] = [];

        allLevels.forEach(level => {
          const isCurrentlyUnlocked = state.unlockedLevels.includes(level.id);

          if (isCurrentlyUnlocked) {
            return;
          }

          const shouldUnlock = checkPrerequisites(state, level);

          if (shouldUnlock) {
            newlyUnlocked.push(level.id);
          }
        });

        if (newlyUnlocked.length > 0) {
          set({
            unlockedLevels: [...state.unlockedLevels, ...newlyUnlocked],
          });
          logger.info('GameStore', 'Levels unlocked', { count: newlyUnlocked.length, levels: newlyUnlocked });
        }
      },

      syncFromBackend: (backendState: Partial<GameState>) => {
        set(backendState);
      },

      getStateForBackend: () => {
        return get();
      },

      syncToBackend: async () => {
        try {
          const state = get();
          await apiClient.updateGameState(state);
          logger.info('GameStore', 'Synced game state to backend');
        } catch (error) {
          logger.error('GameStore', error, { operation: 'syncToBackend' });
          throw error;
        }
      },
    }),
    {
      name: "promptpal-game-storage",
      storage: createJSONStorage(() => secureStorage),
      // Add error handling for corrupted storage
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn("Game store rehydration error:", error);
          return initialState;
        }
        // If state is undefined or corrupted, reset to initial state
        if (!state || typeof state !== "object") {
          console.warn("Game store corrupted, resetting to initial state");
          return initialState;
        }
        return state;
      },
      // Skip rehydration to prevent blocking render
      skipHydration: true,
      // Add timeout for rehydration to prevent blocking
      partialize: (state) => ({
        unlockedLevels: state.unlockedLevels,
        completedLevels: state.completedLevels,
        currentLevelId: state.currentLevelId,
        lives: state.lives,
        score: state.score,
        isPlaying: state.isPlaying,
      }),
    }
  )
);

/**
 * Helper function to check if level prerequisites are met
 */
function checkPrerequisites(state: GameState, level: Level): boolean {
  if (!level.prerequisites || level.prerequisites.length === 0) {
    return true;
  }

  return level.prerequisites.every(prereqId =>
    state.completedLevels.includes(prereqId)
  );
}
