import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { LEVELS } from '../levels/data';

export type ModuleType = 'image' | 'code' | 'copy';

export interface BaseLevel {
  id: string;
  module: ModuleType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description: string;
  passingScore: number;
  points: number;
  unlocked: boolean;
  progress?: LevelProgress;
}

export interface ImageLevel extends BaseLevel {
  module: 'image';
  targetImageUrl: string;
  hiddenPromptKeywords: string[];
  targetPrompt?: string;
}

export interface CodeLevel extends BaseLevel {
  module: 'code';
  language: 'javascript' | 'python' | 'typescript';
  targetCode: string;
  instructions: string;
  testCases?: CodeTestCase[];
}

export interface CopyLevel extends BaseLevel {
  module: 'copy';
  targetCopy: string;
  context: string;
  tone: string;
  wordCount: number;
}

export interface CodeTestCase {
  input: any;
  expectedOutput: any;
  description: string;
}

export interface LevelProgress {
  attempts: number;
  bestScore: number;
  completed: boolean;
  timeSpent: number;
  lastAttempt: Date;
}

export type Level = ImageLevel | CodeLevel | CopyLevel;

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
  completeLevel: (levelId: string, score: number, points: number) => void;
  unlockNextLevel: (currentLevelId: string) => void;
  resetProgress: () => void;
}

const initialState = {
  currentLevelId: null,
  lives: 3,
  score: 0,
  isPlaying: false,
  unlockedLevels: ['level_01'], // First level always unlocked
  completedLevels: [],
};

// Custom storage adapter for expo-secure-store
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch {
      // Handle error silently
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
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
        set({
          currentLevelId: levelId,
          isPlaying: true,
          lives: 3, // Reset lives when starting a level
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
        if (currentLives > 1) {
          set({ lives: currentLives - 1 });
        } else {
          // Game over - reset
          set({
            lives: 3,
            currentLevelId: null,
            isPlaying: false,
          });
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

      completeLevel: (levelId: string, score: number, points: number) => {
        const completedLevels = get().completedLevels;
        if (!completedLevels.includes(levelId)) {
          set({
            completedLevels: [...completedLevels, levelId],
            score: get().score + points,
          });

          // Unlock next level in sequence
          get().unlockNextLevel(levelId);
        }
      },

      resetProgress: () => {
        set(initialState);
      },

      unlockNextLevel: (currentLevelId: string) => {
        // Find current level index
        const currentIndex = LEVELS.findIndex(level => level.id === currentLevelId);
        if (currentIndex === -1) return;

        // Unlock next level in sequence (if exists)
        const nextIndex = currentIndex + 1;
        if (nextIndex < LEVELS.length) {
          const nextLevel = LEVELS[nextIndex];
          const unlockedLevels = get().unlockedLevels;
          if (!unlockedLevels.includes(nextLevel.id)) {
            set({ unlockedLevels: [...unlockedLevels, nextLevel.id] });
          }
        }
      },
    }),
    {
      name: 'promptpal-game-storage',
      storage: createJSONStorage(() => secureStorage),
      // Add error handling for corrupted storage
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Game store rehydration error:', error);
        }
        // If state is undefined or corrupted, it will use initial state automatically
      },
    }
  )
);
