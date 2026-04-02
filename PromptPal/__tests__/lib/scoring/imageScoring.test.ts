import { describe, expect, it, jest, beforeEach } from "@jest/globals";

jest.mock("../../../src/lib/convex-client", () => ({
	convexHttpClient: {
		action: jest.fn(),
	},
}));

jest.mock("../../../convex/_generated/api.js", () => ({
	api: {
		ai: {
			evaluateImage: "ai:evaluateImage",
		},
	},
}));

jest.mock("../../../src/lib/logger", () => ({
	logger: {
		warn: jest.fn(),
		error: jest.fn(),
	},
}));

import { convexHttpClient } from "../../../src/lib/convex-client";
import { ImageScoringService } from "@/lib/scoring/imageScoring";

describe("ImageScoringService", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("uses the backend image evaluation contract directly", async () => {
		const actionMock = convexHttpClient.action as jest.MockedFunction<
			typeof convexHttpClient.action
		>;
		actionMock.mockResolvedValue({
			evaluation: {
				score: 84,
				similarity: 78,
				keywordScore: 90,
				styleScore: 72,
				promptQualityScore: 88,
				feedback: ["Strong composition match."],
				keywordsMatched: ["brass key", "velvet"],
				criteria: [
					{
						name: "Composition",
						score: 78,
						feedback: "Subject placement is close to the reference.",
					},
				],
			},
		});

		const result = await ImageScoringService.scoreImage({
			taskId: "image-1-easy",
			targetImageUrl: "https://example.com/target.png",
			resultImageUrl: "https://example.com/result.png",
			userPrompt: "Create a brass key on velvet with soft side lighting.",
		});

		expect(result).toEqual({
			score: 84,
			similarity: 78,
			keywordScore: 90,
			styleScore: 72,
			promptQualityScore: 88,
			feedback: ["Strong composition match."],
			keywordsMatched: ["brass key", "velvet"],
			criteria: [
				{
					name: "Composition",
					score: 78,
					feedback: "Subject placement is close to the reference.",
				},
			],
		});
	});

	it("falls back cleanly when image evaluation fails", async () => {
		const actionMock = convexHttpClient.action as jest.MockedFunction<
			typeof convexHttpClient.action
		>;
		actionMock.mockRejectedValue(new Error("network down"));

		const result = await ImageScoringService.scoreImage({
			targetImageUrl: "https://example.com/target.png",
			resultImageUrl: "https://example.com/result.png",
		});

		expect(result.score).toBe(25);
		expect(result.similarity).toBe(25);
		expect(result.feedback).toEqual([
			"Image evaluation failed. Review the subject, composition, and style.",
		]);
		expect(result.keywordScore).toBe(0);
		expect(result.styleScore).toBe(0);
		expect(result.promptQualityScore).toBe(0);
	});
});
