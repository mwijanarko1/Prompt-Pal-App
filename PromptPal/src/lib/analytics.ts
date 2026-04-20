import { logger } from "@/lib/logger";
import {
	initializeAmplitude,
	trackAmplitudeEvent,
} from "@/lib/amplitude";

const compactEventProperties = (
	params: Record<string, string | number | boolean | undefined>,
) =>
	Object.fromEntries(
		Object.entries(params).filter(([, value]) => value !== undefined),
	) as Record<string, string | number | boolean>;

export const logEvent = (
	name: string,
	params?: Record<string, string | number | boolean>,
) => {
	logger.info("Analytics", name, params);
};

export const initializeAnalytics = () => {
	void initializeAmplitude();
};

export const logSignUp = (params: {
	method: "email" | "google" | "apple";
	userId?: string | null;
}) => {
	const eventProperties = {
		signup_method: params.method,
	};

	logEvent("sign_up", eventProperties);
	void trackAmplitudeEvent("sign_up", eventProperties, {
		userId: params.userId,
	});
};

export const logLandingPageViewed = (params?: {
	source?: string;
	medium?: string;
	campaign?: string;
	referrer?: string;
}) => {
	const eventProperties = compactEventProperties({
		source: params?.source,
		medium: params?.medium,
		campaign: params?.campaign,
		referrer: params?.referrer,
	});

	logEvent("landing_page_viewed", eventProperties);
	void trackAmplitudeEvent("landing_page_viewed", eventProperties);
};

export const logOnboardingStarted = (params?: {
	step?: string;
	stepIndex?: number;
	totalSteps?: number;
}) => {
	const eventProperties = compactEventProperties({
		step: params?.step,
		step_index: params?.stepIndex,
		total_steps: params?.totalSteps,
	});

	logEvent("onboarding_started", eventProperties);
	void trackAmplitudeEvent("onboarding_started", eventProperties);
};

export const logOnboardingStepCompleted = (params: {
	step: string;
	stepIndex: number;
	totalSteps: number;
}) => {
	const eventProperties = {
		step: params.step,
		step_index: params.stepIndex,
		total_steps: params.totalSteps,
	};

	logEvent("onboarding_step_completed", eventProperties);
	void trackAmplitudeEvent("onboarding_step_completed", eventProperties);
};

export const logOnboardingCompleted = (params?: {
	step?: string;
	stepIndex?: number;
	totalSteps?: number;
}) => {
	const eventProperties = compactEventProperties({
		step: params?.step,
		step_index: params?.stepIndex,
		total_steps: params?.totalSteps,
	});

	logEvent("onboarding_completed", eventProperties);
	void trackAmplitudeEvent("onboarding_completed", eventProperties);
};

export const logOnboardingAbandoned = (params?: {
	step?: string;
	stepIndex?: number;
	totalSteps?: number;
	reason?: string;
}) => {
	const eventProperties = compactEventProperties({
		step: params?.step,
		step_index: params?.stepIndex,
		total_steps: params?.totalSteps,
		reason: params?.reason,
	});

	logEvent("onboarding_abandoned", eventProperties);
	void trackAmplitudeEvent("onboarding_abandoned", eventProperties);
};

type LessonAnalyticsParams = {
	lessonId: string;
	lessonType?: string;
	moduleId?: string;
	difficulty?: string;
	score?: number;
	passingScore?: number;
	attemptNumber?: number;
};

export const logFirstLessonStarted = (params: LessonAnalyticsParams) => {
	const eventProperties = compactEventProperties({
		lesson_id: params.lessonId,
		lesson_type: params.lessonType,
		module_id: params.moduleId,
		difficulty: params.difficulty,
		attempt_number: params.attemptNumber,
	});

	logEvent("first_lesson_started", eventProperties);
	void trackAmplitudeEvent("first_lesson_started", eventProperties);
};

export const logLessonStarted = (params: LessonAnalyticsParams) => {
	const eventProperties = compactEventProperties({
		lesson_id: params.lessonId,
		lesson_type: params.lessonType,
		module_id: params.moduleId,
		difficulty: params.difficulty,
		attempt_number: params.attemptNumber,
	});

	logEvent("lesson_started", eventProperties);
	void trackAmplitudeEvent("lesson_started", eventProperties);
};

export const logLessonCompleted = (params: LessonAnalyticsParams) => {
	const eventProperties = compactEventProperties({
		lesson_id: params.lessonId,
		lesson_type: params.lessonType,
		module_id: params.moduleId,
		difficulty: params.difficulty,
		score: params.score,
		passing_score: params.passingScore,
		attempt_number: params.attemptNumber,
	});

	logEvent("lesson_completed", eventProperties);
	void trackAmplitudeEvent("lesson_completed", eventProperties);
};

export const logLessonFailed = (params: LessonAnalyticsParams) => {
	const eventProperties = compactEventProperties({
		lesson_id: params.lessonId,
		lesson_type: params.lessonType,
		module_id: params.moduleId,
		difficulty: params.difficulty,
		score: params.score,
		passing_score: params.passingScore,
		attempt_number: params.attemptNumber,
	});

	logEvent("lesson_failed", eventProperties);
	void trackAmplitudeEvent("lesson_failed", eventProperties);
};

export const logQuizAnswerSubmitted = (params: {
	quizId: string;
	questionId: string;
	answerLength?: number;
	score?: number;
	isCorrect?: boolean;
}) => {
	const eventProperties = compactEventProperties({
		quiz_id: params.quizId,
		question_id: params.questionId,
		answer_length: params.answerLength,
		score: params.score,
		is_correct: params.isCorrect,
	});

	logEvent("quiz_answer_submitted", eventProperties);
	void trackAmplitudeEvent("quiz_answer_submitted", eventProperties);
};

export const logDifficultyLevelUnlocked = (params: {
	levelId: string;
	lessonType?: string;
	difficulty?: string;
	moduleId?: string;
}) => {
	const eventProperties = compactEventProperties({
		level_id: params.levelId,
		lesson_type: params.lessonType,
		difficulty: params.difficulty,
		module_id: params.moduleId,
	});

	logEvent("difficulty_level_unlocked", eventProperties);
	void trackAmplitudeEvent("difficulty_level_unlocked", eventProperties);
};

export const logTopicCompleted = (params: {
	moduleId: string;
	title?: string;
	topic?: string;
	progress?: number;
}) => {
	const eventProperties = compactEventProperties({
		module_id: params.moduleId,
		title: params.title,
		topic: params.topic,
		progress: params.progress,
	});

	logEvent("topic_completed", eventProperties);
	void trackAmplitudeEvent("topic_completed", eventProperties);
};

export const logSessionStarted = (params?: {
	source?: string;
}) => {
	const eventProperties = compactEventProperties({
		source: params?.source,
	});

	logEvent("session_started", eventProperties);
	void trackAmplitudeEvent("session_started", eventProperties);
};

export const logSessionEnded = (params?: {
	durationSeconds?: number;
	reason?: string;
}) => {
	const eventProperties = compactEventProperties({
		duration_seconds: params?.durationSeconds,
		reason: params?.reason,
	});

	logEvent("session_ended", eventProperties);
	void trackAmplitudeEvent("session_ended", eventProperties);
};

export const logPricingPageViewed = (params?: {
	required?: boolean;
}) => {
	const eventProperties = compactEventProperties({
		required: params?.required,
	});

	logEvent("pricing_page_viewed", eventProperties);
	void trackAmplitudeEvent("pricing_page_viewed", eventProperties);
};

export const logPaywallHit = (params?: {
	required?: boolean;
}) => {
	const eventProperties = compactEventProperties({
		required: params?.required,
	});

	logEvent("paywall_hit", eventProperties);
	void trackAmplitudeEvent("paywall_hit", eventProperties);
};

export const logTrialStarted = (params?: {
	productId?: string;
	expirationDate?: string;
}) => {
	const eventProperties = compactEventProperties({
		product_id: params?.productId,
		expiration_date: params?.expirationDate,
	});

	logEvent("trial_started", eventProperties);
	void trackAmplitudeEvent("trial_started", eventProperties);
};

export const logTrialDayX = (params: {
	day: number;
	productId?: string;
}) => {
	const eventProperties = compactEventProperties({
		trial_day: params.day,
		product_id: params.productId,
	});

	logEvent("trial_day_x", eventProperties);
	void trackAmplitudeEvent("trial_day_x", eventProperties);
};

export const logTrialExpired = (params?: {
	expirationDate?: string;
}) => {
	const eventProperties = compactEventProperties({
		expiration_date: params?.expirationDate,
	});

	logEvent("trial_expired", eventProperties);
	void trackAmplitudeEvent("trial_expired", eventProperties);
};

export const logSubscriptionStarted = (params?: {
	productId?: string;
	periodType?: string;
	priceId?: string;
}) => {
	const eventProperties = compactEventProperties({
		product_id: params?.productId,
		period_type: params?.periodType,
		price_id: params?.priceId,
	});

	logEvent("subscription_started", eventProperties);
	void trackAmplitudeEvent("subscription_started", eventProperties);
};

export const logSubscriptionCancelled = (params?: {
	productId?: string;
	cancelledAt?: string;
}) => {
	const eventProperties = compactEventProperties({
		product_id: params?.productId,
		cancelled_at: params?.cancelledAt,
	});

	logEvent("subscription_cancelled", eventProperties);
	void trackAmplitudeEvent("subscription_cancelled", eventProperties);
};

export const logUsageLimitApproaching = (params: {
	kind: string;
	percentage: number;
	tier: string;
}) => {
	const eventProperties = compactEventProperties({
		kind: params.kind,
		percentage: params.percentage,
		tier: params.tier,
	});

	logEvent("usage_limit_approaching", eventProperties);
	void trackAmplitudeEvent("usage_limit_approaching", eventProperties);
};

export const logProfileViewed = (params?: {
	tier?: string;
	level?: number;
}) => {
	const eventProperties = compactEventProperties({
		tier: params?.tier,
		level: params?.level,
	});

	logEvent("profile_viewed", eventProperties);
	void trackAmplitudeEvent("profile_viewed", eventProperties);
};

export const logProgressViewed = (params?: {
	level?: number;
	totalPrompts?: number;
	avgAccuracy?: number;
	textUsagePercent?: number;
}) => {
	const eventProperties = compactEventProperties({
		level: params?.level,
		total_prompts: params?.totalPrompts,
		avg_accuracy: params?.avgAccuracy,
		text_usage_percent: params?.textUsagePercent,
	});

	logEvent("progress_viewed", eventProperties);
	void trackAmplitudeEvent("progress_viewed", eventProperties);
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
