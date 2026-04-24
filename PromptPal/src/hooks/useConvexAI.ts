import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api.js";
import { isAppAIErrorData } from "@/lib/aiErrors";

export function useConvexAI() {
	const generateTextAction = useAction(api.ai.generateText);
	const generateImageAction = useAction(api.ai.generateImage);
	const evaluateImageAction = useAction(api.ai.evaluateImage);
	const evaluateCodeSubmissionAction = useAction(api.ai.evaluateCodeSubmission);
	const evaluateCopySubmissionAction = useAction(api.ai.evaluateCopySubmission);
	const evaluateOnboardingPromptAction = useAction(api.ai.evaluateOnboardingPrompt);

	const generateText = async (prompt: string, context?: string) => {
		try {
			const result = await generateTextAction({
				prompt,
				appId: "prompt-pal",
				context,
			});

			if (isAppAIErrorData(result.error)) {
				const error = new Error(result.error.message) as Error & {
					data?: unknown;
				};
				error.data = result.error;
				throw error;
			}

			return result;
		} catch (error) {
			throw error;
		}
	};

	const generateImage = async (prompt: string, size?: string) => {
		try {
			// #region agent log
			fetch("http://127.0.0.1:7539/ingest/62502dbc-932f-4650-8d3c-bcc65e44f0d6", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "139464",
				},
				body: JSON.stringify({
					sessionId: "139464",
					runId: `client-generateImage-${Date.now()}`,
					hypothesisId: "H6-H8",
					location: "src/hooks/useConvexAI.ts:generateImage:beforeAction",
					message: "client calling Convex generateImage action",
					data: {
						promptLength: prompt.length,
						hasPrompt: Boolean(prompt.trim()),
						size: size ?? null,
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {});
			// #endregion
			const result = await generateImageAction({
				prompt,
				appId: "prompt-pal",
				size: size as any,
			});
			return result;
		} catch (error) {
			const normalizedError =
				error && typeof error === "object"
					? (error as {
							name?: unknown;
							message?: unknown;
							data?: unknown;
							cause?: unknown;
					  })
					: undefined;
			// #region agent log
			fetch("http://127.0.0.1:7539/ingest/62502dbc-932f-4650-8d3c-bcc65e44f0d6", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "139464",
				},
				body: JSON.stringify({
					sessionId: "139464",
					runId: `client-generateImage-${Date.now()}`,
					hypothesisId: "H7-H8",
					location: "src/hooks/useConvexAI.ts:generateImage:catch",
					message: "client received Convex generateImage error",
					data: {
						errorName:
							typeof normalizedError?.name === "string"
								? normalizedError.name
								: "unknown",
						errorMessage:
							typeof normalizedError?.message === "string"
								? normalizedError.message
								: "unknown",
						errorData:
							normalizedError?.data && typeof normalizedError.data === "object"
								? normalizedError.data
								: null,
						hasCause: Boolean(normalizedError?.cause),
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {});
			// #endregion
			throw error;
		}
	};

	const evaluateImage = async (options: {
		taskId: string;
		userImageUrl: string;
		userImageStorageId?: string;
		expectedImageUrl: string;
		hiddenPromptKeywords?: string[];
		style?: string;
		userPrompt?: string;
		targetPrompt?: string;
	}) => {
		try {
			// #region agent log
			fetch("http://127.0.0.1:7539/ingest/62502dbc-932f-4650-8d3c-bcc65e44f0d6", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "139464",
				},
				body: JSON.stringify({
					sessionId: "139464",
					runId: `client-evaluateImage-${Date.now()}`,
					hypothesisId: "H9-H10",
					location: "src/hooks/useConvexAI.ts:evaluateImage:beforeAction",
					message: "client calling Convex evaluateImage action",
					data: {
						taskId: options.taskId,
						hasUserImageUrl: Boolean(options.userImageUrl),
						hasExpectedImageUrl: Boolean(options.expectedImageUrl),
						keywordCount: options.hiddenPromptKeywords?.length ?? 0,
						hasStyle: Boolean(options.style),
						hasUserPrompt: Boolean(options.userPrompt),
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {});
			// #endregion
			const result = await evaluateImageAction(options as any);
			// #region agent log
			fetch("http://127.0.0.1:7539/ingest/62502dbc-932f-4650-8d3c-bcc65e44f0d6", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "139464",
				},
				body: JSON.stringify({
					sessionId: "139464",
					runId: `client-evaluateImage-${Date.now()}`,
					hypothesisId: "H9-H11",
					location: "src/hooks/useConvexAI.ts:evaluateImage:afterAction",
					message: "client received evaluateImage result",
					data: {
						score: result.evaluation?.score ?? null,
						feedbackCount: result.evaluation?.feedback?.length ?? 0,
						keywordsMatchedCount: result.evaluation?.keywordsMatched?.length ?? 0,
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {});
			// #endregion
			return result;
		} catch (error) {
			const normalizedError =
				error && typeof error === "object"
					? (error as {
							name?: unknown;
							message?: unknown;
							data?: unknown;
					  })
					: undefined;
			// #region agent log
			fetch("http://127.0.0.1:7539/ingest/62502dbc-932f-4650-8d3c-bcc65e44f0d6", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "139464",
				},
				body: JSON.stringify({
					sessionId: "139464",
					runId: `client-evaluateImage-${Date.now()}`,
					hypothesisId: "H10",
					location: "src/hooks/useConvexAI.ts:evaluateImage:catch",
					message: "client received evaluateImage error",
					data: {
						errorName:
							typeof normalizedError?.name === "string"
								? normalizedError.name
								: "unknown",
						errorMessage:
							typeof normalizedError?.message === "string"
								? normalizedError.message
								: "unknown",
						errorData:
							normalizedError?.data && typeof normalizedError.data === "object"
								? normalizedError.data
								: null,
					},
					timestamp: Date.now(),
				}),
			}).catch(() => {});
			// #endregion
			throw error;
		}
	};

	const evaluateCodeSubmission = async (options: {
		levelId: string;
		code: string;
		userPrompt: string;
		visibleBrief?: string;
		visibleHints?: string[];
	}) => {
		return evaluateCodeSubmissionAction(options);
	};

	const evaluateCopySubmission = async (options: {
		levelId: string;
		text: string;
		userPrompt: string;
		visibleBrief?: string;
		visibleHints?: string[];
	}) => {
		return evaluateCopySubmissionAction(options);
	};

	const evaluateOnboardingPrompt = async (options: {
		userPrompt: string;
		taskBrief: string;
	}) => {
		return evaluateOnboardingPromptAction(options);
	};

	return {
		generateText,
		generateImage,
		evaluateImage,
		evaluateCodeSubmission,
		evaluateCopySubmission,
		evaluateOnboardingPrompt,
	};
}
