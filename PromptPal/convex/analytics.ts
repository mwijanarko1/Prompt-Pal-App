import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get comprehensive user engagement metrics
 */
export const getUserEngagementMetrics = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const { startTime, endTime } = args;

    // Get active users in time period
    const activeUsers = await ctx.db
      .query("userEvents")
      .filter((q) => q.and(
        q.gte(q.field("timestamp"), startTime),
        q.lte(q.field("timestamp"), endTime)
      ))
      .collect();

    const uniqueUsers = new Set(activeUsers.map(event => event.userId));
    const totalSessions = activeUsers.filter(event => event.eventType === 'session_start').length;

    // Get level completions
    const levelCompletions = activeUsers.filter(event => event.eventType === 'level_completed');

    // Get AI generations
    const aiGenerations = await ctx.db
      .query("aiGenerations")
      .filter((q) => q.and(
        q.gte(q.field("createdAt"), startTime),
        q.lte(q.field("createdAt"), endTime)
      ))
      .collect();

    // Calculate averages
    const avgSessionLength = totalSessions > 0 ?
      activeUsers.filter(event => event.eventType === 'session_end')
        .reduce((sum, event) => sum + (event.timestamp - (event.eventData?.sessionStart || event.timestamp)), 0) / totalSessions : 0;

    return {
      period: { startTime, endTime },
      activeUsers: uniqueUsers.size,
      totalSessions,
      levelCompletions: levelCompletions.length,
      aiGenerations: aiGenerations.length,
      averageSessionLength: Math.round(avgSessionLength / 1000), // seconds
      completionRate: levelCompletions.length / Math.max(1, uniqueUsers.size),
    };
  },
});

/**
 * Get level performance analytics
 */
export const getLevelPerformanceAnalytics = query({
  args: {
    levelId: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
  },
  handler: async (ctx, args) => {
    const { levelId, startTime, endTime } = args;

    // Get game sessions for the period
    let sessionQuery = ctx.db
      .query("gameSessions")
      .filter((q) => q.and(
        q.gte(q.field("startedAt"), startTime),
        q.lte(q.field("startedAt"), endTime)
      ));

    if (levelId) {
      sessionQuery = sessionQuery.filter((q) => q.eq(q.field("levelId"), levelId));
    }

    const sessions = await sessionQuery.collect();

    if (sessions.length === 0) {
      return {
        levelId,
        totalAttempts: 0,
        completionRate: 0,
        averageScore: 0,
        averageTimeSpent: 0,
        averageHintsUsed: 0,
        difficultyRating: 0,
      };
    }

    const completedSessions = sessions.filter(s => s.completed);
    const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);
    const totalTime = sessions
      .filter(s => s.endedAt)
      .reduce((sum, s) => sum + (s.endedAt! - s.startedAt), 0);
    const totalHints = sessions.reduce((sum, s) => sum + s.hintsUsed, 0);

    // Calculate difficulty rating (lower completion rate = higher difficulty)
    const completionRate = completedSessions.length / sessions.length;
    const difficultyRating = Math.round((1 - completionRate) * 10);

    return {
      levelId,
      totalAttempts: sessions.length,
      completionRate,
      averageScore: Math.round(totalScore / sessions.length),
      averageTimeSpent: Math.round(totalTime / Math.max(1, sessions.filter(s => s.endedAt).length) / 1000), // seconds
      averageHintsUsed: Math.round(totalHints / sessions.length),
      difficultyRating,
    };
  },
});

/**
 * Get user retention and churn analytics
 */
export const getUserRetentionAnalytics = query({
  args: {
    days: v.number(), // How many days back to analyze
  },
  handler: async (ctx, args) => {
    const { days } = args;
    const now = Date.now();
    const periodStart = now - (days * 24 * 60 * 60 * 1000);

    // Get all users who were active in the period
    const activeUserEvents = await ctx.db
      .query("userEvents")
      .filter((q) => q.gte(q.field("timestamp"), periodStart))
      .collect();

    const activeUserIds = new Set(activeUserEvents.map(event => event.userId));

    // Get activity by day for these users
    const dailyActivity = new Map<string, Set<string>>();

    for (const event of activeUserEvents) {
      const day = new Date(event.timestamp).toDateString();
      if (!dailyActivity.has(day)) {
        dailyActivity.set(day, new Set());
      }
      dailyActivity.get(day)!.add(event.userId);
    }

    // Calculate retention rates
    const retentionRates = [];
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date(now - (i * 24 * 60 * 60 * 1000)).toDateString();
      const activeOnDay = dailyActivity.get(targetDate)?.size || 0;
      const retentionRate = activeOnDay / activeUserIds.size;

      retentionRates.push({
        daysAgo: i,
        activeUsers: activeOnDay,
        retentionRate: Math.round(retentionRate * 100) / 100,
      });
    }

    return {
      totalUsers: activeUserIds.size,
      analysisPeriodDays: days,
      retentionRates,
      averageRetention: retentionRates.reduce((sum, r) => sum + r.retentionRate, 0) / retentionRates.length,
    };
  },
});

/**
 * Get AI usage patterns and performance
 */
export const getAIUsageAnalytics = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { startTime, endTime, model } = args;

    let query = ctx.db
      .query("aiGenerations")
      .filter((q) => q.and(
        q.gte(q.field("createdAt"), startTime),
        q.lte(q.field("createdAt"), endTime)
      ));

    if (model) {
      query = query.filter((q) => q.eq(q.field("model"), model));
    }

    const generations = await query.collect();

    if (generations.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        averageResponseTime: 0,
        totalTokens: 0,
        modelUsage: {},
      };
    }

    const successfulRequests = generations.filter(g => g.success).length;
    const totalResponseTime = generations.reduce((sum, g) => sum + g.durationMs, 0);
    const totalTokens = generations.reduce((sum, g) => sum + (g.tokensUsed || 0), 0);

    // Model usage breakdown
    const modelUsage: Record<string, number> = {};
    for (const gen of generations) {
      modelUsage[gen.model] = (modelUsage[gen.model] || 0) + 1;
    }

    return {
      totalRequests: generations.length,
      successRate: successfulRequests / generations.length,
      averageResponseTime: Math.round(totalResponseTime / generations.length),
      totalTokens,
      modelUsage,
    };
  },
});

/**
 * Get system performance metrics
 */
export const getSystemPerformanceMetrics = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    metricType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { startTime, endTime, metricType } = args;

    let query = ctx.db
      .query("performanceMetrics")
      .filter((q) => q.and(
        q.gte(q.field("timestamp"), startTime),
        q.lte(q.field("timestamp"), endTime)
      ));

    if (metricType) {
      query = query.filter((q) => q.eq(q.field("metricType"), metricType));
    }

    const metrics = await query.collect();

    // Group by metric type
    const metricsByType: Record<string, any[]> = {};
    for (const metric of metrics) {
      if (!metricsByType[metric.metricType]) {
        metricsByType[metric.metricType] = [];
      }
      metricsByType[metric.metricType].push(metric);
    }

    // Calculate aggregates
    const aggregates: Record<string, any> = {};
    for (const [type, typeMetrics] of Object.entries(metricsByType)) {
      const values = typeMetrics.map((m: any) => m.value);
      aggregates[type] = {
        count: values.length,
        average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        p95: values.sort((a: number, b: number) => a - b)[Math.floor(values.length * 0.95)],
      };
    }

    return {
      period: { startTime, endTime },
      totalMetrics: metrics.length,
      metricsByType: aggregates,
    };
  },
});

/**
 * Get error analysis and trends
 */
export const getErrorAnalytics = query({
  args: {
    startTime: v.number(),
    endTime: v.number(),
    errorType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { startTime, endTime, errorType } = args;

    let query = ctx.db
      .query("errorLogs")
      .filter((q) => q.and(
        q.gte(q.field("timestamp"), startTime),
        q.lte(q.field("timestamp"), endTime)
      ));

    if (errorType) {
      query = query.filter((q) => q.eq(q.field("errorType"), errorType));
    }

    const errors = await query.collect();

    // Group by error type
    const errorsByType: Record<string, any[]> = {};
    for (const error of errors) {
      if (!errorsByType[error.errorType]) {
        errorsByType[error.errorType] = [];
      }
      errorsByType[error.errorType].push(error);
    }

    // Get most common errors
    const errorFrequency = Object.entries(errorsByType)
      .map(([type, errs]) => ({
        errorType: type,
        count: errs.length,
        percentage: Math.round((errs.length / errors.length) * 100),
        sampleMessage: errs[0]?.message,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalErrors: errors.length,
      uniqueErrorTypes: Object.keys(errorsByType).length,
      errorFrequency: errorFrequency.slice(0, 10), // Top 10 errors
      errorsByType,
    };
  },
});