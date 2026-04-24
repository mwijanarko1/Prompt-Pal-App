export type GeneratedImageResultLike = {
	imageUrl: string;
	storageId?: string;
};

type BuildImageEvaluationRequestArgs = {
	levelId: string;
	targetImageUrlForEvaluation: string;
	hiddenPromptKeywords?: string[];
	style?: string;
	prompt: string;
	generateResult: GeneratedImageResultLike;
	targetPrompt?: string;
};

/**
 * Builds the shared request contract for backend image evaluation.
 */
export function buildImageEvaluationRequest({
	levelId,
	targetImageUrlForEvaluation,
	hiddenPromptKeywords,
	style,
	prompt,
	generateResult,
	targetPrompt,
}: BuildImageEvaluationRequestArgs) {
	const request = {
		taskId: levelId,
		userImageUrl: generateResult.imageUrl,
		expectedImageUrl: targetImageUrlForEvaluation,
		hiddenPromptKeywords,
		style,
		userPrompt: prompt,
		...(targetPrompt ? { targetPrompt } : {}),
	};

	if (!generateResult.storageId) {
		return request;
	}

	return {
		...request,
		userImageStorageId: generateResult.storageId,
	};
}
