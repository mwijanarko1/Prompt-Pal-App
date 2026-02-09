import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Check and unlock achievements for a user
 * This should be called after significant user actions (level completion, XP gain, etc.)
 */
export const checkAndUnlockAchievements = action({
  args: {
    userId: v.string(),
    triggerType: v.string(), // 'level_completed', 'xp_gained', 'streak_updated', etc.
    triggerData: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: string;
  }>> => {
    const { userId, triggerType, triggerData } = args;

    // Get user statistics
    const userStats = await ctx.runQuery(api.queries.getUserStatistics, { userId });
    if (!userStats) return [];

    // Get all achievements
    const allAchievements: any = await ctx.runQuery(api.queries.getAllAchievements, {});

    // Get user's current achievements
    const userAchievements: any = await ctx.runQuery(api.queries.getUserAchievements, { userId });
    const unlockedAchievementIds = new Set(userAchievements.map((ua: any) => ua.id));

    const newlyUnlockedAchievements = [];

    // Check each achievement condition
    for (const achievement of allAchievements) {
      // Skip if already unlocked
      if (unlockedAchievementIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.conditionType) {
        case 'levels_completed':
          shouldUnlock = userStats.totalXp >= 100; // Rough proxy for level completions
          break;

        case 'xp_earned':
          shouldUnlock = userStats.totalXp >= achievement.conditionValue;
          break;

        case 'streak':
          shouldUnlock = userStats.currentStreak >= achievement.conditionValue;
          break;

        case 'perfect_score':
          if (triggerType === 'level_completed' && triggerData?.score === 100) {
            shouldUnlock = true;
          }
          break;

        case 'speed_completion':
          if (triggerType === 'level_completed' && triggerData?.timeSpent) {
            shouldUnlock = triggerData.timeSpent <= achievement.conditionValue;
          }
          break;

        default:
          continue;
      }

      if (shouldUnlock) {
        await ctx.runMutation(api.mutations.unlockAchievement, {
          userId,
          achievementId: achievement.id,
        });
        newlyUnlockedAchievements.push(achievement);
      }
    }

    return newlyUnlockedAchievements;
  },
});

/**
 * Recalculate all achievements for a user (useful for data fixes)
 */
export const recalculateUserAchievements = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Get user stats
    const userStats = await ctx.runQuery(api.queries.getUserStatistics, { userId });
    if (!userStats) return;

    // Get all user level progress for detailed checks
    const levelProgress = await ctx.runQuery(api.queries.getUserLevelProgress, { userId });

    // Clear existing achievements (except manually granted ones)
    const existingAchievements = await ctx.runQuery(api.queries.getUserAchievements, { userId });
    // Note: In a real implementation, you might want to mark achievements as "recalculated"

    // Check each achievement type
    const achievements = await ctx.runQuery(api.queries.getAllAchievements, {});

    for (const achievement of achievements) {
      let shouldUnlock = false;

      switch (achievement.conditionType) {
        case 'levels_completed':
          const completedLevels = levelProgress.filter((p: any) => p.isCompleted).length;
          shouldUnlock = completedLevels >= achievement.conditionValue;
          break;

        case 'xp_earned':
          shouldUnlock = userStats.totalXp >= achievement.conditionValue;
          break;

        case 'streak':
          shouldUnlock = Math.max(userStats.currentStreak, userStats.longestStreak) >= achievement.conditionValue;
          break;

        case 'perfect_score':
          shouldUnlock = levelProgress.some((p: any) => p.bestScore === 100);
          break;

        case 'speed_completion':
          // Check if any level was completed quickly
          shouldUnlock = levelProgress.some((p: any) =>
            p.isCompleted && p.timeSpent && p.timeSpent <= achievement.conditionValue
          );
          break;
      }

      if (shouldUnlock) {
        await ctx.runMutation(api.mutations.unlockAchievement, {
          userId,
          achievementId: achievement.id,
        });
      }
    }
  },
});