import { create } from 'zustand';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

interface AchievementsState {
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  getUnlockedCount: () => number;
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  achievements: [],
  setAchievements: (achievements) => set({ achievements }),
  getUnlockedCount: () => get().achievements.filter(a => a.unlocked).length,
}));

/**
 * Hook to fetch and sync user achievements from Convex
 * @param userId Clerk user ID
 */
export function useUserAchievements(userId: string | undefined) {
  const setAchievements = useAchievementsStore((state) => state.setAchievements);

  const achievements = useQuery(api.queries.getUserAchievements, userId ? { userId } : "skip") ?? [];

  const formattedAchievements: Achievement[] = achievements.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    unlocked: true, // If they are returned by getUserAchievements, they are unlocked
    unlockedAt: a.unlockedAt,
  }));

  // We should also get ALL achievements to show locked ones if needed
  // But for the profile page, maybe we just want to show what the user has?
  // The plan says "Replace useAchievementsStore() with useQuery(api.queries.getUserAchievements, { userId })" in profile.tsx
  // "Keep local store only for optimistic UI updates"

  return {
    achievements: formattedAchievements,
    isLoading: achievements === undefined,
  };
}

