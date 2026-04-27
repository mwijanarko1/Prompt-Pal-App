import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { allLevels } from "./levels_data";
import {
	buildDefaultQuestNodes,
	buildFeaturedCourseOverview,
	buildHomeHeaderStats,
	buildLessonDefinitionsFromLegacyLevels,
	DEFAULT_LEARNING_TRACKS,
	DEFAULT_PERK_CATALOG,
	buildProfileOverviewAchievements,
	buildProfileOverviewUsageQuota,
	getLevelFromLifetimeXp,
	type LessonDefinitionSeed,
	type QuestNodeSeed,
	type TrackId,
} from "./questProductData";

const ONBOARDING_VERSION = "quest-first-v1";
const DEFAULT_TRACK_ID: TrackId = "coding";

const seedLessons = buildLessonDefinitionsFromLegacyLevels(allLevels);
const seedNodes = buildDefaultQuestNodes(seedLessons);

async function getUserId(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	return identity?.subject ?? null;
}

async function requireUserId(ctx: QueryCtx | MutationCtx) {
	const userId = await getUserId(ctx);
	if (!userId) {
		throw new Error("Authentication required");
	}
	return userId;
}

function todayKey(now = Date.now()) {
	return new Date(now).toISOString().slice(0, 10);
}

function monthDurationMs(now: number) {
	const currentDate = new Date(now);
	const year = currentDate.getFullYear();
	const month = currentDate.getMonth();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	return daysInMonth * 24 * 60 * 60 * 1000;
}

function monthKey(year: number, month: number, day: number) {
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getSeedLesson(lessonId: string) {
	return seedLessons.find((lesson) => lesson.id === lessonId) ?? null;
}

function getSeedNode(nodeId: string) {
	return seedNodes.find((node) => node.id === nodeId) ?? null;
}

function getTrack(trackId: string | undefined | null) {
	return (
		DEFAULT_LEARNING_TRACKS.find(
			(track) => track.id === trackId && track.isActive,
		) ??
		DEFAULT_LEARNING_TRACKS.find((track) => track.id === DEFAULT_TRACK_ID) ??
		DEFAULT_LEARNING_TRACKS[0]
	);
}

function getActiveTracks() {
	return DEFAULT_LEARNING_TRACKS.filter((track) => track.isActive);
}

async function getDbLesson(ctx: QueryCtx | MutationCtx, lessonId: string) {
	return await ctx.db
		.query("lessonDefinitions")
		.withIndex("by_lesson_id", (q) => q.eq("id", lessonId))
		.first();
}

async function getDbNode(ctx: QueryCtx | MutationCtx, nodeId: string) {
	return await ctx.db
		.query("questNodes")
		.withIndex("by_node_id", (q) => q.eq("id", nodeId))
		.first();
}

async function getLesson(ctx: QueryCtx | MutationCtx, lessonId: string) {
	return (await getDbLesson(ctx, lessonId)) ?? getSeedLesson(lessonId);
}

async function getNode(ctx: QueryCtx | MutationCtx, nodeId: string) {
	return (await getDbNode(ctx, nodeId)) ?? getSeedNode(nodeId);
}

async function getTrackNodes(ctx: QueryCtx | MutationCtx, trackId: string) {
	const dbNodes = await ctx.db
		.query("questNodes")
		.withIndex("by_track_order", (q) => q.eq("trackId", trackId))
		.collect();
	if (dbNodes.length > 0) {
		return dbNodes;
	}
	return seedNodes.filter((node) => node.trackId === trackId);
}

async function getTrackLessons(ctx: QueryCtx | MutationCtx, trackId: string) {
	const dbLessons = await ctx.db
		.query("lessonDefinitions")
		.withIndex("by_track_order", (q) => q.eq("trackId", trackId))
		.collect();
	if (dbLessons.length > 0) {
		return dbLessons;
	}
	return seedLessons.filter((lesson) => lesson.trackId === trackId);
}

async function getStats(ctx: QueryCtx | MutationCtx, userId: string | null) {
	if (!userId) {
		return {
			lifetimeXp: 0,
			walletXp: 0,
			level: 1,
			currentStreak: 0,
			longestStreak: 0,
			globalRank: 0,
		};
	}

	const stats = await ctx.db
		.query("userStatistics")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.first();
	const lifetimeXp = stats?.lifetimeXp ?? stats?.totalXp ?? 0;
	const walletXp = stats?.walletXp ?? stats?.points ?? 0;

	return {
		lifetimeXp,
		walletXp,
		level: getLevelFromLifetimeXp(lifetimeXp),
		currentStreak: stats?.currentStreak ?? 0,
		longestStreak: stats?.longestStreak ?? 0,
		globalRank: stats?.globalRank ?? 0,
	};
}

async function getProfileUsageQuota(ctx: QueryCtx, userId: string | null) {
	const now = Date.now();
	const oneMonthMs = monthDurationMs(now);
	const app = await ctx.db
		.query("apps")
		.withIndex("by_app_id", (q) => q.eq("id", "prompt-pal"))
		.first();

	if (!app) {
		return null;
	}

	const plan = userId
		? await ctx.db
				.query("appPlans")
				.withIndex("by_user_app", (q) =>
					q.eq("userId", userId).eq("appId", "prompt-pal"),
				)
				.first()
		: null;
	const tier = plan?.tier ?? "free";
	const periodStart = plan?.periodStart ?? now;
	const hasExpired = plan ? now - plan.periodStart >= oneMonthMs : false;
	const used =
		plan && !hasExpired
			? {
					textCalls: plan.used.textCalls,
					imageCalls: plan.used.imageCalls,
					audioSummaries: plan.used.audioSummaries,
				}
			: {
					textCalls: 0,
					imageCalls: 0,
					audioSummaries: 0,
				};
	const limits = tier === "pro" ? app.proLimits : app.freeLimits;

	return buildProfileOverviewUsageQuota({
		tier,
		used,
		limits,
		periodStart,
		periodEnd: periodStart + oneMonthMs,
	});
}

async function getProfileAchievements(ctx: QueryCtx, userId: string | null) {
	if (!userId) {
		return [];
	}

	const rows = await ctx.db
		.query("userAchievements")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();
	const achievements = await ctx.db.query("achievements").collect();
	const achievementsById = new Map(
		achievements.map((achievement) => [achievement.id, achievement]),
	);

	return buildProfileOverviewAchievements(
		rows.map((row) => ({
			achievementId: row.achievementId,
			unlockedAt: row.unlockedAt,
			achievement: achievementsById.get(row.achievementId) ?? null,
		})),
	);
}

async function getOrCreateStats(ctx: MutationCtx, userId: string) {
	const existing = await ctx.db
		.query("userStatistics")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.first();
	if (existing) {
		return existing;
	}
	const now = Date.now();
	const id = await ctx.db.insert("userStatistics", {
		userId,
		totalXp: 0,
		lifetimeXp: 0,
		walletXp: 0,
		currentLevel: 1,
		currentStreak: 0,
		longestStreak: 0,
		globalRank: 0,
		points: 0,
		createdAt: now,
		updatedAt: now,
	});
	return await ctx.db.get(id);
}

async function getOnboardingProfile(ctx: QueryCtx | MutationCtx, userId: string | null) {
	if (!userId) {
		return null;
	}
	return await ctx.db
		.query("onboardingProfiles")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.first();
}

async function getPathProgress(
	ctx: QueryCtx | MutationCtx,
	userId: string | null,
	trackId: string,
) {
	if (!userId) {
		const firstNode = seedNodes.find((node) => node.trackId === trackId);
		return {
			trackId,
			currentNodeOrder: 1,
			highestUnlockedNodeOrder: 1,
			activeNodeId: firstNode?.id ?? "",
			completedNodeIds: [],
			masteredNodeIds: [],
		};
	}

	const progress = await ctx.db
		.query("userQuestPathProgress")
		.withIndex("by_user_track", (q) =>
			q.eq("userId", userId).eq("trackId", trackId),
		)
		.first();
	if (progress) {
		return progress;
	}

	const firstNode = seedNodes.find((node) => node.trackId === trackId);
	return {
		trackId,
		currentNodeOrder: 1,
		highestUnlockedNodeOrder: 1,
		activeNodeId: firstNode?.id ?? "",
		completedNodeIds: [],
		masteredNodeIds: [],
	};
}

function mapNodesForProgress(
	nodes: Array<QuestNodeSeed | Doc<"questNodes">>,
	progress: {
		activeNodeId: string;
		completedNodeIds: string[];
		masteredNodeIds: string[];
		highestUnlockedNodeOrder: number;
	},
) {
	return nodes.map((node) => {
		const completed = progress.completedNodeIds.includes(node.id);
		const mastered = progress.masteredNodeIds.includes(node.id);
		const locked = node.pathOrder > progress.highestUnlockedNodeOrder;
		return {
			...node,
			status: completed
				? "completed"
				: mastered
					? "completed"
					: node.id === progress.activeNodeId
						? "current"
						: locked
							? "locked"
							: node.nodeType === "milestone" || node.nodeType === "boss"
								? "special"
								: "unlocked",
			label: node.id === progress.activeNodeId ? "START" : node.badgeLabel,
		};
	});
}

function scoreSubmission(submissionPayload: unknown, lesson: LessonDefinitionSeed | Doc<"lessonDefinitions">) {
	const text =
		typeof submissionPayload === "string"
			? submissionPayload
			: typeof submissionPayload === "object" && submissionPayload !== null
				? Object.values(submissionPayload as Record<string, unknown>)
						.map((value) => (typeof value === "string" ? value : ""))
						.join(" ")
				: "";
	const trimmed = text.trim();
	const checklist = (lesson.scaffoldPayload as { checklistItems?: string[] })
		?.checklistItems ?? [];
	const matchedCriteria = checklist.filter((item) =>
		trimmed.toLowerCase().includes(item.split(" ")[0]?.toLowerCase() ?? ""),
	);
	const passingScore =
		(lesson.evaluationPayload as { passingScore?: number }).passingScore ?? 70;
	const score = Math.min(100, Math.max(0, Math.round(trimmed.length / 3) + matchedCriteria.length * 8));

	return {
		score,
		passed: score >= passingScore,
		matchedCriteria,
		feedback:
			score >= passingScore
				? ["Quest passed. Claim your reward to advance the path."]
				: ["Add more specific constraints, target details, and success criteria before retrying."],
	};
}

export const getQuestHome = query({
	args: { trackId: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);
		const onboarding = await getOnboardingProfile(ctx, userId);
		const selectedTrackId =
			args.trackId ?? onboarding?.selectedTrackId ?? DEFAULT_TRACK_ID;
		const track = getTrack(selectedTrackId);
		const [stats, progress, nodes, lessons] = await Promise.all([
			getStats(ctx, userId),
			getPathProgress(ctx, userId, track.id),
			getTrackNodes(ctx, track.id),
			getTrackLessons(ctx, track.id),
		]);
		const activeNode =
			nodes.find((node) => node.id === progress.activeNodeId) ?? nodes[0];
		const activeLesson = activeNode
			? lessons.find((lesson) => lesson.id === activeNode.lessonId)
			: null;
		const lessonById = new Map(
			lessons.map((lesson) => [lesson.id, lesson]),
		);
		const roadmapNodes = mapNodesForProgress(nodes, progress).map((node) => {
			const lesson = lessonById.get(node.lessonId);
			return {
				...node,
				lessonTitle: node.lessonTitle ?? lesson?.title ?? "Untitled lesson",
				lessonSubtitle: node.lessonSubtitle ?? lesson?.subtitle ?? "",
				difficulty: node.difficulty ?? lesson?.difficulty ?? "beginner",
			};
		});

		return {
			tracks: getActiveTracks(),
			activeTrack: track,
			stats,
			progress,
			activeNode,
			activeLesson,
			nodes: roadmapNodes.slice(0, 12),
			hearts: 5,
			headerStats: buildHomeHeaderStats({
				currentStreak: stats.currentStreak,
				lifetimeXp: stats.lifetimeXp,
				walletXp: stats.walletXp,
				hearts: 5,
			}),
			featuredCourse: buildFeaturedCourseOverview({
				statsLevel: stats.level,
				activeTrackTitle: track.title,
				activeLessonTitle: activeLesson?.title,
				activeNodePathOrder: activeNode?.pathOrder,
				completedNodeCount: progress.completedNodeIds.length,
				totalNodeCount: nodes.length,
			}),
		};
	},
});

export const getTrackOverview = query({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);
		const [progress, nodes, lessons] = await Promise.all([
			getPathProgress(ctx, userId, args.trackId),
			getTrackNodes(ctx, args.trackId),
			getTrackLessons(ctx, args.trackId),
		]);
		return {
			track: getTrack(args.trackId),
			progress,
			nodes: mapNodesForProgress(nodes, progress).map((node) => {
				const lesson = lessons.find((item) => item.id === node.lessonId);
				return {
					...node,
					lessonTitle: node.lessonTitle ?? lesson?.title ?? "Untitled lesson",
					lessonSubtitle: node.lessonSubtitle ?? lesson?.subtitle ?? "",
					difficulty: node.difficulty ?? lesson?.difficulty ?? "beginner",
				};
			}),
			lessons,
		};
	},
});

export const getQuestNodeDetail = query({
	args: { nodeId: v.string() },
	handler: async (ctx, args) => {
		const node = await getNode(ctx, args.nodeId);
		if (!node) {
			return null;
		}
		const lesson = await getLesson(ctx, node.lessonId);
		return { node, lesson };
	},
});

export const getLessonDefinition = query({
	args: { lessonId: v.string() },
	handler: async (ctx, args) => await getLesson(ctx, args.lessonId),
});

export const getUserQuestPathProgress = query({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);
		return await getPathProgress(ctx, userId, args.trackId);
	},
});

export const getQuestRun = query({
	args: { runId: v.id("questRuns") },
	handler: async (ctx, args) => {
		const run = await ctx.db.get(args.runId);
		if (!run) {
			return null;
		}
		const [node, lesson, attempts] = await Promise.all([
			getNode(ctx, run.nodeId),
			getLesson(ctx, run.lessonId),
			ctx.db
				.query("questAttempts")
				.withIndex("by_run", (q) => q.eq("runId", args.runId))
				.collect(),
		]);
		return { run: { ...run, id: args.runId }, node, lesson, attempts };
	},
});

export const getQuestResult = query({
	args: { runId: v.id("questRuns") },
	handler: async (ctx, args) => {
		const run = await ctx.db.get(args.runId);
		if (!run) {
			return null;
		}
		const attempts = await ctx.db
			.query("questAttempts")
			.withIndex("by_run", (q) => q.eq("runId", args.runId))
			.collect();
		const latestAttempt =
			attempts.length > 0 ? attempts[attempts.length - 1] : null;
		const lesson = await getLesson(ctx, run.lessonId);
		return { run: { ...run, id: args.runId }, latestAttempt, lesson };
	},
});

export const getStoreCatalog = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getUserId(ctx);
		const stats = await getStats(ctx, userId);
		const catalogRows = await ctx.db
			.query("perkCatalog")
			.withIndex("by_active_order", (q) => q.eq("isActive", true))
			.collect();
		const catalog = catalogRows.length > 0 ? catalogRows : DEFAULT_PERK_CATALOG;
		const inventory = userId
			? await ctx.db
					.query("userPerkInventory")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect()
			: [];

		return {
			walletXp: stats.walletXp,
			lifetimeXp: stats.lifetimeXp,
			items: catalog.map((perk) => ({
				...perk,
				owned:
					inventory.find((item) => item.perkId === perk.id)?.quantity ?? 0,
				canAfford: stats.walletXp >= perk.costXp,
			})),
		};
	},
});

export const getProfileOverview = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getUserId(ctx);
		const identity = await ctx.auth.getUserIdentity();
		const stats = await getStats(ctx, userId);
		const activePerks = userId
			? await ctx.db
					.query("activePerkEffects")
					.withIndex("by_user_active", (q) =>
						q.eq("userId", userId).eq("isActive", true),
					)
					.collect()
			: [];
		const progressRows = userId
			? await ctx.db
					.query("userQuestPathProgress")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect()
			: [];
		const achievements = await getProfileAchievements(ctx, userId);
		const usageQuota = await getProfileUsageQuota(ctx, userId);

		return {
			user: {
				id: userId,
				name: identity?.name ?? identity?.nickname ?? "PromptPal learner",
				email: identity?.email ?? "",
				avatarUrl: identity?.pictureUrl,
			},
			stats,
			activePerks,
			trackSummary: getActiveTracks().map((track) => {
				const progress = progressRows.find((row) => row.trackId === track.id);
				return {
					trackId: track.id,
					title: track.title,
					completedNodes: progress?.completedNodeIds.length ?? 0,
					currentNodeOrder: progress?.currentNodeOrder ?? 1,
				};
			}),
			achievements,
			usageQuota,
		};
	},
});

export const getRankOverview = query({
	args: { year: v.optional(v.number()), month: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const userId = await getUserId(ctx);
		const stats = await getStats(ctx, userId);
		const now = new Date();
		const year = args.year ?? now.getUTCFullYear();
		const month = args.month ?? now.getUTCMonth() + 1;
		const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
		const activityRows = userId
			? await ctx.db
					.query("dailyActivity")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect()
			: [];
		const monthRows = activityRows.filter((row) =>
			row.date.startsWith(`${year}-${String(month).padStart(2, "0")}`),
		);
		const calendar = Array.from({ length: daysInMonth }, (_, index) => {
			const date = monthKey(year, month, index + 1);
			const activity = monthRows.find((row) => row.date === date);
			return {
				date,
				questsCompleted: activity?.questsCompleted ?? 0,
				xpEarned: activity?.xpEarned ?? 0,
				streakProtected: activity?.streakProtected ?? false,
				perfectDay: activity?.perfectDay ?? false,
			};
		});

		return {
			stats,
			currentStreak: stats.currentStreak,
			longestStreak: stats.longestStreak,
			globalRank: stats.globalRank,
			perfectDays: monthRows.filter((row) => row.perfectDay).length,
			protectedStreakDays: monthRows.filter((row) => row.streakProtected).length,
			calendar,
		};
	},
});

export const getOnboardingState = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getUserId(ctx);
		const profile = await getOnboardingProfile(ctx, userId);
		const selectedTrackId = getTrack(profile?.selectedTrackId).id;
		const progress = await getPathProgress(ctx, userId, selectedTrackId);
		return {
			profile,
			status: profile?.status ?? "not_started",
			version: profile?.version ?? ONBOARDING_VERSION,
			selectedTrackId,
			firstActiveNodeId: progress.activeNodeId,
			tracks: getActiveTracks(),
		};
	},
});

export const startQuestRun = mutation({
	args: { nodeId: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const node = await getNode(ctx, args.nodeId);
		if (!node) {
			throw new Error("Quest node not found");
		}
		const lesson = await getLesson(ctx, node.lessonId);
		if (!lesson) {
			throw new Error("Lesson not found");
		}
		const now = Date.now();
		const runId = await ctx.db.insert("questRuns", {
			userId,
			trackId: node.trackId,
			nodeId: node.id,
			lessonId: lesson.id,
			status: "started",
			startedAt: now,
			attemptCount: 0,
			heartsRemaining: 5 - lesson.heartsCost,
			timeSpentMs: 0,
			rewardXp: lesson.rewardXp,
			rewardClaimed: false,
			createdAt: now,
			updatedAt: now,
		});
		return { runId, node, lesson };
	},
});

export const switchActiveTrack = mutation({
	args: { trackId: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const track = getTrack(args.trackId);
		const nodes = await getTrackNodes(ctx, track.id);
		const firstNode = nodes[0];
		const now = Date.now();

		const onboarding = await getOnboardingProfile(ctx, userId);
		if (onboarding) {
			await ctx.db.patch(onboarding._id, {
				selectedTrackId: track.id,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("onboardingProfiles", {
				userId,
				status: "in_progress",
				selectedTrackId: track.id,
				version: ONBOARDING_VERSION,
				createdAt: now,
				updatedAt: now,
			});
		}

		const progress = await ctx.db
			.query("userQuestPathProgress")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", userId).eq("trackId", track.id),
			)
			.first();
		if (!progress && firstNode) {
			await ctx.db.insert("userQuestPathProgress", {
				userId,
				trackId: track.id,
				currentNodeOrder: firstNode.pathOrder,
				highestUnlockedNodeOrder: firstNode.pathOrder,
				activeNodeId: firstNode.id,
				completedNodeIds: [],
				masteredNodeIds: [],
				createdAt: now,
				updatedAt: now,
			});
		}

		return { selectedTrackId: track.id, firstActiveNodeId: firstNode?.id ?? null };
	},
});

export const submitQuestAttempt = mutation({
	args: {
		runId: v.id("questRuns"),
		submissionPayload: v.any(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const run = await ctx.db.get(args.runId);
		if (!run || run.userId !== userId) {
			throw new Error("Quest run not found");
		}
		const lesson = await getLesson(ctx, run.lessonId);
		if (!lesson) {
			throw new Error("Lesson not found");
		}
		const now = Date.now();
		const result = scoreSubmission(args.submissionPayload, lesson);
		const attemptId = await ctx.db.insert("questAttempts", {
			runId: args.runId,
			userId,
			lessonId: run.lessonId,
			submissionPayload: args.submissionPayload,
			evaluationPayload: lesson.evaluationPayload,
			score: result.score,
			passed: result.passed,
			feedback: result.feedback,
			matchedCriteria: result.matchedCriteria,
			createdAt: now,
		});
		await ctx.db.patch(args.runId, {
			status: result.passed ? "submitted" : "failed",
			submittedAt: now,
			attemptCount: run.attemptCount + 1,
			heartsRemaining: Math.max(0, run.heartsRemaining - (result.passed ? 0 : 1)),
			timeSpentMs: now - run.startedAt,
			finalScore: result.score,
			resultSummary: result,
			updatedAt: now,
		});
		return { attemptId, ...result };
	},
});

export const claimQuestRewards = mutation({
	args: { runId: v.id("questRuns") },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const run = await ctx.db.get(args.runId);
		if (!run || run.userId !== userId) {
			throw new Error("Quest run not found");
		}
		if (run.rewardClaimed) {
			return { rewardXp: 0, alreadyClaimed: true };
		}
		if ((run.finalScore ?? 0) <= 0) {
			throw new Error("Submit a passing attempt before claiming rewards");
		}
		const now = Date.now();
		const stats = await getOrCreateStats(ctx, userId);
		const lifetimeXp = (stats?.lifetimeXp ?? stats?.totalXp ?? 0) + run.rewardXp;
		const walletXp = (stats?.walletXp ?? stats?.points ?? 0) + run.rewardXp;
		if (stats) {
			await ctx.db.patch(stats._id, {
				totalXp: lifetimeXp,
				lifetimeXp,
				walletXp,
				currentLevel: getLevelFromLifetimeXp(lifetimeXp),
				points: walletXp,
				updatedAt: now,
			});
		}
		await ctx.db.patch(args.runId, {
			status: "completed",
			completedAt: now,
			rewardClaimed: true,
			updatedAt: now,
		});
		await upsertDailyActivity(ctx, userId, run.rewardXp, (run.finalScore ?? 0) >= 90);
		await unlockNextQuestNodeInternal(ctx, userId, run.trackId, run.nodeId);
		return { rewardXp: run.rewardXp, lifetimeXp, walletXp };
	},
});

async function unlockNextQuestNodeInternal(
	ctx: MutationCtx,
	userId: string,
	trackId: string,
	completedNodeId: string,
) {
	const now = Date.now();
	const nodes = await getTrackNodes(ctx, trackId);
	const completedNode = nodes.find((node) => node.id === completedNodeId);
	if (!completedNode) {
		return null;
	}
	const nextOrder = completedNode.pathOrder + 1;
	const nextNode =
		nodes.find((node) => node.pathOrder === nextOrder) ?? completedNode;
	const progress = await ctx.db
		.query("userQuestPathProgress")
		.withIndex("by_user_track", (q) =>
			q.eq("userId", userId).eq("trackId", trackId),
		)
		.first();
	const completedNodeIds = Array.from(
		new Set([...(progress?.completedNodeIds ?? []), completedNodeId]),
	);
	const masteredNodeIds = progress?.masteredNodeIds ?? [];

	if (progress) {
		await ctx.db.patch(progress._id, {
			currentNodeOrder: nextNode.pathOrder,
			highestUnlockedNodeOrder: Math.max(
				progress.highestUnlockedNodeOrder,
				nextNode.pathOrder,
			),
			activeNodeId: nextNode.id,
			completedNodeIds,
			masteredNodeIds,
			updatedAt: now,
		});
		return progress._id;
	}

	return await ctx.db.insert("userQuestPathProgress", {
		userId,
		trackId,
		currentNodeOrder: nextNode.pathOrder,
		highestUnlockedNodeOrder: nextNode.pathOrder,
		activeNodeId: nextNode.id,
		completedNodeIds,
		masteredNodeIds,
		createdAt: now,
		updatedAt: now,
	});
}

export const unlockNextQuestNode = mutation({
	args: { trackId: v.string(), completedNodeId: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		return await unlockNextQuestNodeInternal(
			ctx,
			userId,
			args.trackId,
			args.completedNodeId,
		);
	},
});

export const purchasePerk = mutation({
	args: { perkId: v.string() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const dbPerk = await ctx.db
			.query("perkCatalog")
			.withIndex("by_slug", (q) => q.eq("slug", args.perkId))
			.first();
		const perk =
			dbPerk ??
			DEFAULT_PERK_CATALOG.find(
				(item) => item.id === args.perkId || item.slug === args.perkId,
			);
		if (!perk) {
			throw new Error("Perk not found");
		}
		const stats = await getOrCreateStats(ctx, userId);
		const walletXp = stats?.walletXp ?? stats?.points ?? 0;
		if (!stats || walletXp < perk.costXp) {
			throw new Error("Not enough wallet XP");
		}
		const now = Date.now();
		await ctx.db.patch(stats._id, {
			walletXp: walletXp - perk.costXp,
			points: walletXp - perk.costXp,
			updatedAt: now,
		});
		const existing = await ctx.db
			.query("userPerkInventory")
			.withIndex("by_user_perk", (q) =>
				q.eq("userId", userId).eq("perkId", perk.id),
			)
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, {
				quantity: existing.quantity + 1,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("userPerkInventory", {
				userId,
				perkId: perk.id,
				perkType: perk.perkType,
				quantity: 1,
				createdAt: now,
				updatedAt: now,
			});
		}
		return { walletXp: walletXp - perk.costXp };
	},
});

export const redeemPerk = mutation({
	args: { perkType: v.string(), targetContext: v.optional(v.any()) },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const inventory = await ctx.db
			.query("userPerkInventory")
			.withIndex("by_user_type", (q) =>
				q.eq("userId", userId).eq("perkType", args.perkType),
			)
			.first();
		if (!inventory || inventory.quantity < 1) {
			throw new Error("No perk available to redeem");
		}
		const perk =
			DEFAULT_PERK_CATALOG.find((item) => item.perkType === args.perkType) ??
			(await ctx.db
				.query("perkCatalog")
				.withIndex("by_active_order", (q) => q.eq("isActive", true))
				.filter((q) => q.eq(q.field("perkType"), args.perkType))
				.first());
		if (!perk) {
			throw new Error("Perk definition not found");
		}
		const now = Date.now();
		await ctx.db.patch(inventory._id, {
			quantity: inventory.quantity - 1,
			updatedAt: now,
		});
		const effectId = await ctx.db.insert("activePerkEffects", {
			userId,
			perkId: perk.id,
			perkType: perk.perkType,
			targetContext: args.targetContext,
			effectValue: perk.effectValue,
			startedAt: now,
			expiresAt: perk.durationSeconds ? now + perk.durationSeconds * 1000 : undefined,
			isActive: true,
			createdAt: now,
			updatedAt: now,
		});
		return { effectId };
	},
});

async function upsertDailyActivity(
	ctx: MutationCtx,
	userId: string,
	xpEarned: number,
	perfectDay: boolean,
) {
	const now = Date.now();
	const date = todayKey(now);
	const existing = await ctx.db
		.query("dailyActivity")
		.withIndex("by_user_date", (q) => q.eq("userId", userId).eq("date", date))
		.first();
	if (existing) {
		await ctx.db.patch(existing._id, {
			questsCompleted: existing.questsCompleted + 1,
			xpEarned: existing.xpEarned + xpEarned,
			perfectDay: existing.perfectDay || perfectDay,
			updatedAt: now,
		});
		return existing._id;
	}
	return await ctx.db.insert("dailyActivity", {
		userId,
		date,
		questsCompleted: 1,
		xpEarned,
		streakProtected: false,
		perfectDay,
		createdAt: now,
		updatedAt: now,
	});
}

export const recordDailyActivity = mutation({
	args: {
		runId: v.id("questRuns"),
		xpEarned: v.number(),
		perfectDay: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const run = await ctx.db.get(args.runId);
		if (!run || run.userId !== userId) {
			throw new Error("Quest run not found");
		}
		return await upsertDailyActivity(ctx, userId, args.xpEarned, args.perfectDay);
	},
});

export const saveOnboardingStep = mutation({
	args: { stepId: v.string(), payload: v.any() },
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const now = Date.now();
		const existing = await getOnboardingProfile(ctx, userId);
		const patch = {
			status: "in_progress" as const,
			version: ONBOARDING_VERSION,
			updatedAt: now,
			...(args.stepId === "track"
				? { selectedTrackId: args.payload?.selectedTrackId }
				: {}),
			...(args.stepId === "experience"
				? { experienceLevel: args.payload?.experienceLevel }
				: {}),
			...(args.stepId === "motivation"
				? { reasonForLearning: args.payload?.reasonForLearning }
				: {}),
			...(args.stepId === "goals"
				? { selectedGoals: args.payload?.selectedGoals }
				: {}),
		};
		if (existing) {
			await ctx.db.patch(existing._id, patch);
			return existing._id;
		}
		return await ctx.db.insert("onboardingProfiles", {
			userId,
			createdAt: now,
			...patch,
		});
	},
});

export const completeOnboarding = mutation({
	args: {
		selectedTrackId: v.string(),
		experienceLevel: v.string(),
		reasonForLearning: v.string(),
		selectedGoals: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const now = Date.now();
		const track = getTrack(args.selectedTrackId);
		const nodes = await getTrackNodes(ctx, track.id);
		const firstNode = nodes[0];
		const existing = await getOnboardingProfile(ctx, userId);
		const profilePayload = {
			userId,
			status: "completed" as const,
			experienceLevel: args.experienceLevel,
			reasonForLearning: args.reasonForLearning,
			selectedTrackId: track.id,
			selectedGoals: args.selectedGoals,
			completedAt: now,
			version: ONBOARDING_VERSION,
			updatedAt: now,
		};
		if (existing) {
			await ctx.db.patch(existing._id, profilePayload);
		} else {
			await ctx.db.insert("onboardingProfiles", {
				...profilePayload,
				createdAt: now,
			});
		}
		const progress = await ctx.db
			.query("userQuestPathProgress")
			.withIndex("by_user_track", (q) =>
				q.eq("userId", userId).eq("trackId", track.id),
			)
			.first();
		if (!progress && firstNode) {
			await ctx.db.insert("userQuestPathProgress", {
				userId,
				trackId: track.id,
				currentNodeOrder: firstNode.pathOrder,
				highestUnlockedNodeOrder: firstNode.pathOrder,
				activeNodeId: firstNode.id,
				completedNodeIds: [],
				masteredNodeIds: [],
				createdAt: now,
				updatedAt: now,
			});
		}
		return { selectedTrackId: track.id, firstActiveNodeId: firstNode?.id ?? null };
	},
});
