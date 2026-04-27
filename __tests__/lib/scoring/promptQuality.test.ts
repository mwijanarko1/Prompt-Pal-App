import { describe, expect, it } from "@jest/globals";

import { assessImagePromptQuality } from "@/lib/scoring/promptQuality";

describe("assessImagePromptQuality", () => {
	it("rewards prompts with concrete visual direction", () => {
		const result = assessImagePromptQuality({
			userPrompt:
				"Create a product photo of a brass key on dark velvet, centered composition, soft side lighting, shallow depth of field, low camera angle, realistic style, dark background.",
			publicReferences: ["Recreate the target image.", "Realistic style"],
		});

		expect(result.score).toBeGreaterThanOrEqual(70);
		expect(result.feedback).toEqual([]);
	});

	it("flags thin image prompts that only repeat the brief", () => {
		const result = assessImagePromptQuality({
			userPrompt: "Recreate the target image realistically.",
			publicReferences: ["Recreate the target image.", "Realistic style"],
		});

		expect(result.score).toBeLessThan(70);
		expect(result.feedback).toEqual(
			expect.arrayContaining([
				expect.stringContaining("too thin"),
				expect.stringContaining("mostly repeats the brief"),
			]),
		);
	});
});
