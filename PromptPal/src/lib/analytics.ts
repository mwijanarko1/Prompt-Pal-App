import { Platform } from "react-native";
import { logger } from "@/lib/logger";

const DEFAULT_AMPLITUDE_API_KEY = "dd2cd7602b39b322b689b6809f589860";
const AMPLITUDE_API_KEY = DEFAULT_AMPLITUDE_API_KEY;

let analyticsInitializationPromise: Promise<void> | null = null;
let amplitudeModule: typeof import("@amplitude/analytics-react-native") | null | undefined;
let sessionReplayPlugin:
	| (typeof import("@amplitude/plugin-session-replay-react-native"))["SessionReplayPlugin"]
	| null
	| undefined;

type AnalyticsPropertyValue = string | number | boolean;
type AnalyticsEventProperties = Record<string, AnalyticsPropertyValue>;

function getErrorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

function compactProperties(
	properties: Record<string, AnalyticsPropertyValue | undefined>,
): AnalyticsEventProperties {
	return Object.fromEntries(
		Object.entries(properties).filter(
			(entry): entry is [string, AnalyticsPropertyValue] => {
				const value = entry[1];
				return value !== undefined;
			},
		),
	);
}

function isWebPlatform(): boolean {
	return Platform.OS === "web";
}

function loadAmplitudeModule() {
	if (isWebPlatform()) {
		return null;
	}

	if (amplitudeModule !== undefined) {
		return amplitudeModule;
	}

	try {
		amplitudeModule = require("@amplitude/analytics-react-native") as typeof import("@amplitude/analytics-react-native");
		return amplitudeModule;
	} catch (error: unknown) {
		logger.warn("Analytics", "Amplitude module failed to load", {
			error: getErrorMessage(error),
		});
		amplitudeModule = null;
		return null;
	}
}

function loadSessionReplayPlugin() {
	if (isWebPlatform()) {
		return null;
	}

	if (sessionReplayPlugin !== undefined) {
		return sessionReplayPlugin;
	}

	try {
		sessionReplayPlugin = (
			require("@amplitude/plugin-session-replay-react-native") as typeof import("@amplitude/plugin-session-replay-react-native")
		).SessionReplayPlugin;
		return sessionReplayPlugin;
	} catch (error: unknown) {
		logger.warn("Analytics", "Session replay plugin failed to load", {
			error: getErrorMessage(error),
		});
		sessionReplayPlugin = null;
		return null;
	}
}

export function initializeAnalytics(): Promise<void> {
	if (analyticsInitializationPromise) {
		return analyticsInitializationPromise;
	}

	analyticsInitializationPromise = (async () => {
		const amplitude = loadAmplitudeModule();
		if (!amplitude) {
			return;
		}

		await amplitude.init(AMPLITUDE_API_KEY).promise;

		const SessionReplayPlugin = loadSessionReplayPlugin();
		if (SessionReplayPlugin) {
			await amplitude.add(new SessionReplayPlugin()).promise;
		}

		logger.info("Analytics", "Amplitude initialized");
	})()
		.catch((error: unknown) => {
			analyticsInitializationPromise = null;
			logger.warn("Analytics", "Amplitude initialization failed", {
				error: getErrorMessage(error),
			});
			throw error;
		});

	return analyticsInitializationPromise;
}

export const logEvent = (
	name: string,
	params?: AnalyticsEventProperties,
) => {
	logger.info("Analytics", name, params);

	if (isWebPlatform()) {
		return;
	}

	try {
		const amplitude = loadAmplitudeModule();
		if (!amplitude) {
			return;
		}

		void amplitude.track(name, params).promise.catch((error: unknown) => {
			logger.warn("Analytics", "Amplitude event tracking failed", {
				error: getErrorMessage(error),
				event: name,
			});
		});
	} catch (error: unknown) {
		logger.warn("Analytics", "Amplitude event tracking failed", {
			error: getErrorMessage(error),
			event: name,
		});
	}
};

export const logSignUp = (params: {
	method: "email" | "google" | "apple";
	source?: string;
}) => {
	logEvent("sign_up", compactProperties(params));
};

export const logLandingPageViewed = (params?: { route?: string }) => {
	logEvent(
		"landing_page_viewed",
		compactProperties({
			route: params?.route,
		}),
	);
};

export const logOnboardingStarted = (params: { totalSteps: number }) => {
	logEvent(
		"onboarding_started",
		compactProperties({
			total_steps: params.totalSteps,
		}),
	);
};

export const logOnboardingStepCompleted = (params: {
	stepName: string;
	stepNumber: number;
	totalSteps: number;
}) => {
	logEvent(
		"onboarding_step_completed",
		compactProperties({
			step_name: params.stepName,
			step_number: params.stepNumber,
			total_steps: params.totalSteps,
		}),
	);
};

export const logOnboardingCompleted = (params: {
	stepsCompleted: number;
	totalSteps: number;
	selectedModule?: string | null;
	xpEarned?: number;
}) => {
	logEvent(
		"onboarding_completed",
		compactProperties({
			steps_completed: params.stepsCompleted,
			total_steps: params.totalSteps,
			selected_module: params.selectedModule ?? undefined,
			xp_earned: params.xpEarned,
		}),
	);
};

export const logOnboardingAbandoned = (params: {
	stepName: string;
	stepNumber: number;
	totalSteps: number;
	reason?: string;
}) => {
	logEvent(
		"onboarding_abandoned",
		compactProperties({
			step_name: params.stepName,
			step_number: params.stepNumber,
			total_steps: params.totalSteps,
			reason: params.reason,
		}),
	);
};

type LessonAnalyticsParams = {
	lessonId: string;
	lessonType: string;
	moduleId?: string;
	topic?: string;
	difficulty?: string;
	isDailyQuest?: boolean;
};

function lessonProperties(params: LessonAnalyticsParams) {
	return compactProperties({
		lesson_id: params.lessonId,
		lesson_type: params.lessonType,
		module_id: params.moduleId,
		topic: params.topic,
		difficulty: params.difficulty,
		is_daily_quest: params.isDailyQuest,
	});
}

export const logFirstLessonStarted = (params: LessonAnalyticsParams) => {
	logEvent("first_lesson_started", lessonProperties(params));
};

export const logLessonStarted = (params: LessonAnalyticsParams) => {
	logEvent("lesson_started", lessonProperties(params));
};

export const logLessonCompleted = (
	params: LessonAnalyticsParams & {
		score: number;
		passingScore: number;
		attemptCount: number;
		xpEarned?: number;
	},
) => {
	logEvent(
		"lesson_completed",
		compactProperties({
			...lessonProperties(params),
			score: params.score,
			passing_score: params.passingScore,
			attempt_count: params.attemptCount,
			xp_earned: params.xpEarned,
		}),
	);
};

export const logLessonFailed = (
	params: LessonAnalyticsParams & {
		score: number;
		passingScore: number;
		attemptCount: number;
	},
) => {
	logEvent(
		"lesson_failed",
		compactProperties({
			...lessonProperties(params),
			score: params.score,
			passing_score: params.passingScore,
			attempt_count: params.attemptCount,
		}),
	);
};

export const logQuizAnswerSubmitted = (
	params: LessonAnalyticsParams & {
		questionId: string;
		answerLength?: number;
		attemptCount?: number;
	},
) => {
	logEvent(
		"quiz_answer_submitted",
		compactProperties({
			...lessonProperties(params),
			question_id: params.questionId,
			answer_length: params.answerLength,
			attempt_count: params.attemptCount,
		}),
	);
};

export const logDifficultyLevelUnlocked = (params: {
	difficulty: string;
	levelId?: string;
	moduleId?: string;
}) => {
	logEvent(
		"difficulty_level_unlocked",
		compactProperties({
			difficulty: params.difficulty,
			level_id: params.levelId,
			module_id: params.moduleId,
		}),
	);
};

export const logTopicCompleted = (params: {
	moduleId?: string;
	topic?: string;
	completedLessons?: number;
	totalLessons?: number;
}) => {
	logEvent(
		"topic_completed",
		compactProperties({
			module_id: params.moduleId,
			topic: params.topic,
			completed_lessons: params.completedLessons,
			total_lessons: params.totalLessons,
		}),
	);
};

export const logSessionStarted = () => {
	logEvent("session_started", { timestamp: Date.now() });
};

export const logSessionEnded = (params: {
	durationMs: number;
	reason?: string;
}) => {
	logEvent(
		"session_ended",
		compactProperties({
			duration_ms: params.durationMs,
			duration_seconds: Math.round(params.durationMs / 1000),
			reason: params.reason,
		}),
	);
};

export const logPricingPageViewed = (params?: { required?: boolean }) => {
	logEvent(
		"pricing_page_viewed",
		compactProperties({
			required: params?.required,
		}),
	);
};

export const logPaywallHit = (params: { trigger: string }) => {
	logEvent("paywall_hit", compactProperties(params));
};

export const logTrialStarted = (params?: { productId?: string }) => {
	logEvent(
		"trial_started",
		compactProperties({
			product_id: params?.productId,
		}),
	);
};

export const logTrialDayX = (params: { day: number }) => {
	logEvent("trial_day_x", { day: params.day });
};

export const logTrialExpired = () => {
	logEvent("trial_expired", {});
};

export const logSubscriptionStarted = (params?: {
	productId?: string;
	packageIdentifier?: string;
	source?: string;
}) => {
	logEvent(
		"subscription_started",
		compactProperties({
			product_id: params?.productId,
			package_identifier: params?.packageIdentifier,
			source: params?.source,
		}),
	);
};

export const logSubscriptionCancelled = (params?: { source?: string }) => {
	logEvent(
		"subscription_cancelled",
		compactProperties({
			source: params?.source,
		}),
	);
};

export const logUsageLimitApproaching = (params: {
	remaining: number;
	limit: number;
	tier: string;
	category?: string;
}) => {
	logEvent(
		"usage_limit_approaching",
		compactProperties({
			remaining: params.remaining,
			limit: params.limit,
			tier: params.tier,
			category: params.category,
		}),
	);
};

export const logProfileViewed = (params?: { isPro?: boolean }) => {
	logEvent(
		"profile_viewed",
		compactProperties({
			is_pro: params?.isPro,
		}),
	);
};

export const logProfileUpdated = (params?: { field?: string }) => {
	logEvent(
		"profile_updated",
		compactProperties({
			field: params?.field,
		}),
	);
};

export const logProgressViewed = (params?: {
	source?: string;
	level?: number;
	xp?: number;
	progressPercentage?: number;
}) => {
	logEvent(
		"progress_viewed",
		compactProperties({
			source: params?.source,
			level: params?.level,
			xp: params?.xp,
			progress_percentage: params?.progressPercentage,
		}),
	);
};

export const logLevelComplete = (
	levelId: string,
	score: number,
	timeSpent: number,
) => {
	logEvent("level_completed", {
		level_id: levelId,
		score,
		time_spent: timeSpent,
	});
};

export const logDailyQuestStart = (questId: string, questType: string) => {
	logEvent("daily_quest_started", { quest_id: questId, quest_type: questType });
};

export const logDailyQuestComplete = (questId: string, xpEarned: number) => {
	logEvent("daily_quest_completed", { quest_id: questId, xp_earned: xpEarned });
};

export const logAchievementUnlocked = (achievementId: string) => {
	logEvent("achievement_unlocked", { achievement_id: achievementId });
};

export const logAppOpen = () => {
	logEvent("app_open", { timestamp: Date.now() });
};

export const logModuleStarted = (moduleId: string) => {
	logEvent("module_started", { module_id: moduleId });
};

export const logModuleCompleted = (moduleId: string, timeSpent: number) => {
	logEvent("module_completed", { module_id: moduleId, time_spent: timeSpent });
};

type SuperpromptCategory = "image" | "copy" | "code";
type SuperpromptRefineMode =
	| "more_detailed"
	| "simplify"
	| "change_tone"
	| undefined;

type SuperpromptTier = "free" | "pro" | undefined;

export const logSuperpromptHomeTrainTapped = () => {
	logEvent("superprompt_home_train_tapped", {});
};

export const logSuperpromptHomeGenerateTapped = () => {
	logEvent("superprompt_home_generate_tapped", {});
};

export const logSuperpromptGenerateSubmitted = (params: {
	category: SuperpromptCategory;
	refine_mode?: SuperpromptRefineMode;
}) => {
	logEvent("superprompt_generate_submitted", {
		category: params.category,
		...(params.refine_mode
			? { refine_mode: params.refine_mode }
			: {}),
	});
};

export const logSuperpromptGenerateSucceeded = (params: {
	category: SuperpromptCategory;
	refine_mode?: SuperpromptRefineMode;
	tier?: SuperpromptTier;
	remaining_quota?: number;
}) => {
	logEvent("superprompt_generate_succeeded", {
		category: params.category,
		...(params.refine_mode
			? { refine_mode: params.refine_mode }
			: {}),
		...(params.tier ? { tier: params.tier } : {}),
		...(params.remaining_quota !== undefined
			? { remaining_quota: params.remaining_quota }
			: {}),
	});
};

export const logSuperpromptGenerateFailed = (params: {
	category: SuperpromptCategory;
	refine_mode?: SuperpromptRefineMode;
	tier?: SuperpromptTier;
	remaining_quota?: number;
}) => {
	logEvent("superprompt_generate_failed", {
		category: params.category,
		...(params.refine_mode
			? { refine_mode: params.refine_mode }
			: {}),
		...(params.tier ? { tier: params.tier } : {}),
		...(params.remaining_quota !== undefined
			? { remaining_quota: params.remaining_quota }
			: {}),
	});
};

export const logSuperpromptRefineTapped = (params: {
	category: SuperpromptCategory;
	refine_mode: SuperpromptRefineMode;
	tier?: SuperpromptTier;
	remaining_quota?: number;
}) => {
	logEvent("superprompt_refine_tapped", {
		category: params.category,
		...(params.refine_mode
			? { refine_mode: params.refine_mode }
			: {}),
		...(params.tier ? { tier: params.tier } : {}),
		...(params.remaining_quota !== undefined
			? { remaining_quota: params.remaining_quota }
			: {}),
	});
};

export const logSuperpromptCopied = (params: {
	category: SuperpromptCategory;
	tier?: SuperpromptTier;
	remaining_quota?: number;
}) => {
	logEvent("superprompt_copied", {
		category: params.category,
		...(params.tier ? { tier: params.tier } : {}),
		...(params.remaining_quota !== undefined
			? { remaining_quota: params.remaining_quota }
			: {}),
	});
};

export const logSuperpromptTrainNudgeTapped = (params: {
	category: SuperpromptCategory;
	tier?: SuperpromptTier;
	remaining_quota?: number;
}) => {
	logEvent("superprompt_train_nudge_tapped", {
		category: params.category,
		...(params.tier ? { tier: params.tier } : {}),
		...(params.remaining_quota !== undefined
			? { remaining_quota: params.remaining_quota }
			: {}),
	});
};

export const logSuperpromptQuotaBlocked = (params: {
	category: SuperpromptCategory;
	tier?: SuperpromptTier;
	remaining_quota?: number;
}) => {
	logEvent("superprompt_quota_blocked", {
		category: params.category,
		...(params.tier ? { tier: params.tier } : {}),
		...(params.remaining_quota !== undefined
			? { remaining_quota: params.remaining_quota }
			: {}),
	});
};
