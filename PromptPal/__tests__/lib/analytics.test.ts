import { describe, expect, it, jest } from "@jest/globals";

type AnalyticsModule = typeof import("@/lib/analytics");
type AnalyticsPlatform = "ios" | "web";

function loadAnalytics(options?: {
	platform?: AnalyticsPlatform;
	throwOnAmplitudeImport?: boolean;
	throwOnSessionReplayImport?: boolean;
}) {
	jest.resetModules();

	const platform = options?.platform ?? "ios";
	const mockInit = jest.fn(() => ({ promise: Promise.resolve() }));
	const mockAdd = jest.fn(() => ({ promise: Promise.resolve() }));
	const mockTrack = jest.fn(() => ({ promise: Promise.resolve() }));
	const mockSessionReplayPlugin = jest.fn(function SessionReplayPlugin() {});

	jest.doMock("react-native", () => {
		return {
			Platform: {
				OS: platform,
				select: jest.fn(
					(values: Record<string, unknown>) =>
						values[platform] ?? values.default,
				),
			},
		};
	});
	if (options?.throwOnAmplitudeImport) {
		jest.doMock(
			"@amplitude/analytics-react-native",
			() => {
				throw new Error("web should not load native amplitude analytics");
			},
			{ virtual: true },
		);
	} else {
		jest.doMock(
			"@amplitude/analytics-react-native",
			() => ({
				add: mockAdd,
				init: mockInit,
				track: mockTrack,
			}),
			{ virtual: true },
		);
	}
	if (options?.throwOnSessionReplayImport) {
		jest.doMock(
			"@amplitude/plugin-session-replay-react-native",
			() => {
				throw new Error("web should not load session replay");
			},
			{ virtual: true },
		);
	} else {
		jest.doMock(
			"@amplitude/plugin-session-replay-react-native",
			() => ({
				SessionReplayPlugin: mockSessionReplayPlugin,
			}),
			{ virtual: true },
		);
	}
	jest.doMock("@/lib/logger", () => ({
		logger: {
			info: jest.fn(),
			warn: jest.fn(),
		},
	}));

	const analytics = require("@/lib/analytics") as AnalyticsModule;

	return {
		analytics,
		mockAdd,
		mockInit,
		mockSessionReplayPlugin,
		mockTrack,
	};
}

describe("analytics", () => {
	it("initializes Amplitude with session replay once", async () => {
		const { analytics, mockAdd, mockInit, mockSessionReplayPlugin } =
			loadAnalytics();

		await analytics.initializeAnalytics();
		await analytics.initializeAnalytics();

		expect(mockInit).toHaveBeenCalledTimes(1);
		expect(mockInit).toHaveBeenCalledWith("dd2cd7602b39b322b689b6809f589860");
		expect(mockSessionReplayPlugin).toHaveBeenCalledTimes(1);
		expect(mockAdd).toHaveBeenCalledTimes(1);
	});

	it("tracks events with properties through Amplitude", () => {
		const { analytics, mockTrack } = loadAnalytics();

		analytics.logEvent("Button Clicked", { buttonColor: "primary" });

		expect(mockTrack).toHaveBeenCalledWith("Button Clicked", {
			buttonColor: "primary",
		});
	});

	it("tracks the product funnel event vocabulary", () => {
		const { analytics, mockTrack } = loadAnalytics();

		analytics.logSignUp({ method: "email", source: "sign-up-screen" });
		analytics.logLandingPageViewed({ route: "/" });
		analytics.logOnboardingStarted({ totalSteps: 12 });
		analytics.logOnboardingStepCompleted({
			stepName: "welcome",
			stepNumber: 1,
			totalSteps: 12,
		});
		analytics.logOnboardingCompleted({
			stepsCompleted: 12,
			totalSteps: 12,
			selectedModule: "image-generation",
			xpEarned: 100,
		});
		analytics.logOnboardingAbandoned({
			stepName: "practice-1",
			stepNumber: 4,
			totalSteps: 12,
			reason: "skip",
		});
		analytics.logFirstLessonStarted({
			lessonId: "lesson-1",
			lessonType: "image",
			moduleId: "image-generation",
		});
		analytics.logLessonStarted({
			lessonId: "lesson-1",
			lessonType: "image",
			moduleId: "image-generation",
		});
		analytics.logLessonCompleted({
			lessonId: "lesson-1",
			lessonType: "image",
			moduleId: "image-generation",
			score: 90,
			passingScore: 75,
			attemptCount: 1,
			xpEarned: 50,
		});
		analytics.logLessonFailed({
			lessonId: "lesson-1",
			lessonType: "image",
			moduleId: "image-generation",
			score: 40,
			passingScore: 75,
			attemptCount: 1,
		});
		analytics.logQuizAnswerSubmitted({
			lessonId: "lesson-1",
			lessonType: "image",
			questionId: "lesson-1",
			answerLength: 42,
			attemptCount: 1,
		});
		analytics.logDifficultyLevelUnlocked({
			difficulty: "intermediate",
			levelId: "lesson-2",
			moduleId: "image-generation",
		});
		analytics.logTopicCompleted({
			moduleId: "image-generation",
			topic: "Image Generation",
			completedLessons: 4,
			totalLessons: 4,
		});
		analytics.logSessionStarted();
		analytics.logSessionEnded({ durationMs: 1_000, reason: "background" });
		analytics.logPricingPageViewed({ required: true });
		analytics.logPaywallHit({ trigger: "subscription_required" });
		analytics.logTrialStarted({ productId: "trial" });
		analytics.logTrialDayX({ day: 3 });
		analytics.logTrialExpired();
		analytics.logSubscriptionStarted({
			productId: "pro",
			packageIdentifier: "monthly",
			source: "paywall",
		});
		analytics.logSubscriptionCancelled({ source: "app_store" });
		analytics.logUsageLimitApproaching({
			remaining: 2,
			limit: 10,
			tier: "free",
			category: "copy",
		});
		analytics.logProfileViewed({ isPro: false });
		analytics.logProfileUpdated({ field: "name" });
		analytics.logProgressViewed({
			source: "train",
			level: 2,
			xp: 250,
			progressPercentage: 40,
		});

		const eventNames = mockTrack.mock.calls.map(
			(call) => (call as unknown[])[0],
		);

		expect(eventNames).toEqual([
			"sign_up",
			"landing_page_viewed",
			"onboarding_started",
			"onboarding_step_completed",
			"onboarding_completed",
			"onboarding_abandoned",
			"first_lesson_started",
			"lesson_started",
			"lesson_completed",
			"lesson_failed",
			"quiz_answer_submitted",
			"difficulty_level_unlocked",
			"topic_completed",
			"session_started",
			"session_ended",
			"pricing_page_viewed",
			"paywall_hit",
			"trial_started",
			"trial_day_x",
			"trial_expired",
			"subscription_started",
			"subscription_cancelled",
			"usage_limit_approaching",
			"profile_viewed",
			"profile_updated",
			"progress_viewed",
		]);
	});

	it("does not import native Amplitude modules on web", async () => {
		const { analytics, mockTrack } = loadAnalytics({
			platform: "web",
			throwOnAmplitudeImport: true,
			throwOnSessionReplayImport: true,
		});

		await expect(analytics.initializeAnalytics()).resolves.toBeUndefined();

		analytics.logSignUp({ method: "email", source: "web-sign-up" });

		expect(mockTrack).not.toHaveBeenCalled();
	});
});
