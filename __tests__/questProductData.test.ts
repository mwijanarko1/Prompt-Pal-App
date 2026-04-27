declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: any;

import {
	buildDefaultQuestNodes,
	buildLessonDefinitionsFromLegacyLevels,
	DEFAULT_LEARNING_TRACKS,
	DEFAULT_PERK_CATALOG,
	getLevelFromLifetimeXp,
} from "../convex/questProductData";
import { allLevels as levelsData } from "../convex/levels_data";

describe("quest product domain data", () => {
	it("ports legacy levels into normalized quest-first lessons", () => {
		const lessons = buildLessonDefinitionsFromLegacyLevels(levelsData);

		expect(lessons.length).toBeGreaterThan(20);
		expect(lessons.find((lesson: any) => lesson.trackId === "image-generation")).toMatchObject({
			trackId: "image-generation",
			lessonType: "image",
			mode: "teaching",
			nodeOrder: 1,
			heartsCost: 1,
			masteryThreshold: 90,
			isActive: true,
		});
		expect(lessons[0].contentPayload).toEqual(
			expect.objectContaining({
				description: expect.any(String),
				hints: expect.any(Array),
			}),
		);
		expect(lessons[0].evaluationPayload).toEqual(
			expect.objectContaining({
				passingScore: expect.any(Number),
			}),
		);
	});

	it("builds one active quest path per learning track", () => {
		const lessons = buildLessonDefinitionsFromLegacyLevels(levelsData);
		const nodes = buildDefaultQuestNodes(lessons);

		for (const track of DEFAULT_LEARNING_TRACKS) {
			const trackNodes = nodes.filter((node) => node.trackId === track.id);
			expect(trackNodes.length).toBeGreaterThan(0);
			expect(trackNodes[0]).toMatchObject({
				pathOrder: 1,
				isActive: true,
			});
		}
		expect(nodes[0]).toMatchObject({
			lessonTitle: lessons[0].title,
			lessonSubtitle: lessons[0].subtitle,
			difficulty: lessons[0].difficulty,
		});
	});

	it("hides inactive tracks from the public selector without deleting lesson content", () => {
		const activeTracks = DEFAULT_LEARNING_TRACKS.filter((track) => track.isActive);

		expect(activeTracks.map((track) => track.id)).toEqual([
			"coding",
			"copywriting",
		]);
		expect(DEFAULT_LEARNING_TRACKS.some((track) => track.id === "image-generation")).toBe(true);
	});

	it("keeps lifetime XP independent from spendable perk pricing", () => {
		expect(DEFAULT_PERK_CATALOG.map((perk) => perk.slug)).toEqual([
			"streak-freeze",
			"extra-heart",
			"double-xp-30m",
			"skip-token",
		]);
		expect(getLevelFromLifetimeXp(0)).toBe(1);
		expect(getLevelFromLifetimeXp(399)).toBe(2);
		expect(getLevelFromLifetimeXp(400)).toBe(3);
	});
});
