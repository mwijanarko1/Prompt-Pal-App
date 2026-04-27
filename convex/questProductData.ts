export type TrackId = "coding" | "image-generation" | "copywriting";
export type LessonType = "code" | "image" | "copywriting";
export type LessonMode = "teaching" | "practice" | "milestone" | "boss" | "daily";
export type NodeType = "standard" | "milestone" | "boss" | "reward";

export type LegacyLevel = {
	id: string;
	type: LessonType;
	title: string;
	description?: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	passingScore?: number;
	order?: number;
	targetImageUrl?: string;
	hiddenPromptKeywords?: string[];
	style?: string;
	moduleTitle?: string;
	requirementBrief?: string;
	requirementImage?: string;
	language?: string;
	functionName?: string;
	testCases?: unknown;
	instruction?: string;
	whatUserSees?: string;
	starterCode?: string;
	grading?: unknown;
	failState?: unknown;
	successState?: unknown;
	lessonTakeaway?: string;
	starterContext?: unknown;
	briefTitle?: string;
	briefProduct?: string;
	briefTarget?: string;
	briefTone?: string;
	briefGoal?: string;
	wordLimit?: unknown;
	requiredElements?: string[];
	metrics?: unknown;
	scaffoldType?: "template" | "checklist" | "none";
	scaffoldTemplate?: string;
	checklistItems?: string[];
	promptChecklist?: string[];
	hints?: string[];
	estimatedTime?: number;
	points?: number;
	tags?: string[];
	learningObjectives?: string[];
	prerequisites?: string[];
	unlocked?: boolean;
};

export type LearningTrackSeed = {
	id: TrackId;
	title: string;
	subtitle: string;
	description: string;
	iconKey: string;
	themeKey: string;
	sortOrder: number;
	isActive: boolean;
};

export type LessonDefinitionSeed = {
	id: string;
	trackId: TrackId;
	lessonType: LessonType;
	mode: LessonMode;
	title: string;
	subtitle: string;
	objective: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	nodeOrder: number;
	estimatedTimeSeconds: number;
	heartsCost: number;
	rewardXp: number;
	masteryThreshold: number;
	contentPayload: Record<string, unknown>;
	targetPayload: Record<string, unknown>;
	scaffoldPayload: Record<string, unknown>;
	evaluationPayload: Record<string, unknown>;
	resultPayload: Record<string, unknown>;
	teachingPayload: Record<string, unknown>;
	isActive: boolean;
};

export type QuestNodeSeed = {
	id: string;
	trackId: TrackId;
	lessonId: string;
	lessonTitle: string;
	lessonSubtitle: string;
	difficulty: "beginner" | "intermediate" | "advanced";
	nodeType: NodeType;
	pathOrder: number;
	unlockRule: Record<string, unknown>;
	badgeLabel: string;
	visualMetadata: Record<string, unknown>;
	isActive: boolean;
};

export type PerkCatalogSeed = {
	id: string;
	slug: string;
	name: string;
	description: string;
	perkType: "streak_freeze" | "extra_heart" | "xp_boost" | "skip_token";
	costXp: number;
	effectValue: number;
	durationSeconds?: number;
	sortOrder: number;
	isActive: boolean;
};

export type ProfileOverviewAchievementInput = {
	achievementId: string;
	unlockedAt: number;
	achievement: {
		id: string;
		title: string;
		description: string;
		icon: string;
		rarity: "common" | "rare" | "epic" | "legendary";
	} | null;
};

export type ProfileOverviewUsageInput = {
	tier: "free" | "pro";
	used: {
		textCalls: number;
		imageCalls: number;
		audioSummaries: number;
	};
	limits: {
		textCalls: number;
		imageCalls: number;
		audioSummaries: number;
	};
	periodStart: number;
	periodEnd: number;
};

export type FeaturedCourseOverviewInput = {
	statsLevel: number;
	activeTrackTitle: string;
	activeLessonTitle?: string | null;
	activeNodePathOrder?: number | null;
	completedNodeCount: number;
	totalNodeCount: number;
};

export type HomeHeaderStatsInput = {
	currentStreak: number;
	lifetimeXp: number;
	walletXp: number;
	hearts: number;
};

export const DEFAULT_LEARNING_TRACKS: LearningTrackSeed[] = [
	{
		id: "image-generation",
		title: "Image Generation",
		subtitle: "Direct visual outputs with precision",
		description: "Practice visual prompting through target-image quests.",
		iconKey: "image",
		themeKey: "amber",
		sortOrder: 1,
		isActive: false,
	},
	{
		id: "coding",
		title: "Coding",
		subtitle: "Prompt interfaces and logic into shape",
		description: "Build UI and logic by producing clearer implementation prompts.",
		iconKey: "code",
		themeKey: "green",
		sortOrder: 2,
		isActive: true,
	},
	{
		id: "copywriting",
		title: "Copywriting",
		subtitle: "Shape persuasive drafts with constraints",
		description: "Write sharper marketing, product, and lifecycle copy.",
		iconKey: "copy",
		themeKey: "blue",
		sortOrder: 3,
		isActive: true,
	},
];

export const DEFAULT_PERK_CATALOG: PerkCatalogSeed[] = [
	{
		id: "perk-streak-freeze",
		slug: "streak-freeze",
		name: "Streak Freeze",
		description: "Protect one missed day without losing your streak.",
		perkType: "streak_freeze",
		costXp: 200,
		effectValue: 1,
		sortOrder: 1,
		isActive: true,
	},
	{
		id: "perk-extra-heart",
		slug: "extra-heart",
		name: "Extra Heart",
		description: "Add one heart to your next quest run.",
		perkType: "extra_heart",
		costXp: 120,
		effectValue: 1,
		sortOrder: 2,
		isActive: true,
	},
	{
		id: "perk-double-xp-30m",
		slug: "double-xp-30m",
		name: "Double XP",
		description: "Double quest rewards for the next 30 minutes.",
		perkType: "xp_boost",
		costXp: 500,
		effectValue: 2,
		durationSeconds: 30 * 60,
		sortOrder: 3,
		isActive: true,
	},
	{
		id: "perk-skip-token",
		slug: "skip-token",
		name: "Skip Token",
		description: "Skip a blocked node and keep your path moving.",
		perkType: "skip_token",
		costXp: 900,
		effectValue: 1,
		sortOrder: 4,
		isActive: true,
	},
];

export function getLevelFromLifetimeXp(lifetimeXp: number) {
	return Math.max(1, Math.floor(Math.max(0, lifetimeXp) / 200) + 1);
}

export function buildFeaturedCourseOverview(input: FeaturedCourseOverviewInput) {
	const timelineLevel = input.activeNodePathOrder ?? input.statsLevel;

	return {
		level: Math.max(1, Math.floor(timelineLevel)),
		track: `${input.activeTrackTitle} Track`,
		title: input.activeLessonTitle ?? "Start your first quest",
		progress:
			input.totalNodeCount === 0
				? 0
				: Math.round((input.completedNodeCount / input.totalNodeCount) * 100),
	};
}

export function buildHomeHeaderStats(input: HomeHeaderStatsInput) {
	return {
		currentStreak: input.currentStreak,
		totalXp: input.lifetimeXp,
		hearts: input.hearts,
	};
}

function buildQuotaMetric(used: number, limit: number) {
	return {
		used,
		limit,
		remaining: Math.max(0, limit - used),
		percent: limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
	};
}

export function buildProfileOverviewUsageQuota(usage: ProfileOverviewUsageInput) {
	return {
		tier: usage.tier,
		textCalls: buildQuotaMetric(usage.used.textCalls, usage.limits.textCalls),
		imageCalls: buildQuotaMetric(usage.used.imageCalls, usage.limits.imageCalls),
		periodStart: usage.periodStart,
		periodEnd: usage.periodEnd,
	};
}

export function buildProfileOverviewAchievements(
	rows: ProfileOverviewAchievementInput[],
) {
	return rows.flatMap((row) => {
		if (!row.achievement) {
			return [];
		}

		return {
			id: row.achievement.id,
			title: row.achievement.title,
			description: row.achievement.description,
			icon: row.achievement.icon,
			rarity: row.achievement.rarity,
			unlockedAt: row.unlockedAt,
		};
	});
}

export function getTrackIdForLessonType(type: LessonType): TrackId {
	if (type === "image") {
		return "image-generation";
	}
	if (type === "copywriting") {
		return "copywriting";
	}
	return "coding";
}

function getLessonMode(level: LegacyLevel, nodeOrder: number): LessonMode {
	if (level.id.startsWith("quest_")) {
		return "daily";
	}
	if (nodeOrder % 10 === 0) {
		return "boss";
	}
	if (nodeOrder % 5 === 0) {
		return "milestone";
	}
	return nodeOrder <= 3 ? "teaching" : "practice";
}

function compactPayload(payload: Record<string, unknown>) {
	return Object.fromEntries(
		Object.entries(payload).filter(([, value]) => value !== undefined),
	);
}

export function buildLessonDefinitionsFromLegacyLevels(
	levels: LegacyLevel[],
): LessonDefinitionSeed[] {
	const orderByTrack = new Map<TrackId, number>();

	return [...levels]
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		.map((level) => {
			const trackId = getTrackIdForLessonType(level.type);
			const nodeOrder = (orderByTrack.get(trackId) ?? 0) + 1;
			orderByTrack.set(trackId, nodeOrder);
			const mode = getLessonMode(level, nodeOrder);
			const objective =
				level.learningObjectives?.[0] ??
				level.lessonTakeaway ??
				level.instruction ??
				level.description ??
				`Complete ${level.title}`;

			return {
				id: level.id,
				trackId,
				lessonType: level.type,
				mode,
				title: level.title,
				subtitle:
					level.moduleTitle ??
					level.briefTitle ??
					`${level.difficulty[0].toUpperCase()}${level.difficulty.slice(1)} quest`,
				objective,
				difficulty: level.difficulty,
				nodeOrder,
				estimatedTimeSeconds: (level.estimatedTime ?? 8) * 60,
				heartsCost: level.difficulty === "advanced" ? 2 : 1,
				rewardXp: level.points ?? 100,
				masteryThreshold: 90,
				contentPayload: compactPayload({
					description: level.description ?? level.instruction ?? objective,
					instruction: level.instruction,
					requirementBrief: level.requirementBrief,
					briefProduct: level.briefProduct,
					briefTarget: level.briefTarget,
					briefTone: level.briefTone,
					briefGoal: level.briefGoal,
					hints: level.hints ?? [],
					tags: level.tags ?? [],
				}),
				targetPayload: compactPayload({
					targetImageUrl: level.targetImageUrl,
					requirementImage: level.requirementImage,
					whatUserSees: level.whatUserSees,
					style: level.style,
					requiredElements: level.requiredElements,
				}),
				scaffoldPayload: compactPayload({
					scaffoldType: level.scaffoldType ?? "none",
					scaffoldTemplate: level.scaffoldTemplate,
					checklistItems: level.checklistItems,
					promptChecklist: level.promptChecklist,
					starterCode: level.starterCode,
					starterContext: level.starterContext,
				}),
				evaluationPayload: compactPayload({
					passingScore: level.passingScore ?? 70,
					masteryThreshold: 90,
					hiddenPromptKeywords: level.hiddenPromptKeywords,
					grading: level.grading,
					testCases: level.testCases,
					metrics: level.metrics,
					wordLimit: level.wordLimit,
				}),
				resultPayload: compactPayload({
					successState: level.successState,
					failState: level.failState,
					rewardXp: level.points ?? 100,
					scoreBuckets: [
						{ min: 90, label: "Mastered" },
						{ min: level.passingScore ?? 70, label: "Passed" },
						{ min: 0, label: "Retry" },
					],
				}),
				teachingPayload: compactPayload({
					conceptIntro: objective,
					whyThisMatters: level.lessonTakeaway ?? objective,
					takeaway: level.lessonTakeaway,
					trackConceptTags: level.tags ?? [],
					learningObjectives: level.learningObjectives ?? [],
				}),
				isActive: true,
			};
		});
}

export function buildDefaultQuestNodes(
	lessons: LessonDefinitionSeed[],
): QuestNodeSeed[] {
	return lessons.map((lesson) => {
		const nodeType: NodeType =
			lesson.mode === "boss"
				? "boss"
				: lesson.mode === "milestone"
					? "milestone"
					: "standard";

		return {
			id: `node-${lesson.id}`,
			trackId: lesson.trackId,
			lessonId: lesson.id,
			lessonTitle: lesson.title,
			lessonSubtitle: lesson.subtitle,
			difficulty: lesson.difficulty,
			nodeType,
			pathOrder: lesson.nodeOrder,
			unlockRule:
				lesson.nodeOrder === 1
					? { type: "always" }
					: { type: "previous_node_completed", requiredPathOrder: lesson.nodeOrder - 1 },
			badgeLabel:
				nodeType === "boss"
					? "Boss"
					: nodeType === "milestone"
						? "Milestone"
						: lesson.difficulty,
			visualMetadata: {
				difficulty: lesson.difficulty,
				mode: lesson.mode,
				themeKey:
					DEFAULT_LEARNING_TRACKS.find((track) => track.id === lesson.trackId)
						?.themeKey ?? "green",
			},
			isActive: lesson.isActive,
		};
	});
}
