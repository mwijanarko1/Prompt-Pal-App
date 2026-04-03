import { describe, expect, it } from "@jest/globals";

import {
	composePromptFromScaffoldSlots,
	emptyComposedBeginnerTemplatePrompt,
	getInitialPromptForLevel,
	getInitialPromptStateForLevel,
	getLevelChecklistItems,
	isBeginnerTemplateLocked,
	parseScaffoldPlaceholders,
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

	it("parses bracket placeholders into segments and hint labels", () => {
		const { segments, hints } = parseScaffoldPlaceholders(
			"Create a [main colour] image with [style]",
		);
		expect(segments).toEqual(["Create a ", " image with ", ""]);
		expect(hints).toEqual(["main colour", "style"]);
	});

	it("composes prompt from slot values", () => {
		const { segments } = parseScaffoldPlaceholders("Build a [shape] button");
		expect(composePromptFromScaffoldSlots(segments, ["round"])).toBe(
			"Build a round button",
		);
	});

	it("empty composed beginner template omits bracket text", () => {
		expect(
			emptyComposedBeginnerTemplatePrompt("Build a [shape] button"),
		).toBe("Build a  button");
	});

	it("detects beginner locked template when placeholders exist", () => {
		expect(
			isBeginnerTemplateLocked({
				...baseLevel,
				scaffoldType: "template",
				scaffoldTemplate: "One [slot]",
			}),
		).toBe(true);
		expect(
			isBeginnerTemplateLocked({
				...baseLevel,
				difficulty: "intermediate",
				scaffoldType: "template",
				scaffoldTemplate: "One [slot]",
			}),
		).toBe(false);
	});

	it("getInitialPromptStateForLevel uses empty slots for beginner template", () => {
		expect(
			getInitialPromptStateForLevel({
				...baseLevel,
				scaffoldType: "template",
				scaffoldTemplate: "Hello [name]",
			}),
		).toBe("Hello ");
	});
});
