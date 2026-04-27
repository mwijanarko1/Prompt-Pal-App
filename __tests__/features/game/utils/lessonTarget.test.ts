import { describe, expect, it } from "@jest/globals";

import {
	getCodingLessonTargetHtml,
	getLessonTargetBrief,
	hasMeaningfulHtmlPreview,
} from "@/features/game/utils/lessonTarget";
import type { Level } from "@/features/game/store";

const baseLevel: Level = {
	id: "code-1-easy",
	type: "code",
	title: "Describe the outcome",
	difficulty: "beginner",
	passingScore: 70,
	unlocked: true,
};

describe("lesson target helpers", () => {
	it("uses the visible lesson state as the primary target brief", () => {
		expect(
			getLessonTargetBrief({
				...baseLevel,
				whatUserSees: "A blank webpage with no hero section.",
				instruction: "Craft a prompt for a hero section.",
			}),
		).toEqual({
			primary: "A blank webpage with no hero section.",
			secondary: "Craft a prompt for a hero section.",
		});
	});

	it("falls back to description when the lesson has no explicit target text", () => {
		expect(
			getLessonTargetBrief({
				...baseLevel,
				description: "Write a prompt that adds a nav bar.",
			}),
		).toEqual({
			primary: "Write a prompt that adds a nav bar.",
			secondary: undefined,
		});
	});

	it("does not treat an empty HTML shell as a meaningful preview", () => {
		expect(hasMeaningfulHtmlPreview("<html><body></body></html>")).toBe(false);
		expect(
			hasMeaningfulHtmlPreview("<html><body><h1>Contact Us</h1></body></html>"),
		).toBe(true);
	});

	it("builds the exact coding target component for the beginner hero lesson", () => {
		const html = getCodingLessonTargetHtml({
			...baseLevel,
			id: "code-1-easy",
		});

		expect(html).toContain("<section");
		expect(html).toContain("Build Better Prompts");
		expect(html).toContain("Start Building");
		expect(html).not.toContain("What You See");
	});

	it("has a reference target for every coding lesson id", () => {
		const ids = [
			"code-1-easy",
			"code-2-easy",
			"code-3-easy",
			"code-4-easy",
			"code-5-easy",
			"code-6-medium",
			"code-7-medium",
			"code-8-medium",
			"code-9-medium",
			"code-10-medium",
			"code-11-hard",
			"code-12-hard",
			"code-13-hard",
			"code-14-hard",
			"code-15-hard",
		];

		for (const id of ids) {
			expect(getCodingLessonTargetHtml({ ...baseLevel, id })).toContain("<html>");
		}
	});
});
