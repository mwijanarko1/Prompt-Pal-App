/** When false, Image Generation is omitted from module lists and guarded routes (implementation WIP). */
export const SHOW_IMAGE_GENERATION_MODULE = false;

export function filterLearningModulesByVisibility<T extends { id: string }>(
	modules: T[],
): T[] {
	if (SHOW_IMAGE_GENERATION_MODULE) return modules;
	return modules.filter((m) => m.id !== "image-generation");
}

/** Route id for Train links when image module is hidden (avoids broken navigation). */
export function resolveLearningModuleRouteId(moduleId: string): string {
	if (!SHOW_IMAGE_GENERATION_MODULE && moduleId === "image-generation") {
		return "coding-logic";
	}
	return moduleId;
}

export const XP_PER_LEVEL = 200;
export const MAX_PROMPT_LENGTH = 4000;
export const MIN_PROMPT_LENGTH = 1;
export const SYNC_INTERVAL_MS = 30000;
export const SIGN_OUT_DEBOUNCE_MS = 5000;
export const AI_RATE_LIMITS = {
	textGeneration: { maxRequests: 10, windowMs: 60000 },
	imageGeneration: { maxRequests: 5, windowMs: 60000 },
} as const;
