import { Level } from "../game/store";
import { convexHttpClient } from "../../lib/convex-client";
import { api } from "../../../convex/_generated/api.js";

// Note: Target images are now stored in Convex and URLs are provided by the backend API
// Local assets are only used for UI display

// Pre-import local level images mapped by API level ID for instant loading
// Map API level IDs (e.g., "image-1-easy") to local assets
const LEVEL_IMAGE_ASSETS = {
	// Beginner levels
	"image-1-easy": require("../../../assets/images/level-1-image.png"),
	"image-2-easy": require("../../../assets/images/level-2-image.png"),
	"image-3-easy": require("../../../assets/images/level-3-image.png"),

	// Intermediate levels
	"image-4-medium": require("../../../assets/images/level-4-image.png"),
	"image-5-medium": require("../../../assets/images/level-5-image.png"),
	"image-6-medium": require("../../../assets/images/level-6-image.png"),
	"image-7-medium": require("../../../assets/images/level-7-image.png"),

	// Advanced levels
	"image-8-hard": require("../../../assets/images/level-8-image.png"),
	"image-9-hard": require("../../../assets/images/level-9-image.png"),
	"image-10-hard": require("../../../assets/images/level-10-image.png"),

	// Coding Logic levels (code-1-easy through code-15-hard use fallback)
	"code-1-easy": require("../../../assets/images/level-4-image.png"),
	"code-2-easy": require("../../../assets/images/level-5-image.png"),
	"code-3-easy": require("../../../assets/images/level-6-image.png"),

	// Copywriting levels (copywriting-1-easy through copywriting-15-hard)
	"copywriting-1-easy": require("../../../assets/images/level-7-image.png"),
	"copywriting-2-easy": require("../../../assets/images/level-8-image.png"),
	"copywriting-3-easy": require("../../../assets/images/level-9-image.png"),
	"copywriting-4-medium": require("../../../assets/images/level-7-image.png"),
	"copywriting-5-medium": require("../../../assets/images/level-8-image.png"),
	"copywriting-6-medium": require("../../../assets/images/level-9-image.png"),
	"copywriting-7-medium": require("../../../assets/images/level-7-image.png"),
	"copywriting-8-hard": require("../../../assets/images/level-8-image.png"),
	"copywriting-9-hard": require("../../../assets/images/level-9-image.png"),
	"copywriting-10-hard": require("../../../assets/images/level-7-image.png"),
	"copywriting-11-hard": require("../../../assets/images/level-8-image.png"),
	"copywriting-12-hard": require("../../../assets/images/level-9-image.png"),
	"copywriting-13-hard": require("../../../assets/images/level-7-image.png"),
	"copywriting-14-hard": require("../../../assets/images/level-8-image.png"),
	"copywriting-15-hard": require("../../../assets/images/level-9-image.png"),

	// Alternative ID formats for backward compatibility
	"level-1": require("../../../assets/images/level-1-image.png"),
	"level-2": require("../../../assets/images/level-2-image.png"),
	"level-3": require("../../../assets/images/level-3-image.png"),
	"level-4": require("../../../assets/images/level-4-image.png"),
	"level-5": require("../../../assets/images/level-5-image.png"),
	"level-6": require("../../../assets/images/level-6-image.png"),
	"level-7": require("../../../assets/images/level-7-image.png"),
	"level-8": require("../../../assets/images/level-8-image.png"),
	"level-9": require("../../../assets/images/level-9-image.png"),
	"level-10": require("../../../assets/images/level-10-image.png"),
} as const;

// Note: getHostedImageUrlForLevel removed - backend now provides URLs directly

// Helper function to get local image asset for a level ID
function getLocalImageForLevel(levelId: string): any {
	const image = LEVEL_IMAGE_ASSETS[levelId as keyof typeof LEVEL_IMAGE_ASSETS];
	if (!image) {
		console.warn(
			`[Levels] No local image asset found for level ${levelId}, using fallback`,
		);
		return Object.values(LEVEL_IMAGE_ASSETS)[0] || null;
	}
	return image;
}

const APP_ID = "prompt-pal";

/** Daily quest pool levels use ids `quest_*`; exclude from main module curriculum UIs */
export function isDailyQuestLevelId(levelId: string): boolean {
	return levelId.startsWith("quest_");
}

const MODULE_ID_BY_TYPE: Record<string, string> = {
	image: "image-generation",
	code: "coding-logic",
	copywriting: "copywriting",
};

const getScaffoldTypeForDifficulty = (
	difficulty?: Level["difficulty"],
): Level["scaffoldType"] => {
	switch (difficulty) {
		case "beginner":
			return "template";
		case "intermediate":
			return "checklist";
		case "advanced":
		default:
			return "none";
	}
};

const LEVEL_SCAFFOLD_FALLBACKS: Record<
	string,
	{
		scaffoldTemplate?: string;
		checklistItems?: string[];
	}
> = {
	"image-1-easy": {
		scaffoldTemplate:
			"Create a [main colour] image with a [shade or lighting] look and a [background detail] finish",
		checklistItems: ["Main colour", "Shade or lighting", "Background detail"],
	},
	"image-2-easy": {
		scaffoldTemplate:
			"Create a [shape] on a [background] with [edge or texture detail] in a [style] style",
		checklistItems: ["Shape", "Background", "Edge or texture detail", "Style"],
	},
	"image-3-easy": {
		scaffoldTemplate:
			"Create a [object] with [material detail] on a [surface or setting] using [lighting style]",
		checklistItems: [
			"Object",
			"Material detail",
			"Surface or setting",
			"Lighting style",
		],
	},
	"image-4-medium": {
		checklistItems: ["Building form", "Materials", "Perspective", "Lighting"],
	},
	"image-5-medium": {
		checklistItems: [
			"Time of day",
			"Foreground and background",
			"Atmosphere",
			"Landscape elements",
		],
	},
	"image-6-medium": {
		checklistItems: ["Food subject", "Presentation details", "Texture", "Lighting"],
	},
	"image-7-medium": {
		checklistItems: [
			"Color palette",
			"Style reference",
			"Energy or mood",
			"Abstract shapes",
		],
	},
	"code-1-easy": {
		scaffoldTemplate:
			"Build a hero section with a [headline], [supporting text], and a [button label]",
		checklistItems: ["Headline", "Supporting text", "Button label"],
	},
	"code-2-easy": {
		scaffoldTemplate:
			"Build a navigation bar using [tech stack] with [number] links and a [style direction] look",
		checklistItems: ["Tech stack", "Navigation links", "Visual style"],
	},
	"code-3-easy": {
		scaffoldTemplate:
			"Add a contact form below the heading with [fields] and a [submit button], and leave the [existing element] unchanged",
		checklistItems: [
			"Requested fields",
			"Submit button",
			"Leave existing heading unchanged",
		],
	},
	"code-4-easy": {
		scaffoldTemplate:
			"When the Sign Up button is clicked, show a [user outcome] with [key detail] and keep the experience [tone]",
		checklistItems: ["User outcome", "Key UI detail", "Experience tone"],
	},
	"code-5-easy": {
		scaffoldTemplate:
			"Change the header [element] to [new style] and do not modify the [protected areas]",
		checklistItems: ["Target element", "New style", "Protected areas"],
	},
	"code-6-medium": {
		checklistItems: ["Bug description", "Where it happens", "Expected behavior"],
	},
	"code-7-medium": {
		checklistItems: ["Ask AI to plan first", "No code yet", "Outline the approach"],
	},
	"code-8-medium": {
		checklistItems: ["Empty state", "Error state", "Desired user experience"],
	},
	"code-9-medium": {
		checklistItems: ["Spacing change", "Typography change", "Visual direction"],
	},
	"code-10-medium": {
		checklistItems: [
			"Use non-technical language",
			"Describe the experience",
			"Name the main interaction",
		],
	},
	"copywriting-1-easy": {
		scaffoldTemplate:
			"Write a one-sentence tagline for [brand] aimed at [audience] with a [tone] voice",
		checklistItems: ["Brand", "Audience", "Tone"],
	},
	"copywriting-2-easy": {
		scaffoldTemplate:
			"Write 3 Instagram captions for [brand] that sound [voice direction] and never say [banned element]",
		checklistItems: ["Brand voice", "Audience", "What the brand never says"],
	},
	"copywriting-3-easy": {
		scaffoldTemplate:
			"Write a product description for [product] that highlights [specific detail] and bans [word list]",
		checklistItems: ["Product detail", "Banned words list", "Target audience"],
	},
	"copywriting-4-medium": {
		checklistItems: ["Reader", "Register", "Desired feeling"],
	},
	"copywriting-5-medium": {
		checklistItems: ["Author perspective", "Specific opinion", "Audience"],
	},
	"copywriting-6-medium": {
		checklistItems: ["Name the PAS framework", "Problem", "Agitation", "Solution"],
	},
	"copywriting-7-medium": {
		checklistItems: [
			"Sentence length variation",
			"Short punchy lines",
			"Where rhythm should land",
		],
	},
};

function enrichLevelScaffolding(level: Level): Level {
	const fallback = LEVEL_SCAFFOLD_FALLBACKS[level.id];
	const checklistItems =
		level.checklistItems ?? level.promptChecklist ?? fallback?.checklistItems;
	const scaffoldType =
		level.scaffoldType ?? getScaffoldTypeForDifficulty(level.difficulty);
	const scaffoldTemplate =
		level.scaffoldTemplate ??
		(scaffoldType === "template" ? fallback?.scaffoldTemplate : undefined);

	return {
		...level,
		scaffoldType,
		scaffoldTemplate,
		checklistItems,
		promptChecklist: level.promptChecklist ?? checklistItems,
	};
}

// Process API levels to use local assets for images
export function processApiLevelsWithLocalAssets(apiLevels: Level[]): Level[] {
	return apiLevels.map((rawLevel) => {
		const level = enrichLevelScaffolding(rawLevel);

		return {
			...level,
			moduleId:
				level.moduleId ??
				(level.type ? MODULE_ID_BY_TYPE[level.type] : undefined),
			// Only get local image for image-based levels
			targetImageUrl:
				level.type === "image"
					? getLocalImageForLevel(level.id)
					: level.targetImageUrl,
		};
	});
}

export async function fetchLevelsFromApi(): Promise<Level[]> {
	try {
		const levels = await convexHttpClient.query(api.queries.getLevels, {
			appId: APP_ID,
		});

		// Process levels to add local assets if needed (or if API returns full URLs, updated logic might be needed)
		// For now, mapping IDs to local assets for consistency as per existing logic
		if (levels && levels.length > 0) {
			return processApiLevelsWithLocalAssets(levels as Level[]);
		}

		// If no levels from API, return empty array (no fallback data)
		return [];
	} catch (error) {
		console.warn("[Levels] Failed to fetch from API:", error);
		return [];
	}
}

export async function fetchLevelById(id: string): Promise<Level | undefined> {
	try {
		const level = await convexHttpClient.query(api.queries.getLevelById, {
			id,
		});

		if (level) {
			// Convert/process if needed, or return directly.
			// Existing logic used taskToLevel. Here we assume Level.
			// We still want local image assets for consistent UI if they use local images.
			const levels = processApiLevelsWithLocalAssets([level as Level]);
			return levels[0];
		}
		return undefined;
	} catch (error) {
		console.warn("[Levels] Failed to fetch level from API:", error);
		return undefined;
	}
}

/**
 * Checks if a level is unlocked based on its prerequisites
 * @param level - The level to check
 * @param completedLevels - Array of completed level IDs
 * @returns Whether the level is unlocked
 */
export function isLevelUnlocked(
	level: Level,
	completedLevels: string[] = [],
): boolean {
	if (!level.prerequisites || level.prerequisites.length === 0) {
		return level.unlocked;
	}

	const allPrerequisitesMet = level.prerequisites.every((prereqId) =>
		completedLevels.includes(prereqId),
	);

	return level.unlocked && allPrerequisitesMet;
}
