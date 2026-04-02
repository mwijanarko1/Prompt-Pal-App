import type { Level } from "@/features/game/store";

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

export function shouldShowChecklist(level?: Level | null): boolean {
	return (
		Boolean(level) &&
		(level?.scaffoldType === "template" || level?.scaffoldType === "checklist") &&
		getLevelChecklistItems(level).length > 0
	);
}
