import { describe, expect, it } from "@jest/globals";

import { buildImageEvaluationRequest } from "@/features/game/utils/imageEvaluationRequest";

describe("buildImageEvaluationRequest", () => {
	it("includes userImageStorageId when the generated result has a storageId", () => {
		const result = buildImageEvaluationRequest({
			levelId: "level-image-1",
			targetImageUrlForEvaluation: "https://example.com/target.png",
			hiddenPromptKeywords: ["vellum", "ink"],
			style: "editorial still life",
			prompt: "An editorial still life with vellum and ink",
			generateResult: {
				imageUrl: "https://example.com/generated.png",
				storageId: "storage-abc",
			},
		});

		expect(result).toEqual({
			taskId: "level-image-1",
			userImageUrl: "https://example.com/generated.png",
			userImageStorageId: "storage-abc",
			expectedImageUrl: "https://example.com/target.png",
			hiddenPromptKeywords: ["vellum", "ink"],
			style: "editorial still life",
			userPrompt: "An editorial still life with vellum and ink",
		});
	});

	it("omits userImageStorageId when the generated result does not include one", () => {
		const result = buildImageEvaluationRequest({
			levelId: "level-image-2",
			targetImageUrlForEvaluation: "https://example.com/target.png",
			hiddenPromptKeywords: ["glass"],
			style: "macro",
			prompt: "A macro shot of glass",
			generateResult: {
				imageUrl: "https://example.com/generated.png",
			},
		});

		expect(result).toEqual({
			taskId: "level-image-2",
			userImageUrl: "https://example.com/generated.png",
			expectedImageUrl: "https://example.com/target.png",
			hiddenPromptKeywords: ["glass"],
			style: "macro",
			userPrompt: "A macro shot of glass",
		});
		expect("userImageStorageId" in result).toBe(false);
	});

	it("preserves the image evaluation fields expected by the backend contract", () => {
		const result = buildImageEvaluationRequest({
			levelId: "level-image-3",
			targetImageUrlForEvaluation: "https://example.com/reference.png",
			hiddenPromptKeywords: ["copper", "fog"],
			style: "cinematic",
			prompt: "Copper machine in fog",
			generateResult: {
				imageUrl: "https://example.com/generated.png",
				storageId: "storage-xyz",
			},
		});

		expect(result.taskId).toBe("level-image-3");
		expect(result.expectedImageUrl).toBe("https://example.com/reference.png");
		expect(result.hiddenPromptKeywords).toEqual(["copper", "fog"]);
		expect(result.style).toBe("cinematic");
		expect(result.userPrompt).toBe("Copper machine in fog");
	});
});
