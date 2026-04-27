import {
	calculateTokenCoverage,
	getMatchedChecklistItems,
	uniqueChecklistTokens,
} from "@/lib/scaffolding/checklistMatching";

export interface PromptQualityAssessment {
	score: number;
	parrotPenalty: number;
	checklistCoverage: number;
	strategicSignalCoverage: number;
	feedback: string[];
}

interface PromptQualityInput {
	userPrompt: string;
	publicReferences: Array<string | undefined>;
	checklist?: string[];
	strategicSignals: string[];
	domain: "code" | "copy" | "image";
}

function clamp(value: number, min = 0, max = 100): number {
	return Math.min(max, Math.max(min, value));
}

function assessPromptQuality({
	userPrompt,
	publicReferences,
	checklist,
	strategicSignals,
	domain,
}: PromptQualityInput): PromptQualityAssessment {
	const promptText = userPrompt.trim().toLowerCase();
	const promptTokens = uniqueChecklistTokens(promptText);
	const referenceTokens = uniqueChecklistTokens(
		publicReferences.filter(Boolean).join(" "),
	);

	const overlap = calculateTokenCoverage(promptTokens, referenceTokens);
	const checklistItems = checklist?.filter(Boolean) ?? [];
	const matchedChecklist = getMatchedChecklistItems(promptText, checklistItems);
	const matchedSignals = getMatchedChecklistItems(promptText, strategicSignals);

	const promptLengthBonus = clamp((promptTokens.size - 8) * 3, 0, 15);
	const checklistCoverage =
		checklistItems.length > 0
			? Math.round((matchedChecklist.length / checklistItems.length) * 100)
			: 60;
	const strategicSignalCoverage =
		strategicSignals.length > 0
			? Math.round((matchedSignals.length / strategicSignals.length) * 100)
			: 60;

	const parrotPenalty =
		overlap >= 0.78 && promptTokens.size <= referenceTokens.size * 1.35
			? 35
			: overlap >= 0.6
				? 15
				: 0;

	const score = clamp(
		38 +
			checklistCoverage * 0.32 +
			strategicSignalCoverage * 0.2 +
			promptLengthBonus -
			parrotPenalty,
	);

	const feedback: string[] = [];

	if (promptTokens.size < 8) {
		feedback.push(
			domain === "code"
				? "Your prompt is too thin. Add concrete instructions, constraints, and edge cases."
				: domain === "copy"
					? "Your prompt is too thin. Add audience, tone, and structure guidance."
					: "Your prompt is too thin. Add subject, composition, lighting, and style guidance.",
		);
	}

	if (parrotPenalty > 0) {
		feedback.push(
			domain === "code"
				? "Your prompt mostly repeats the on-screen brief. Add implementation constraints and failure cases."
				: domain === "copy"
					? "Your prompt mostly repeats the brief. Add messaging strategy, structure, and persuasion guidance."
					: "Your prompt mostly repeats the brief. Add composition, camera, lighting, and material details.",
		);
	}

	if (checklistCoverage < 55) {
		feedback.push(
			domain === "code"
				? "Ask for more of the success criteria explicitly instead of relying on the model to infer them."
				: domain === "copy"
					? "Be more explicit about the messaging requirements you want the model to satisfy."
					: "Be more explicit about the visual requirements you want the model to satisfy.",
		);
	}

	if (strategicSignalCoverage < 45) {
		feedback.push(
			domain === "code"
				? "Mention output format, constraints, and how to handle tricky inputs."
				: domain === "copy"
					? "Mention audience, tone, CTA, and how the copy should be structured."
					: "Mention subject placement, lighting, perspective, background, and visual style.",
		);
	}

	return {
		score,
		parrotPenalty,
		checklistCoverage,
		strategicSignalCoverage,
		feedback,
	};
}

export function assessCodePromptQuality(input: {
	userPrompt: string;
	publicReferences: Array<string | undefined>;
	checklist?: string[];
}): PromptQualityAssessment {
	return assessPromptQuality({
		...input,
		domain: "code",
		strategicSignals: [
			"edge case",
			"handle empty",
			"return",
			"javascript",
			"function",
			"valid",
			"no imports",
			"example",
		],
	});
}

export function assessCopyPromptQuality(input: {
	userPrompt: string;
	publicReferences: Array<string | undefined>;
	checklist?: string[];
}): PromptQualityAssessment {
	return assessPromptQuality({
		...input,
		domain: "copy",
		strategicSignals: [
			"audience",
			"tone",
			"benefit",
			"call to action",
			"cta",
			"headline",
			"structure",
			"objection",
			"variant",
			"persona",
		],
	});
}

export function assessImagePromptQuality(input: {
	userPrompt: string;
	publicReferences: Array<string | undefined>;
	checklist?: string[];
}): PromptQualityAssessment {
	return assessPromptQuality({
		...input,
		domain: "image",
		strategicSignals: [
			"subject",
			"composition",
			"lighting",
			"background",
			"foreground",
			"camera",
			"angle",
			"style",
			"texture",
			"color palette",
		],
	});
}
