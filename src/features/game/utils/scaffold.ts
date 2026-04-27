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
