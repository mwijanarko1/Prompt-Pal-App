import { logger } from "@/lib/logger";

export const logEvent = (
	name: string,
	params?: Record<string, string | number | boolean>,
) => {
	logger.info("Analytics", name, params);
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
