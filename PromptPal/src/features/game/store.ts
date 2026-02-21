import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { convexHttpClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api.js";
import { logger } from "@/lib/logger";

export type ChallengeType = 'image' | 'code' | 'copywriting';

// Data-only version of GameState for backend communication
export interface GameStateData {
  currentLevelId: string | null;
  lives: number;
  score: number;
  isPlaying: boolean;
  unlockedLevels: string[];
  completedLevels: string[];
}

export interface Level {
  id: string;
  moduleId?: string;
  type?: ChallengeType;
  title?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  passingScore: number;
  unlocked: boolean;
  prerequisites?: string[];

  // Image Challenge specific
  targetImageUrl?: string | number; // Can be local asset (number) or URL (string)
  targetImageUrlForEvaluation?: string; // Hosted URL for evaluation API
  hiddenPromptKeywords?: string[];
  style?: string;

  // Code/Logic Challenge specific
  moduleTitle?: string;
  requirementBrief?: string;
  requirementImage?: string;
  language?: string;
  functionName?: string;
  testCases?: { id: string; name: string; input?: any; expectedOutput?: any; description?: string; passed?: boolean }[];

  // Copywriting Challenge specific
  briefTitle?: string;
  briefProduct?: string;
  briefTarget?: string;
  briefTone?: string;
  briefGoal?: string;
  wordLimit?: { min?: number; max?: number };
  requiredElements?: string[];
  metrics?: { label: string; value: number }[];

  // General
  description?: string;
  points?: number; // XP reward for completing this level
  order?: number; // Sort order within module
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
  loseLife: () => Promise<void>;
  resetLives: () => void;
  unlockLevel: (levelId: string) => Promise<void>;
  completeLevel: (levelId: string) => Promise<void>;
  resetProgress: () => void;
  isLevelUnlocked: (levelId: string, prerequisites?: string[]) => boolean;
  checkAndUnlockLevels: (allLevels: Level[]) => void;

  // Backend sync
  syncFromBackend: (backendState: Partial<GameState>) => void;
  getStateForBackend: () => GameStateData;
  syncToBackend: () => Promise<void>;
}

const initialState = {
  currentLevelId: null,
  lives: 3,
  score: 0,
  isPlaying: false,
  unlockedLevels: ["image-1-easy"], // First level always unlocked
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

      loseLife: async () => {
        const currentLives = get().lives;
        if (currentLives > 0) {
          const newLives = currentLives - 1;
          set({ lives: newLives });

          // If lives reach 0, end of current level but don't reset lives
          // This allows level select to show locked state
          if (newLives === 0) {
            set({
              currentLevelId: null,
              isPlaying: false,
            });
          }

          // Sync lives change to backend
          try {
            await convexHttpClient.mutation(api.mutations.updateUserGameState, {
              appId: "prompt-pal",
              ...get().getStateForBackend(),
            });
          } catch (error) {
            logger.error('GameStore', error, { operation: 'loseLife sync' });
          }
        }
      },

      resetLives: () => {
        set({ lives: 3 });
      },

      unlockLevel: async (levelId: string) => {
        const unlockedLevels = get().unlockedLevels;
        if (!unlockedLevels.includes(levelId)) {
          const newUnlockedLevels = [...unlockedLevels, levelId];
          set({ unlockedLevels: newUnlockedLevels });

          // Sync unlocked levels to backend
          try {
            await convexHttpClient.mutation(api.mutations.updateUserGameState, {
              appId: "prompt-pal",
              ...get().getStateForBackend(),
            });
          } catch (error) {
            logger.error('GameStore', error, { operation: 'unlockLevel sync', levelId });
          }
        }
      },

      completeLevel: async (levelId: string) => {
        const completedLevels = get().completedLevels;
        if (!completedLevels.includes(levelId)) {
          const newCompletedLevels = [...completedLevels, levelId];

          // Auto-unlock the next level in the sequence
          // Parse level ID to find next: e.g., "code-3-easy" -> prefix="code", num=3
          const match = levelId.match(/^(image|code|copywriting)-(\d+)-/);
          if (match) {
            const [, prefix, numStr] = match;
            const nextNum = parseInt(numStr, 10) + 1;
            // Find next level ID by trying all difficulty suffixes
            const possibleNextIds = [
              `${prefix}-${nextNum}-easy`,
              `${prefix}-${nextNum}-medium`,
              `${prefix}-${nextNum}-hard`,
            ];

            const currentUnlocked = get().unlockedLevels;
            const newlyUnlocked = possibleNextIds.filter(
              id => !currentUnlocked.includes(id)
            );

            if (newlyUnlocked.length > 0) {
              set({
                completedLevels: newCompletedLevels,
                unlockedLevels: [...currentUnlocked, ...newlyUnlocked],
              });
              logger.info('GameStore', 'Level completed & next unlocked', {
                completed: levelId,
                unlocked: newlyUnlocked,
              });
            } else {
              set({ completedLevels: newCompletedLevels });
            }
          } else {
            set({ completedLevels: newCompletedLevels });
          }

          // Sync completed levels to backend
          try {
            await convexHttpClient.mutation(api.mutations.updateUserGameState, {
              appId: "prompt-pal",
              ...get().getStateForBackend(),
            });
          } catch (error) {
            logger.error('GameStore', error, { operation: 'completeLevel sync', levelId });
          }
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
        const state = get();
        // Return only the data fields, not the action functions
        return {
          currentLevelId: state.currentLevelId,
          lives: state.lives,
          score: state.score,
          isPlaying: state.isPlaying,
          unlockedLevels: state.unlockedLevels,
          completedLevels: state.completedLevels,
        };
      },

      syncToBackend: async () => {
        try {
          await convexHttpClient.mutation(api.mutations.updateUserGameState, {
            appId: "prompt-pal",
            ...get().getStateForBackend(),
          });
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
          return;
        }
        if (state) {
          // Ensure arrays are valid after rehydration
          if (!Array.isArray(state.unlockedLevels)) {
            state.unlockedLevels = ["image-1-easy"];
          }
          if (!Array.isArray(state.completedLevels)) {
            state.completedLevels = [];
          }
          logger.info('GameStore', 'Rehydrated from storage', {
            unlockedLevels: state.unlockedLevels.length,
            completedLevels: state.completedLevels.length,
          });
        }
      },
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
