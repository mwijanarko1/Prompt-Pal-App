import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { getSharedClient } from '@/lib/unified-api';
import { getModuleThumbnail } from '@/lib/thumbnails';

// Default learning modules shown immediately (no API wait needed)
const getDefaultLearningModules = (): LearningModule[] => [
  {
    id: 'image-generation',
    category: 'Design',
    title: 'Image Generation',
    level: 'Beginner',
    topic: 'AI Art',
    progress: 0,
    icon: 'color-palette',
    thumbnail: getModuleThumbnail('Image Generation', 'Design', 'AI Art'),
    accentColor: 'bg-green-500',
    buttonText: 'Start Creating',
    type: 'module',
    format: 'interactive',
    estimatedTime: 10,
  },
  {
    id: 'coding-logic',
    category: 'Programming',
    title: 'Coding Logic',
    level: 'Beginner',
    topic: 'Problem Solving',
    progress: 0,
    icon: 'code',
    thumbnail: getModuleThumbnail('Coding Logic', 'Programming', 'Problem Solving'),
    accentColor: 'bg-blue-500',
    buttonText: 'Start Coding',
    type: 'module',
    format: 'interactive',
    estimatedTime: 15,
  },
  {
    id: 'copywriting',
    category: 'Writing',
    title: 'Copywriting',
    level: 'Beginner',
    topic: 'Marketing',
    progress: 0,
    icon: 'create',
    thumbnail: getModuleThumbnail('Copywriting', 'Writing', 'Marketing'),
    accentColor: 'bg-purple-500',
    buttonText: 'Start Writing',
    type: 'module',
    format: 'interactive',
    estimatedTime: 20,
  },
];

export interface LearningModule {
  id: string;
  category: string;
  title: string;
  level: string;
  topic: string;
  progress: number; // 0-100
  icon: string;
  thumbnail?: any;
  accentColor: string;
  buttonText: string;
  type?: 'module' | 'course';
  format?: 'interactive' | 'video' | 'text';
  estimatedTime?: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  timeRemaining: number; // hours
  completed: boolean;
  expiresAt: number; // timestamp
}

export interface UserProgress {
  // User stats
  level: number;
  xp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null; // ISO date string

  // Learning modules progress
  learningModules: LearningModule[];

  // Daily quest
  currentQuest: DailyQuest | null;

  // Actions
  addXP: (amount: number) => Promise<void>;
  updateStreak: () => void;
  resetStreak: () => void;
  updateModuleProgress: (moduleId: string, progress: number) => void;
  setCurrentQuest: (quest: DailyQuest) => void;
  completeQuest: () => void;
  resetProgress: () => void;

  // Backend sync actions
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
  setLearningModules: (modules: LearningModule[]) => void;
}

const initialState = {
  level: 1,
  xp: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: null, // No activity yet for new users
  learningModules: getDefaultLearningModules(), // Show default modules immediately
  currentQuest: null, // Will be loaded from API
};

const calculateLevel = (xp: number): number => {
  // Simple level calculation: level = floor(xp / 200) + 1
  return Math.floor(xp / 200) + 1;
};

const calculateXPForNextLevel = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  return currentLevel * 200; // Next level at currentLevel * 200 XP
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

export const useUserProgressStore = create<UserProgress>()(
  persist(
    (set, get) => ({
      ...initialState,

      addXP: async (amount: number) => {
        const newXP = get().xp + amount;
        const newLevel = calculateLevel(newXP);
        set({
          xp: newXP,
          level: newLevel
        });

        // Sync XP and level changes to backend
        try {
          await getSharedClient().updateProgress({
            totalXp: newXP,
            currentLevel: newLevel,
          });
        } catch (error) {
          console.error('Failed to sync XP progress:', error);
        }
      },

      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastActivityDate = get().lastActivityDate;

        if (lastActivityDate === today) {
          // Already updated today
          return;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1; // Default for new streak
        let newLongestStreak = get().longestStreak;

        if (lastActivityDate === yesterdayStr) {
          // Consecutive day
          newStreak = get().currentStreak + 1;
          newLongestStreak = Math.max(newLongestStreak, newStreak);
        }

        set({
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastActivityDate: today,
        });
      },

      resetStreak: () => {
        set({
          currentStreak: 0,
          lastActivityDate: null,
        });
      },

      updateModuleProgress: async (moduleId: string, progress: number) => {
        const modules = get().learningModules || [];
        const updatedModules = modules.map(module =>
          module.id === moduleId
            ? { ...module, progress: Math.min(100, Math.max(0, progress)) }
            : module
        );
        set({ learningModules: updatedModules });

        // Sync with backend
        try {
          await getSharedClient().updateModuleProgress(moduleId, progress);
        } catch (error) {
          console.error('Failed to sync module progress:', error);
        }
      },

      setCurrentQuest: (quest: DailyQuest) => {
        set({ currentQuest: quest });
      },

      completeQuest: async () => {
        const quest = get().currentQuest;
        if (quest && !quest.completed) {
          // Add XP reward
          await get().addXP(quest.xpReward);
          // Mark quest as completed locally
          set({
            currentQuest: { ...quest, completed: true }
          });

          // Sync with backend
          try {
            await getSharedClient().completeQuest();
          } catch (error) {
            console.error('Failed to sync quest completion:', error);
          }
        }
      },

      resetProgress: () => {
        set(initialState);
      },

      // Backend sync actions
      syncWithBackend: async () => {
        try {
          // Sync progress data
          const progressData = {
            totalXp: get().xp,
            currentLevel: get().level,
            currentStreak: get().currentStreak,
            longestStreak: get().longestStreak,
            lastActivityDate: get().lastActivityDate,
          };

          // This would be called after significant updates
          // For now, just log that sync would happen
          console.log('Syncing user data with backend:', progressData);
        } catch (error) {
          console.error('Failed to sync with backend:', error);
        }
      },

      loadFromBackend: async () => {
        try {
          // Load learning modules from API (for progress updates)
          const apiModules = await getSharedClient().getLearningModules();

          // Start with default modules
          let modules = getDefaultLearningModules();

          // If API returns modules, merge progress data
          if (apiModules && apiModules.length > 0) {
            modules = modules.map(defaultModule => {
              // Find matching API module by ID or category
              const apiModule = apiModules.find((api: any) =>
                api.id === defaultModule.id ||
                api.category.toLowerCase() === defaultModule.category.toLowerCase()
              );

              // Merge API data with default module
              return {
                ...defaultModule,
                ...apiModule,
                thumbnail: defaultModule.thumbnail, // Keep our local thumbnail
              };
            });
          }

          set({ learningModules: modules });

          // Load current quest
          const quest = await getSharedClient().getCurrentQuest();
          if (quest) {
            set({ currentQuest: quest });
          }
        } catch (error: any) {
          console.error('Failed to load data from backend:', error);

          // If authentication failed, don't try to load data
          // The SessionMonitor will handle signing out if needed
          if (error?.response?.status === 401) {
            console.warn('Authentication failed when loading user data - session may be expired');
          }

          // Keep empty state if API fails
          set({ learningModules: [] });
        }
      },

      setLearningModules: (modules: LearningModule[]) => {
        set({ learningModules: modules });
      },
    }),
    {
      name: 'promptpal-user-progress-storage',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('User progress store rehydration error:', error);
        }

        // Ensure state is valid after rehydration
        if (state) {
          // Ensure learningModules is an array
          if (!state.learningModules || !Array.isArray(state.learningModules)) {
            state.learningModules = [];
          }

          // Note: We no longer call loadFromBackend() here to avoid double initialization
          // Backend data is now loaded via SyncManager.syncUserProgress() which is
          // triggered once on app startup and periodically thereafter.
          // This prevents duplicate API calls when both rehydration and SyncManager run.
        }
      },
    }
  )
);

// Helper functions
export const getXPForNextLevel = (currentXP: number): number => {
  return calculateXPForNextLevel(currentXP);
};

export const getOverallProgress = (currentXP: number): { current: number; total: number; percentage: number } => {
  const currentLevel = calculateLevel(currentXP);
  const xpForCurrentLevel = (currentLevel - 1) * 200;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpForNextLevel = 200;

  return {
    current: xpInCurrentLevel,
    total: xpForNextLevel,
    percentage: (xpInCurrentLevel / xpForNextLevel) * 100,
  };
};