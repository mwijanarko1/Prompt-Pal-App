import { describe, expect, it } from "@jest/globals";

import {
	getChecklistMatchResult,
	getMatchedChecklistItems,
	matchesChecklistItem,
	uniqueChecklistTokens,
} from "@/lib/scaffolding/checklistMatching";

describe("checklistMatching", () => {
	it("matches exact checklist phrases", () => {
		const result = getMatchedChecklistItems(
			"Build a hero section with a headline, supporting text, and a button label.",
			["Headline", "Supporting text", "Button label"],
		);

		expect(result).toEqual([
			"Headline",
			"Supporting text",
			"Button label",
		]);
	});

	it("matches checklist items by token overlap", () => {
		const promptText =
			"Use a warm casual tone for remote workers and ban journey from the copy.";
		const promptTokens = uniqueChecklistTokens(promptText);

		expect(
			matchesChecklistItem(promptText.toLowerCase(), promptTokens, "Warm tone"),
		).toBe(true);
		expect(
			matchesChecklistItem(
				promptText.toLowerCase(),
				promptTokens,
				"Banned words list",
			),
		).toBe(false);
	});

	it("reports checklist coverage", () => {
		const result = getChecklistMatchResult(
			"Create a navigation bar using Tailwind with three links.",
			["Tech stack", "Navigation links", "Visual style"],
		);

		expect(result.matchedItems).toEqual(["Navigation links"]);
		expect(result.coverage).toBeCloseTo(1 / 3);
	});
});
