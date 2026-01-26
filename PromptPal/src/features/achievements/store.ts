import { create } from 'zustand';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface AchievementsState {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  resetAchievements: () => void;
  getUnlockedCount: () => number;
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  achievements: [
    { id: 'first_level', title: 'First Steps', description: 'Complete your first level', icon: '🎯', unlocked: false },
    { id: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', unlocked: false },
    { id: 'xp_1000', title: 'XP Hunter', description: 'Earn 1000 XP', icon: '⭐', unlocked: false },
    { id: 'level_5', title: 'Level Master', description: 'Reach level 5', icon: '🏆', unlocked: false },
    { id: 'perfect_score', title: 'Perfectionist', description: 'Get a perfect score', icon: '💯', unlocked: false },
  ],
  unlockAchievement: (id) => set((state) => ({
    achievements: state.achievements.map(a => 
      a.id === id ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() } : a
    )
  })),
  resetAchievements: () => set((state) => ({
    achievements: state.achievements.map(a => ({ ...a, unlocked: false, unlockedAt: undefined }))
  })),
  getUnlockedCount: () => get().achievements.filter(a => a.unlocked).length,
}));
