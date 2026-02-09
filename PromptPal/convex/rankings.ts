import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Calculate points for a user based on their achievements and progress
 */
function calculatePoints(userStats: any, levelProgress: any[], achievements: any[]): number {
  let points = 0;

  // Base points from XP (1 point per 10 XP)
  points += Math.floor(userStats.totalXp / 10);

  // Points from completed levels
  const completedLevels = levelProgress.filter((p: any) => p.isCompleted);
  points += completedLevels.length * 50;

  // Bonus points for perfect scores
  const perfectScores = completedLevels.filter((p: any) => p.bestScore >= 95);
  points += perfectScores.length * 25;

  // Points from achievements (rarity-based)
  for (const achievement of achievements) {
    switch (achievement.rarity) {
      case 'common': points += 10; break;
      case 'rare': points += 25; break;
      case 'epic': points += 50; break;
      case 'legendary': points += 100; break;
    }
  }

  // Streak bonuses
  points += userStats.currentStreak * 5;
  points += Math.max(0, userStats.longestStreak - userStats.currentStreak) * 2;

  return points;
}

/**
 * Update points and ranking for a specific user
 */
export const updateUserRanking = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { userId } = args;

    // Get user statistics
    const userStats = await ctx.runQuery(api.queries.getUserStatistics, { userId });
    if (!userStats) return;

    // Get level progress
    const levelProgress = await ctx.runQuery(api.queries.getUserLevelProgress, { userId });

    // Get achievements
    const achievements = await ctx.runQuery(api.queries.getUserAchievements, { userId });

    // Calculate new points
    const newPoints = calculatePoints(userStats, levelProgress, achievements);

    // Update the user's points
    await ctx.runMutation(api.mutations.updateUserStatistics, {
      userId,
      points: newPoints,
    });

    return;
  },
});

/**
 * Recalculate rankings for all users
 */
export const recalculateRankings = action({
  args: {},
  handler: async (ctx, args): Promise<number> => {
    console.log("Starting ranking recalculation...");

    // Get all users with their stats
    const { leaderboard: allStats }: any = await ctx.runQuery(api.queries.getLeaderboard, { limit: 1000 });

    // Calculate points for each user
    const userPoints: any[] = [];
    for (const stat of allStats) {
      const user = await ctx.runQuery(api.queries.getUserStatistics, { userId: stat.userId });
      if (!user) continue;

      const levelProgress = await ctx.runQuery(api.queries.getUserLevelProgress, {
        userId: stat.userId,
      });
      const achievements = await ctx.runQuery(api.queries.getUserAchievements, {
        userId: stat.userId,
      });

      const points = calculatePoints(user, levelProgress, achievements);
      userPoints.push({
        userId: stat.userId,
        points,
        currentPoints: user.points,
      });
    }

    // Sort by points (descending)
    userPoints.sort((a: any, b: any) => b.points - a.points);

    // Update rankings and points
    for (let i = 0; i < userPoints.length; i++) {
      const { userId, points } = userPoints[i];
      const newRank = i + 1;

      await ctx.runMutation(api.mutations.updateUserStatistics, {
        userId,
        points,
        globalRank: newRank,
      });
    }

    console.log(`Updated rankings for ${userPoints.length} users`);
    return userPoints.length;
  },
});

/**
 * Get user's rank comparison with nearby players
 */
export const getRankComparison = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args): Promise<{
    userRank: number;
    above: any[];
    below: any[];
  } | null> => {
    const { userId } = args;

    const userStats = await ctx.runQuery(api.queries.getUserStatistics, { userId });
    if (!userStats) return null;

    const userRank = userStats.globalRank;

    // Get nearby users (within ±5 ranks)
    const { leaderboard: nearbyUsers } = await ctx.runQuery(api.queries.getLeaderboard, {
      limit: 10,
    });

    // Find user's position in the leaderboard
    const userIndex = nearbyUsers.findIndex((u: any) => u.userId === userId);

    if (userIndex === -1) return null;

    // Get users above and below
    const above = nearbyUsers.slice(Math.max(0, userIndex - 3), userIndex);
    const below = nearbyUsers.slice(userIndex + 1, userIndex + 4);

    return {
      userRank,
      above,
      below,
    };
  },
});

/**
 * Get system statistics
 */
export const getSystemStatistics = action({
  args: {},
  handler: async (ctx, args): Promise<{
    totalUsers: number;
    totalPoints: number;
    topPoints: number;
    averagePoints: number;
  }> => {
    // Get all stats
    const { leaderboard: allStats }: any = await ctx.runQuery(api.queries.getLeaderboard, { limit: 1000 });

    // Calculate totals
    const totalPoints = allStats.reduce((sum: number, stat: any) => sum + stat.totalXp, 0);
    const topPoints = Math.max(...allStats.map((stat: any) => stat.totalXp));

    return {
      totalUsers: allStats.length,
      totalPoints,
      topPoints,
      averagePoints: totalPoints / allStats.length,
    };
  },
});
