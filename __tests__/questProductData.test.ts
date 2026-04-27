declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: any;

import {
	buildDefaultQuestNodes,
	buildFeaturedCourseOverview,
	buildHomeHeaderStats,
	buildLessonDefinitionsFromLegacyLevels,
	buildProfileOverviewAchievements,
	buildProfileOverviewUsageQuota,
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

	it("uses the active timeline node as the featured course level", () => {
		const featuredCourse = buildFeaturedCourseOverview({
			statsLevel: 12,
			activeTrackTitle: "Coding",
			activeLessonTitle: "Master component prompts",
			activeNodePathOrder: 4,
			completedNodeCount: 3,
			totalNodeCount: 10,
		});

		expect(featuredCourse).toMatchObject({
			level: 4,
			track: "Coding Track",
			title: "Master component prompts",
			progress: 30,
		});
	});

	it("maps home header XP from the same lifetime XP shown on profile", () => {
		const headerStats = buildHomeHeaderStats({
			currentStreak: 7,
			lifetimeXp: 1250,
			walletXp: 25,
			hearts: 5,
		});

		expect(headerStats).toEqual({
			currentStreak: 7,
			totalXp: 1250,
			hearts: 5,
		});
	});

	it("shapes profile achievements and usage quota from persisted records", () => {
		const achievements = buildProfileOverviewAchievements([
			{
				achievementId: "streak-3",
				unlockedAt: 1700000000000,
				achievement: {
					id: "streak-3",
					title: "Three-Day Streak",
					description: "Complete quests three days in a row.",
					icon: "flame",
					rarity: "common",
				},
			},
			{
				achievementId: "missing",
				unlockedAt: 1700000000001,
				achievement: null,
			},
		]);
		const quota = buildProfileOverviewUsageQuota({
			tier: "free",
			used: { textCalls: 15, imageCalls: 2, audioSummaries: 0 },
			limits: { textCalls: 50, imageCalls: 10, audioSummaries: 0 },
			periodStart: 1700000000000,
			periodEnd: 1702592000000,
		});

		expect(achievements).toEqual([
			{
				id: "streak-3",
				title: "Three-Day Streak",
				description: "Complete quests three days in a row.",
				icon: "flame",
				rarity: "common",
				unlockedAt: 1700000000000,
			},
		]);
		expect(quota).toEqual({
			tier: "free",
			textCalls: { used: 15, limit: 50, remaining: 35, percent: 30 },
			imageCalls: { used: 2, limit: 10, remaining: 8, percent: 20 },
			periodStart: 1700000000000,
			periodEnd: 1702592000000,
		});
	});
});
