export interface ChecklistMatchResult {
	matchedItems: string[];
	coverage: number;
}

/** Map spelling variants to one token so checklist items match user input. */
const CANONICAL_TOKEN: Record<string, string> = {
	colour: "color",
	colours: "colors",
	gray: "grey",
	grays: "greys",
};

function canonicalizeToken(token: string): string {
	return CANONICAL_TOKEN[token] ?? token;
}

const STOPWORDS = new Set([
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"but",
	"by",
	"for",
	"from",
	"has",
	"have",
	"i",
	"if",
	"in",
	"into",
	"is",
	"it",
	"its",
	"of",
	"on",
	"or",
	"that",
	"the",
	"their",
	"then",
	"this",
	"to",
	"with",
	"write",
	"create",
	"generate",
	"make",
	"your",
	"you",
	"use",
]);

export function tokenizeChecklistText(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, " ")
		.split(/\s+/)
		.map((token) => token.trim())
		.filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export function uniqueChecklistTokens(text: string): Set<string> {
	const tokens = tokenizeChecklistText(text).map(canonicalizeToken);
	return new Set(tokens);
}

export function calculateTokenCoverage(
	source: Set<string>,
	target: Set<string>,
): number {
	if (target.size === 0) return 0;

	let matches = 0;
	target.forEach((token) => {
		if (source.has(token)) matches += 1;
	});

	return matches / target.size;
}

export function matchesChecklistItem(
	promptText: string,
	promptTokens: Set<string>,
	item: string,
): boolean {
	const normalizedItem = item.trim().toLowerCase();
	if (!normalizedItem) return false;
	if (promptText.includes(normalizedItem)) return true;

	const itemTokens = uniqueChecklistTokens(item);
	if (itemTokens.size === 0) return false;

	return calculateTokenCoverage(promptTokens, itemTokens) >= 0.6;
}

export function getMatchedChecklistItems(
	userPrompt: string,
	checklistItems: string[] = [],
): string[] {
	const promptText = userPrompt.trim().toLowerCase();
	const promptTokens = uniqueChecklistTokens(promptText);

	return checklistItems
		.filter(Boolean)
		.filter((item) => matchesChecklistItem(promptText, promptTokens, item));
}

export function getChecklistMatchResult(
	userPrompt: string,
	checklistItems: string[] = [],
): ChecklistMatchResult {
	const sanitizedItems = checklistItems.filter(Boolean);
	const matchedItems = getMatchedChecklistItems(userPrompt, sanitizedItems);

	return {
		matchedItems,
		coverage:
			sanitizedItems.length > 0
				? matchedItems.length / sanitizedItems.length
				: 0,
	};
}
