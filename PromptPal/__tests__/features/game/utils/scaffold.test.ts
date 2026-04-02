import { describe, expect, it } from "@jest/globals";

import {
	getInitialPromptForLevel,
	getLevelChecklistItems,
	shouldShowChecklist,
} from "@/features/game/utils/scaffold";
import type { Level } from "@/features/game/store";

const baseLevel: Level = {
	id: "code-1-easy",
	difficulty: "beginner",
	passingScore: 70,
	unlocked: true,
};

describe("scaffold utils", () => {
	it("prefills prompt only for template scaffold levels", () => {
		expect(
			getInitialPromptForLevel({
				...baseLevel,
				scaffoldType: "template",
				scaffoldTemplate: "Build a [shape] button",
			}),
		).toBe("Build a [shape] button");

		expect(
			getInitialPromptForLevel({
				...baseLevel,
				scaffoldType: "checklist",
				scaffoldTemplate: "Build a [shape] button",
			}),
		).toBe("");
	});

	it("bridges checklistItems before promptChecklist", () => {
		expect(
			getLevelChecklistItems({
				...baseLevel,
				checklistItems: ["Headline", "Button label"],
				promptChecklist: ["Legacy item"],
			}),
		).toEqual(["Headline", "Button label"]);

		expect(
			getLevelChecklistItems({
				...baseLevel,
				promptChecklist: ["Legacy item"],
			}),
		).toEqual(["Legacy item"]);
	});

	it("shows checklist only for template and checklist modes", () => {
		expect(
			shouldShowChecklist({
				...baseLevel,
				scaffoldType: "template",
				checklistItems: ["Audience"],
			}),
		).toBe(true);
		expect(
			shouldShowChecklist({
				...baseLevel,
				scaffoldType: "checklist",
				checklistItems: ["Audience"],
			}),
		).toBe(true);
		expect(
			shouldShowChecklist({
				...baseLevel,
				scaffoldType: "none",
				checklistItems: ["Audience"],
			}),
		).toBe(false);
	});
});
