export type GenerateCategory = "image" | "copy" | "code";

export type RefineMode = "more_detailed" | "simplify" | "change_tone";

export type GeneratePromptInput = {
	category: GenerateCategory;
	idea: string;
	existingPrompt?: string;
	refineMode?: RefineMode;
};

export type GeneratePromptClientResult = {
	prompt: string;
	category: GenerateCategory;
	remainingQuota?: number;
	limit?: number;
	tier?: "free" | "pro";
};
