export interface CopyBriefContext {
	briefProduct?: string;
	briefTarget?: string;
	briefTone?: string;
	briefGoal?: string;
}

export interface CopyMetric {
	label: string;
	value: number;
}

export interface CopyElementChecks {
	present: string[];
	missing: string[];
	score: number;
}

export const DEFAULT_COPY_WORD_LIMIT = { min: 20, max: 300 };

export const COPY_METRIC_LABELS = [
	"TONE",
	"PERSUASION",
	"CLARITY",
	"AUDIENCE FIT",
	"CREATIVITY",
	"ENGAGEMENT",
] as const;

export function buildCopyAnalysisPrompt(
	text: string,
	brief: CopyBriefContext,
): string {
	const briefParts = [];
	if (brief.briefProduct) briefParts.push(`Product: ${brief.briefProduct}`);
	if (brief.briefTarget)
		briefParts.push(`Target Audience: ${brief.briefTarget}`);
	if (brief.briefTone) briefParts.push(`Desired Tone: ${brief.briefTone}`);
	if (brief.briefGoal) briefParts.push(`Goal: ${brief.briefGoal}`);

	return `
Analyze the following copy and provide scores (0-100) for these metrics:
- TONE: How well the tone matches the desired tone
- PERSUASION: How persuasive and compelling the copy is
- CLARITY: How clear and understandable the message is
- AUDIENCE FIT: How well it resonates with the target audience
- CREATIVITY: Originality and creative approach
- ENGAGEMENT: How likely it is to engage readers

${briefParts.length > 0 ? `Brief:\n${briefParts.join("\n")}\n` : ""}

Copy to analyze:
${text}

Provide scores in JSON format:
{
  "TONE": <score>,
  "PERSUASION": <score>,
  "CLARITY": <score>,
  "AUDIENCE FIT": <score>,
  "CREATIVITY": <score>,
  "ENGAGEMENT": <score>
}
`.trim();
}

export function parseCopyMetrics(
	resultText: string,
	fallbackText: string,
	brief: CopyBriefContext,
): CopyMetric[] {
	try {
		let jsonText = resultText;
		const backtickMatch = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (backtickMatch?.[1]) {
			jsonText = backtickMatch[1];
		} else {
			const braceMatch = resultText.match(/\{[\s\S]*\}/);
			if (braceMatch?.[0]) {
				jsonText = braceMatch[0];
			}
		}

		const parsed = JSON.parse(jsonText.trim()) as Record<string, number>;
		return COPY_METRIC_LABELS.map((label) => ({
			label,
			value: clamp(
				Number(
					parsed[label.replace(/ /g, "_").toUpperCase()] ?? parsed[label] ?? 50,
				),
			),
		}));
	} catch {
		return calculateFallbackMetrics(fallbackText, brief);
	}
}

export function calculateFallbackMetrics(
	text: string,
	brief: CopyBriefContext,
): CopyMetric[] {
	const scores: Record<string, number> = {};

	scores.TONE = brief.briefTone
		? calculateToneScore(text, brief.briefTone)
		: 60;
	scores.PERSUASION = calculatePersuasionScore(text);
	scores.CLARITY = calculateClarityScore(text);
	scores["AUDIENCE FIT"] = brief.briefTarget
		? calculateAudienceScore(text, brief.briefTarget)
		: 60;
	scores.CREATIVITY = calculateCreativityScore(text);
	scores.ENGAGEMENT = calculateEngagementScore(text);

	return COPY_METRIC_LABELS.map((label) => ({
		label,
		value: clamp(scores[label] || 50),
	}));
}

export function checkRequiredElements(
	text: string,
	requiredElements?: string[],
): CopyElementChecks {
	if (!requiredElements || requiredElements.length === 0) {
		return { present: [], missing: [], score: 100 };
	}

	const textLower = text.toLowerCase();
	const present: string[] = [];
	const missing: string[] = [];

	requiredElements.forEach((element) => {
		if (textLower.includes(element.toLowerCase())) {
			present.push(element);
		} else {
			missing.push(element);
		}
	});

	return {
		present,
		missing,
		score: Math.round((present.length / requiredElements.length) * 100),
	};
}

export function countWords(text: string): number {
	return text
		.trim()
		.split(/\s+/)
		.filter((word) => word.length > 0).length;
}

export function isWithinWordLimit(
	wordCount: number,
	limits: { min?: number; max?: number },
): boolean {
	if (limits.min && wordCount < limits.min) return false;
	if (limits.max && wordCount > limits.max) return false;
	return true;
}

export function calculateCopyOverallScore(
	metrics: CopyMetric[],
	elementChecks: CopyElementChecks,
	withinLimit: boolean,
	promptQualityScore = 100,
): number {
	const avgMetricScore =
		metrics.reduce((sum, metric) => sum + metric.value, 0) /
		Math.max(metrics.length, 1);
	const wordLimitScore = withinLimit ? 100 : 70;

	return Math.round(
		avgMetricScore * 0.55 +
			elementChecks.score * 0.15 +
			wordLimitScore * 0.05 +
			promptQualityScore * 0.25,
	);
}

export function generateCopyFeedback(input: {
	metrics: CopyMetric[];
	elementChecks: CopyElementChecks;
	wordCount: number;
	limits: { min?: number; max?: number };
	overallScore: number;
	passingScore?: number;
	promptFeedback?: string[];
}): string[] {
	const {
		metrics,
		elementChecks,
		wordCount,
		limits,
		overallScore,
		passingScore,
		promptFeedback = [],
	} = input;
	const feedback = [...promptFeedback];

	if (passingScore && overallScore >= passingScore) {
		feedback.unshift(
			"Strong result. Your prompt produced convincing copy that met the brief.",
		);
		return dedupeFeedback(feedback);
	}

	const lowMetrics = metrics.filter((metric) => metric.value < 60);
	if (lowMetrics.length > 0) {
		feedback.push(
			`Focus on improving ${lowMetrics.map((metric) => metric.label.toLowerCase()).join(", ")}.`,
		);
	}

	if (limits.min && wordCount < limits.min) {
		feedback.push(
			"Ask for a slightly fuller draft so the model has room to develop the message.",
		);
	} else if (limits.max && wordCount > limits.max) {
		feedback.push(
			"Add brevity guidance so the model stays tighter and more focused.",
		);
	}

	if (elementChecks.missing.length > 0) {
		feedback.push(
			"Ask for more concrete benefits, differentiators, or CTA language.",
		);
	}

	const highMetrics = metrics.filter((metric) => metric.value >= 80);
	if (highMetrics.length > 0) {
		feedback.push(
			`Strong ${highMetrics.map((metric) => metric.label.toLowerCase()).join(" and ")}.`,
		);
	}

	if (overallScore < 40) {
		feedback.push(
			"Major revision needed. Push the model with clearer strategic direction.",
		);
	} else if (overallScore < 70) {
		feedback.push(
			"Good foundation. Add sharper constraints and a stronger conversion goal.",
		);
	}

	return dedupeFeedback(feedback);
}

function dedupeFeedback(items: string[]): string[] {
	return Array.from(new Set(items.filter(Boolean)));
}

function clamp(value: number, min = 0, max = 100): number {
	return Math.min(max, Math.max(min, value));
}

function calculateToneScore(text: string, desiredTone: string): number {
	const toneKeywords: Record<string, string[]> = {
		"bold & energetic": [
			"exciting",
			"powerful",
			"dynamic",
			"bold",
			"energetic",
			"vibrant",
		],
		professional: ["professional", "expert", "reliable", "trusted", "quality"],
		friendly: ["friendly", "warm", "welcoming", "inviting", "helpful"],
		humorous: ["funny", "laugh", "humor", "joke", "amusing", "witty"],
	};

	const desiredToneLower = desiredTone.toLowerCase();
	const keywords =
		Object.entries(toneKeywords).find(([key]) =>
			desiredToneLower.includes(key),
		)?.[1] || [];

	if (keywords.length === 0) return 60;

	const textLower = text.toLowerCase();
	const matchCount = keywords.filter((keyword) =>
		textLower.includes(keyword),
	).length;
	return Math.min(60 + matchCount * 10, 100);
}

function calculatePersuasionScore(text: string): number {
	const persuasiveWords = [
		"discover",
		"unlock",
		"transform",
		"revolutionize",
		"exclusive",
		"limited",
		"guarantee",
		"proven",
		"effective",
		"essential",
		"amazing",
		"incredible",
		"powerful",
		"best",
		"perfect",
	];

	const textLower = text.toLowerCase();
	const matchCount = persuasiveWords.filter((word) =>
		textLower.includes(word),
	).length;
	const words = text.split(/\s+/).length;
	const density = matchCount / Math.max(words, 1);

	return Math.min(50 + density * 500, 95);
}

function calculateClarityScore(text: string): number {
	const sentences = text
		.split(/[.!?]+/)
		.filter((sentence) => sentence.trim().length > 0);
	const words = text.split(/\s+/).filter((word) => word.length > 0);

	if (sentences.length === 0) return 50;

	const avgSentenceLength = words.length / sentences.length;
	let score = 80;

	if (avgSentenceLength > 25) score -= 15;
	else if (avgSentenceLength > 20) score -= 5;
	else if (avgSentenceLength < 8) score -= 10;

	const complexWords = words.filter((word) => word.length > 8).length;
	if (complexWords / Math.max(words.length, 1) > 0.3) score -= 15;

	return Math.max(score, 40);
}

function calculateAudienceScore(text: string, targetAudience: string): number {
	const audienceKeywords: Record<string, string[]> = {
		"gen z": ["trending", "viral", "aesthetic", "vibe", "flex", "slay", "drip"],
		professionals: [
			"productivity",
			"efficiency",
			"professional",
			"business",
			"career",
		],
		parents: ["family", "kids", "children", "parenting", "safe", "care"],
		students: ["study", "learn", "school", "college", "university", "exam"],
	};

	const targetLower = targetAudience.toLowerCase();
	const keywords =
		Object.entries(audienceKeywords).find(([key]) =>
			targetLower.includes(key),
		)?.[1] || [];

	if (keywords.length === 0) return 60;

	const textLower = text.toLowerCase();
	const matchCount = keywords.filter((keyword) =>
		textLower.includes(keyword),
	).length;
	return Math.min(50 + matchCount * 15, 100);
}

function calculateCreativityScore(text: string): number {
	const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
	const totalWords = text.split(/\s+/).length;
	const uniqueness = uniqueWords / Math.max(totalWords, 1);

	let score = 50;
	if (uniqueness > 0.7) score += 20;
	else if (uniqueness > 0.5) score += 10;

	const questions = (text.match(/\?/g) || []).length;
	if (questions > 0) score += 10;

	const exclamations = (text.match(/!/g) || []).length;
	if (exclamations > 0 && exclamations < 3) score += 5;

	return Math.min(score, 100);
}

function calculateEngagementScore(text: string): number {
	const engagementSignals = [
		"you",
		"your",
		"you'll",
		"you're",
		"get",
		"now",
		"today",
		"join",
		"start",
	];

	const textLower = text.toLowerCase();
	const matchCount = engagementSignals.filter((signal) =>
		textLower.includes(signal),
	).length;

	let score = 50 + matchCount * 8;
	const questionCount = (text.match(/\?/g) || []).length;
	score += questionCount * 10;

	return Math.min(score, 100);
}
