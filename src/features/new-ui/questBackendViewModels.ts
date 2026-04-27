type Difficulty = "beginner" | "intermediate" | "advanced" | string;

type QuestPlayInput = {
	run?: {
		heartsRemaining?: number;
		rewardXp?: number;
	} | null;
	node?: {
		pathOrder?: number;
		trackId?: string;
	} | null;
	lesson?: {
		title?: string;
		subtitle?: string;
		difficulty?: Difficulty;
		contentPayload?: Record<string, unknown>;
		scaffoldPayload?: Record<string, unknown>;
	} | null;
	trackProgressPercent?: number | null;
};

type QuestResultInput = {
	run?: {
		rewardXp?: number;
		rewardClaimed?: boolean;
		timeSpentMs?: number;
	} | null;
	latestAttempt?: {
		score?: number;
		passed?: boolean;
		feedback?: string[];
	} | null;
};

type NailedItInput = {
	rewardXp?: number;
	lessonDifficulty?: Difficulty;
	completedNodeCount?: number;
	totalNodeCount?: number;
	latestAchievementTitle?: string | null;
};

function getString(value: unknown) {
	return typeof value === "string" ? value : undefined;
}

function getStringArray(value: unknown) {
	return Array.isArray(value)
		? value.filter((item): item is string => typeof item === "string")
		: [];
}

export function formatDuration(ms?: number) {
	const totalSeconds = Math.max(0, Math.round((ms ?? 0) / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function buildQuestPlayViewModel(input: QuestPlayInput) {
	const contentPayload = input.lesson?.contentPayload ?? {};
	const scaffoldPayload = input.lesson?.scaffoldPayload ?? {};
	const pathOrder = input.node?.pathOrder ?? 1;
	const trackId = input.node?.trackId ?? "coding";
	const checklistItems =
		getStringArray(scaffoldPayload.checklistItems).length > 0
			? getStringArray(scaffoldPayload.checklistItems)
			: getStringArray(scaffoldPayload.promptChecklist);

	return {
		progressPercent: Math.max(
			0,
			Math.min(100, Math.round(input.trackProgressPercent ?? pathOrder * 10)),
		),
		heartsRemaining: Math.max(0, input.run?.heartsRemaining ?? 0),
		levelLabel: `LEVEL ${pathOrder}  •  ${trackId.toUpperCase()}`,
		title: input.lesson?.title ?? "Quest",
		subtitle:
			getString(contentPayload.description) ??
			input.lesson?.subtitle ??
			"Submit your best prompt.",
		checklistItems,
		rewardXp: input.run?.rewardXp ?? 0,
	};
}

export function buildQuestResultViewModel(input: QuestResultInput) {
	const scorePercent = Math.max(
		0,
		Math.min(100, Math.round(input.latestAttempt?.score ?? 0)),
	);
	const passed = input.latestAttempt?.passed ?? scorePercent >= 70;
	const rewardClaimed = input.run?.rewardClaimed ?? false;

	return {
		title: passed ? "Flawless!" : "Keep Going",
		description:
			input.latestAttempt?.feedback?.[0] ??
			(passed
				? "Your prompt passed the quest."
				: "Revise your prompt and try again."),
		rewardXp: input.run?.rewardXp ?? 0,
		scorePercent,
		timeLabel: formatDuration(input.run?.timeSpentMs),
		canClaimReward: passed && !rewardClaimed,
		claimButtonLabel: rewardClaimed ? "XP CLAIMED" : "CLAIM XP",
	};
}

export function buildNailedItViewModel(input: NailedItInput) {
	const completed = input.completedNodeCount ?? 0;
	const total = input.totalNodeCount ?? 0;
	const progressPercent =
		total === 0 ? 0 : Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
	const difficulty = (input.lessonDifficulty ?? "beginner").toUpperCase();
	const achievementTitle = input.latestAchievementTitle ?? "next achievement";

	return {
		levelLabel: `CURRENT LEVEL: ${difficulty}`,
		progressPercent,
		progressLabel: `${progressPercent}% COMPLETE`,
		xpLabel: `+${input.rewardXp ?? 0} XP`,
		achievementTitle,
		description: input.latestAchievementTitle
			? `Mastery streak maintained! You've unlocked the ${achievementTitle} badge.`
			: "Mastery streak maintained! Keep going to unlock your next badge.",
	};
}
