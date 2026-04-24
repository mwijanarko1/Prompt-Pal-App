import type { Level } from "@/features/game/store";

/** Placeholders are `[label]` segments (no nested brackets). */
const PLACEHOLDER_BODY = /\[[^[\]]+\]/g;

export function parseScaffoldPlaceholders(template: string): {
	segments: string[];
	hints: string[];
} {
	const segments: string[] = [];
	const hints: string[] = [];
	let lastIndex = 0;
	const re = new RegExp(PLACEHOLDER_BODY.source, "g");
	let match: RegExpExecArray | null;
	while ((match = re.exec(template)) !== null) {
		segments.push(template.slice(lastIndex, match.index));
		hints.push(match[0].slice(1, -1));
		lastIndex = match.index + match[0].length;
	}
	segments.push(template.slice(lastIndex));
	return { segments, hints };
}

export function composePromptFromScaffoldSlots(
	segments: string[],
	slotValues: string[],
): string {
	let out = "";
	for (let i = 0; i < segments.length; i++) {
		out += segments[i];
		if (i < slotValues.length) {
			out += slotValues[i];
		}
	}
	return out;
}

/** Composed prompt with every slot empty (beginner locked-template UI). */
export function emptyComposedBeginnerTemplatePrompt(template: string): string {
	const { segments, hints } = parseScaffoldPlaceholders(template);
	return composePromptFromScaffoldSlots(
		segments,
		hints.map(() => ""),
	);
}

export function findFirstPlaceholderRange(
	template?: string,
): { start: number; end: number } | null {
	if (!template) return null;
	const m = template.match(/\[[^[\]]+\]/);
	if (!m || m.index === undefined) return null;
	return { start: m.index, end: m.index + m[0].length };
}

export function isBeginnerTemplateLocked(level?: Level | null): boolean {
	if (!level) return false;
	if (
		level.difficulty !== "beginner" ||
		level.scaffoldType !== "template" ||
		!level.scaffoldTemplate
	) {
		return false;
	}
	return parseScaffoldPlaceholders(level.scaffoldTemplate).hints.length > 0;
}

export function getLevelChecklistItems(level?: Level | null): string[] {
	if (!level) return [];
	return level.checklistItems ?? level.promptChecklist ?? [];
}

export function getInitialPromptForLevel(level?: Level | null): string {
	if (!level) return "";
	if (level.scaffoldType === "template" && level.scaffoldTemplate) {
		return level.scaffoldTemplate;
	}
	return "";
}

/** Initial `prompt` state when beginner template fields are slot-only. */
export function getInitialPromptStateForLevel(level?: Level | null): string {
	if (!level) return "";
	if (isBeginnerTemplateLocked(level) && level.scaffoldTemplate) {
		return emptyComposedBeginnerTemplatePrompt(level.scaffoldTemplate);
	}
	return getInitialPromptForLevel(level);
}

export function shouldShowChecklist(level?: Level | null): boolean {
	return (
		Boolean(level) &&
		(level?.scaffoldType === "template" || level?.scaffoldType === "checklist") &&
		getLevelChecklistItems(level).length > 0
	);
}

/** Minimum consecutive letters/digits to count as a real answer (blocks “ab”, “12”, single chars). */
const BEGINNER_SLOT_MIN_ALNUM_RUN = 3;

/**
 * Whether a slot counts as “filled” for the live checklist: at least one alphanumeric run of
 * {@link BEGINNER_SLOT_MIN_ALNUM_RUN} or more (so random two-letter input does not pass).
 */
export function isBeginnerSlotContentMeaningful(value: string): boolean {
	const t = value.trim();
	if (t.length === 0) return false;
	const runs = t.match(/[a-zA-Z0-9]+/g) ?? [];
	return runs.some((run) => run.length >= BEGINNER_SLOT_MIN_ALNUM_RUN);
}

/**
 * For beginner locked templates, checklist rows align with `[slot]` order.
 * Match by filled slots — keyword overlap on slot-only text fails (labels ≠ user words).
 */
export function getOrdinalMatchedChecklistItemsForBeginnerTemplate(
	template: string | undefined,
	checklistItems: string[],
	slotValues: string[],
): string[] | null {
	if (!template || checklistItems.length === 0) return null;
	const { hints } = parseScaffoldPlaceholders(template);
	if (
		hints.length === 0 ||
		hints.length !== checklistItems.length ||
		slotValues.length !== hints.length
	) {
		return null;
	}
	return checklistItems.filter((_, i) =>
		isBeginnerSlotContentMeaningful(slotValues[i] ?? ""),
	);
}
