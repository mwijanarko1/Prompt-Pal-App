import { describe, expect, it } from "@jest/globals";

import {
	buildNailedItViewModel,
	buildQuestPlayViewModel,
	buildQuestResultViewModel,
} from "@/features/new-ui/questBackendViewModels";

describe("new quest backend view models", () => {
	it("maps a quest run into live play-screen values", () => {
		const viewModel = buildQuestPlayViewModel({
			run: { heartsRemaining: 4, rewardXp: 150 },
			node: { pathOrder: 3, trackId: "coding" },
			lesson: {
				title: "Identity Prompt",
				subtitle: "Prompt foundations",
				difficulty: "beginner",
				contentPayload: {
					description: "Write a clear role prompt.",
				},
				scaffoldPayload: {
					checklistItems: ["Role", "Context"],
				},
			},
			trackProgressPercent: 42,
		});

		expect(viewModel).toEqual({
			progressPercent: 42,
			heartsRemaining: 4,
			levelLabel: "LEVEL 3  •  CODING",
			title: "Identity Prompt",
			subtitle: "Write a clear role prompt.",
			checklistItems: ["Role", "Context"],
			rewardXp: 150,
		});
	});

	it("maps real result data into score and reward labels", () => {
		const viewModel = buildQuestResultViewModel({
			run: {
				rewardXp: 250,
				rewardClaimed: false,
				timeSpentMs: 85000,
			},
			latestAttempt: {
				score: 87,
				passed: true,
				feedback: ["Strong prompt."],
			},
		});

		expect(viewModel).toEqual({
			title: "Flawless!",
			description: "Strong prompt.",
			rewardXp: 250,
			scorePercent: 87,
			timeLabel: "1:25",
			canClaimReward: true,
			claimButtonLabel: "CLAIM XP",
		});
	});

	it("maps completion progress and latest achievement into nailed-it values", () => {
		const viewModel = buildNailedItViewModel({
			rewardXp: 250,
			lessonDifficulty: "advanced",
			completedNodeCount: 8,
			totalNodeCount: 10,
			latestAchievementTitle: "Neutral Architect",
		});

		expect(viewModel).toEqual({
			levelLabel: "CURRENT LEVEL: ADVANCED",
			progressPercent: 80,
			progressLabel: "80% COMPLETE",
			xpLabel: "+250 XP",
			achievementTitle: "Neutral Architect",
			description: "Mastery streak maintained! You've unlocked the Neutral Architect badge.",
		});
	});
});
