/**
 * NanoAssistant - AI-powered hint system for PromptPal
 *
 * Provides contextual hints based on:
 * - Current user prompt
 * - Module type (image/code/copy)
 * - Level difficulty
 * - Hidden keywords (for image modules)
 *
 * Features:
 * - Hint cooldown to prevent spam
 * - Hint tracking per level (affects scoring)
 */

import { Level, ChallengeType } from "@/features/game/store";
import { convexHttpClient } from "./convex-client";
import { api } from "../../convex/_generated/api.js";
import { logger } from "./logger";

// Constants
const HINT_COOLDOWN_MS = 30000; // 30 seconds between hints

/**
 * Get maximum hints allowed based on difficulty
 * Harder difficulties = fewer hints available
 */
function getMaxHintsForDifficulty(
	difficulty: Level["difficulty"] = "intermediate",
): number {
	switch (difficulty) {
		case "beginner":
			return 5; // Most hints for new players
		case "intermediate":
			return 4; // Moderate hints
		case "advanced":
			return 3; // Fewest hints for experienced players
		default:
			return 4;
	}
}

// In-memory storage for hint counts per level
const hintCountsByLevel: Map<string, number> = new Map();

// Last hint timestamp for cooldown
let lastHintTimestamp = 0;

/**
 * Generate a system prompt for the AI based on module type and difficulty
 */
function buildSystemPrompt(
	moduleType: ChallengeType,
	difficulty: Level["difficulty"],
	levelData: Level,
): string {
	const difficultyContext = {
		beginner: "Give clear, direct hints that guide the user step by step.",
		intermediate:
			"Give moderate hints that point in the right direction without giving away the answer.",
		advanced:
			"Give subtle hints that encourage critical thinking. Be cryptic but helpful.",
	};

	const basePrompt = `You are NanoAssistant, a helpful AI tutor for prompt engineering. 
Your role is to help users improve their prompts without giving away the exact answer.
Difficulty level: ${difficulty}. ${difficultyContext[difficulty]}
Keep hints concise (1-2 sentences max).`;

	switch (moduleType) {
		case "image": {
			const keywordsHint = levelData.hiddenPromptKeywords?.length
				? `The target image contains elements related to: ${levelData.hiddenPromptKeywords.slice(0, 2).join(", ")}... (and more)`
				: "";
			return `${basePrompt}
This is an IMAGE GENERATION challenge. The user needs to write a prompt that generates an image similar to a target.
${keywordsHint}
${levelData.style ? `The desired style is: ${levelData.style}` : ""}
Focus hints on: composition, style, mood, specific elements, or artistic techniques.`;
		}

		case "code":
			return `${basePrompt}
This is a CODE GENERATION challenge. The user needs to write a prompt that instructs an AI to generate code.
${levelData.requirementBrief ? `The requirement: ${levelData.requirementBrief}` : ""}
${levelData.language ? `Target language: ${levelData.language}` : ""}
Focus hints on: clarity of requirements, edge cases, function signatures, or algorithmic approach.`;

		case "copywriting":
			return `${basePrompt}
This is a COPYWRITING challenge. The user needs to write a prompt for marketing/persuasive content.
${levelData.briefProduct ? `Product: ${levelData.briefProduct}` : ""}
${levelData.briefTarget ? `Target audience: ${levelData.briefTarget}` : ""}
${levelData.briefTone ? `Desired tone: ${levelData.briefTone}` : ""}
Focus hints on: audience engagement, tone, call-to-action, or persuasive techniques.`;

		default:
			return basePrompt;
	}
}

/**
 * Build the user message for hint generation
 */
function buildUserMessage(
	currentPrompt: string,
	moduleType: ChallengeType,
): string {
	if (!currentPrompt.trim()) {
		return `I haven't written anything yet. Can you give me a hint on how to start my ${moduleType} prompt?`;
	}

	return `Here's my current prompt attempt:
"${currentPrompt}"

Can you give me a hint on how to improve it? Don't give me the answer directly.`;
}

/**
 * Build all hints for a level (returns exactly 5 unique hints)
 */
function buildAllHints(moduleType: ChallengeType, levelData: Level): string[] {
	const allHints: string[] = [];

	if (moduleType === "image") {
		// General hints (always available)
		allHints.push(
			"Start by describing the main subject - what is the central focus of the image?",
			"Think about the setting first. Where does this scene take place?",
			"Consider the mood you want to create. Is it calm, energetic, mysterious?",
			"Try describing colors, lighting, or atmosphere in more detail.",
			"Add visual details - what textures or materials are visible?",
		);

		// Level-specific hints
		if (levelData.hiddenPromptKeywords?.length) {
			const keywords = levelData.hiddenPromptKeywords;
			if (keywords[0])
				allHints.push(
					`The target image has something related to "${keywords[0]}" - is this in your prompt?`,
				);
			if (keywords[1])
				allHints.push(
					`Consider adding elements related to "${keywords[1]}" to your description.`,
				);
		}

		if (levelData.style) {
			allHints.push(
				`Make sure your prompt captures the "${levelData.style}" style.`,
			);
		}

		allHints.push(
			"Check if you've described the lighting - natural light, sunset, studio lighting?",
			"Try adding camera perspective details - eye level, bird's eye, low angle?",
		);
	} else if (moduleType === "code") {
		allHints.push(
			"Start by stating the main purpose of the code you need.",
			"Define what inputs the code should accept and what outputs it should produce.",
			"Be specific about edge cases the code should handle.",
			"Mention the expected data types for inputs and outputs.",
			"Specify if you need error handling or validation.",
		);

		if (levelData.requirementBrief) {
			allHints.push(
				`Re-read the requirement: "${levelData.requirementBrief.slice(0, 50)}..." - are all parts addressed?`,
			);
		}
		if (levelData.language) {
			allHints.push(
				`Remember to use ${levelData.language}-specific conventions and best practices.`,
			);
		}

		allHints.push(
			"Have you specified the exact function name or method signature needed?",
			"Consider mentioning what libraries or imports might be used.",
			"Specify the expected behavior for invalid inputs.",
		);
	} else if (moduleType === "copywriting") {
		allHints.push(
			"Start by identifying the key benefit for the target audience.",
			"Think about what emotion you want to evoke in the reader.",
			"Include what action you want readers to take (the CTA).",
			"Consider the tone - professional, casual, urgent, friendly?",
			"Think about social proof - testimonials, numbers, credibility.",
		);

		if (levelData.briefProduct) {
			allHints.push(
				`Make sure your prompt highlights key features of "${levelData.briefProduct}".`,
			);
		}
		if (levelData.briefTarget) {
			allHints.push(
				`Remember your audience is: ${levelData.briefTarget}. Speak to their needs.`,
			);
		}
		if (levelData.briefTone) {
			allHints.push(
				`The tone should be "${levelData.briefTone}" - is your prompt reflecting that?`,
			);
		}

		allHints.push(
			"Consider adding urgency or scarcity elements.",
			"Make sure there's a clear value proposition.",
		);
	} else {
		// Generic fallback
		allHints.push(
			"Be more specific about the details you want in the output.",
			"Consider what makes your target unique and distinctive.",
			"Add context about the style, tone, or format you need.",
			"Think about breaking down your request into clearer parts.",
			"Specify any constraints or requirements that must be met.",
		);
	}

	// Return exactly 5 hints (or all if less than 5)
	return allHints.slice(0, Math.max(5, allHints.length));
}

/**
 * Generate fallback hints when AI is unavailable
 * Returns the Nth hint for this level (based on how many hints have been used)
 */
function getFallbackHint(
	currentPrompt: string,
	moduleType: ChallengeType,
	levelData: Level,
): string {
	const levelId = levelData.id;
	const hintNumber = hintCountsByLevel.get(levelId) || 1; // 1-indexed (already incremented)

	// Build all hints for this level
	const allHints = buildAllHints(moduleType, levelData);

	// Return the hint at the current position (0-indexed, so hintNumber - 1)
	const hintIndex = Math.min(hintNumber - 1, allHints.length - 1);
	return allHints[hintIndex];
}

/**
 * NanoAssistant class - Main interface for the hint system
 */
export class NanoAssistant {
	/**
	 * Get a contextual hint based on the current prompt and level
	 *
	 * @param currentPrompt - The user's current prompt text
	 * @param moduleType - The type of challenge (image/code/copy)
	 * @param levelData - The level configuration
	 * @returns A helpful hint string
	 * @throws Error if rate limited or on cooldown
	 */
	static async getHint(
		currentPrompt: string,
		moduleType: ChallengeType,
		levelData: Level,
	): Promise<string> {
		const levelId = levelData.id;
		const currentCount = hintCountsByLevel.get(levelId) || 0;
		const maxHints = getMaxHintsForDifficulty(levelData.difficulty);

		if (currentCount >= maxHints) {
			throw new Error(
				`You've used all ${maxHints} hints for this level. Try your best with what you have!`,
			);
		}

		// Check cooldown
		const now = Date.now();
		const timeSinceLastHint = now - lastHintTimestamp;

		if (timeSinceLastHint < HINT_COOLDOWN_MS) {
			const remainingSeconds = Math.ceil(
				(HINT_COOLDOWN_MS - timeSinceLastHint) / 1000,
			);
			throw new Error(
				`Please wait ${remainingSeconds} seconds before requesting another hint.`,
			);
		}

		// Client-side rate limiting removed - implemented on server

		lastHintTimestamp = now;
		hintCountsByLevel.set(levelId, currentCount + 1);

		logger.info("NanoAssistant", "Generating hint", {
			levelId,
			moduleType,
			promptLength: currentPrompt.length,
			hintsUsed: currentCount + 1,
		});

		try {
			// Build prompts for AI
			const systemPrompt = buildSystemPrompt(
				moduleType,
				levelData.difficulty,
				levelData,
			);
			const userMessage = buildUserMessage(currentPrompt, moduleType);

			// Try to get AI-generated hint using Convex
			const response = await convexHttpClient.action(api.ai.generateText, {
				prompt: userMessage,
				context: systemPrompt,
				appId: "prompt-pal",
			});

			if (response.result) {
				return response.result;
			}

			// Fallback if AI returns empty
			return getFallbackHint(currentPrompt, moduleType, levelData);
		} catch (error) {
			logger.warn(
				"NanoAssistant",
				"AI hint generation failed, using fallback",
				{ error },
			);

			return getFallbackHint(currentPrompt, moduleType, levelData);
		}
	}

	/**
	 * Get the number of hints used for a specific level
	 *
	 * @param levelId - The level ID to check
	 * @returns Number of hints used
	 */
	static getHintsUsed(levelId: string): number {
		return hintCountsByLevel.get(levelId) || 0;
	}

	/**
	 * Reset hint count for a level (call when restarting a level)
	 *
	 * @param levelId - The level ID to reset
	 */
	static resetHintsForLevel(levelId: string): void {
		hintCountsByLevel.delete(levelId);
	}

	/**
	 * Reset all hint counts (call when resetting game progress)
	 */
	static resetAllHints(): void {
		hintCountsByLevel.clear();
		lastHintTimestamp = 0;
		logger.debug("NanoAssistant", "Reset all hints");
	}

	/**
	 * Get cooldown status
	 *
	 * @returns Object with cooldown info
	 */
	static getCooldownStatus(): { isOnCooldown: boolean; remainingMs: number } {
		const now = Date.now();
		const timeSinceLastHint = now - lastHintTimestamp;
		const isOnCooldown = timeSinceLastHint < HINT_COOLDOWN_MS;
		const remainingMs = isOnCooldown ? HINT_COOLDOWN_MS - timeSinceLastHint : 0;

		return { isOnCooldown, remainingMs };
	}

	/**
	 * Get maximum hints allowed per level based on difficulty
	 *
	 * @param difficulty - Level difficulty (beginner: 5, intermediate: 4, advanced: 3)
	 */
	static getMaxHintsPerLevel(
		difficulty: Level["difficulty"] = "intermediate",
	): number {
		return getMaxHintsForDifficulty(difficulty);
	}

	/**
	 * Check if more hints are available for a level
	 *
	 * @param levelId - The level ID to check
	 * @param difficulty - Level difficulty
	 * @returns True if hints are still available
	 */
	static hasHintsRemaining(
		levelId: string,
		difficulty: Level["difficulty"] = "intermediate",
	): boolean {
		const used = hintCountsByLevel.get(levelId) || 0;
		const maxHints = getMaxHintsForDifficulty(difficulty);
		return used < maxHints;
	}

	/**
	 * Get remaining hints for a level
	 *
	 * @param levelId - The level ID to check
	 * @param difficulty - Level difficulty
	 * @returns Number of hints remaining
	 */
	static getHintsRemaining(
		levelId: string,
		difficulty: Level["difficulty"] = "intermediate",
	): number {
		const used = hintCountsByLevel.get(levelId) || 0;
		const maxHints = getMaxHintsForDifficulty(difficulty);
		return Math.max(0, maxHints - used);
	}
}

export default NanoAssistant;
