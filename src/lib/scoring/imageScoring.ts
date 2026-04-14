import { convexHttpClient } from "../convex-client";
import { api } from "../../../convex/_generated/api.js";
import { logger } from "../logger";

export interface ImageScoringInput {
	targetImageUrl: string;
	resultImageUrl: string;
	hiddenPromptKeywords?: string[];
	style?: string;
	passingScore?: number;
	userPrompt?: string;
	taskId?: string;
}

export interface ImageScoringCriterion {
	name: string;
	score: number;
	feedback: string;
}

export interface ImageScoringResult {
	score: number;
	similarity: number;
	keywordScore: number;
	styleScore: number;
	promptQualityScore: number;
	feedback: string[];
	keywordsMatched: string[];
	criteria: ImageScoringCriterion[];
}

export class ImageScoringService {
	private static readonly MIN_SCORE = 0;
	private static readonly MAX_SCORE = 100;
	private static readonly TIMEOUT_MS = 45000;

	/**
	 * Scores a generated image against the target image
	 * @param input - Scoring input parameters
	 * @returns Promise resolving to scoring result
	 */
	static async scoreImage(
		input: ImageScoringInput,
	): Promise<ImageScoringResult> {
		const {
			targetImageUrl,
			resultImageUrl,
			hiddenPromptKeywords,
			style,
			userPrompt,
			taskId,
		} = input;

		try {
			if (!targetImageUrl || !resultImageUrl) {
				throw new Error("Both target and result image URLs are required");
			}

			let similarity = 0;
			let keywordScore = 0;
			let styleScore = 0;
			let promptQualityScore = 0;
			let overallScore = 0;
			let feedback: string[] = [];
			let keywordsMatched: string[] = [];
			let criteria: ImageScoringCriterion[] = [];

			try {
				const aiResponse = await Promise.race([
					convexHttpClient.action(api.ai.evaluateImage, {
						taskId: taskId || `task-${Date.now()}`,
						userImageUrl: resultImageUrl,
						expectedImageUrl: targetImageUrl,
						hiddenPromptKeywords,
						style,
						userPrompt,
					}),
					new Promise<never>((_, reject) =>
						setTimeout(
							() => reject(new Error("Image comparison timeout")),
							this.TIMEOUT_MS,
						),
					),
				]);

				const evaluation = aiResponse.evaluation;
				if (!evaluation) {
					logger.warn(
						"ImageScoringService",
						"No evaluation payload in AI response",
					);
				} else {
					similarity = this.clampScore(evaluation.similarity);
					keywordScore = this.clampScore(evaluation.keywordScore);
					styleScore = this.clampScore(evaluation.styleScore);
					promptQualityScore = this.clampScore(evaluation.promptQualityScore);
					overallScore = this.clampScore(evaluation.score);
					feedback = Array.isArray(evaluation.feedback)
						? evaluation.feedback.filter(
								(item): item is string =>
									typeof item === "string" && item.trim().length > 0,
						  )
						: [];
					keywordsMatched = Array.isArray(evaluation.keywordsMatched)
						? evaluation.keywordsMatched.filter(
								(item): item is string =>
									typeof item === "string" && item.trim().length > 0,
						  )
						: [];
					criteria = Array.isArray(evaluation.criteria)
						? evaluation.criteria
								.filter(
									(item): item is ImageScoringCriterion =>
										Boolean(item) &&
										typeof item === "object" &&
										typeof item.name === "string",
								)
								.map((item) => ({
									name: item.name,
									score: this.clampScore(item.score),
									feedback:
										typeof item.feedback === "string"
											? item.feedback
											: "No detailed feedback provided.",
								}))
						: [];
				}
			} catch (error) {
				logger.warn(
					"ImageScoringService",
					"AI comparison failed, using fallback scoring",
					{ error },
				);
				similarity = this.calculateFallbackSimilarity();
				overallScore = similarity;
				feedback = ["Image evaluation failed. Review the subject, composition, and style."];
			}

			return {
				score: this.clampScore(overallScore),
				similarity,
				keywordScore,
				styleScore,
				promptQualityScore,
				feedback,
				keywordsMatched,
				criteria,
			};
		} catch (error) {
			logger.error("ImageScoringService", error, {
				operation: "scoreImage",
				input,
			});

			return {
				score: this.MIN_SCORE,
				similarity: 0,
				keywordScore: 0,
				styleScore: 0,
				promptQualityScore: 0,
				feedback: ["Failed to score image. Please try again."],
				keywordsMatched: [],
				criteria: [],
			};
		}
	}

	private static clampScore(value: unknown): number {
		if (typeof value !== "number" || Number.isNaN(value)) {
			return 0;
		}

		return Math.min(Math.max(Math.round(value), this.MIN_SCORE), this.MAX_SCORE);
	}

	/**
	 * Fallback similarity calculation when AI comparison fails
	 * Returns a conservative default as actual image analysis requires AI
	 */
	private static calculateFallbackSimilarity(): number {
		logger.warn(
			"ImageScoringService",
			"Using fallback similarity score (AI comparison unavailable)",
		);
		return 25;
	}

	/**
	 * Batch score multiple images
	 */
	static async scoreImages(
		inputs: ImageScoringInput[],
	): Promise<ImageScoringResult[]> {
		const results = await Promise.allSettled(
			inputs.map((input) => this.scoreImage(input)),
		);

		return results.map((result, index) => {
			if (result.status === "fulfilled") {
				return result.value;
			}
			logger.error("ImageScoringService", result.reason, {
				operation: "scoreImages",
				index,
			});
			return {
				score: 0,
				similarity: 0,
				keywordScore: 0,
				styleScore: 0,
				promptQualityScore: 0,
				feedback: ["Scoring failed for this image."],
				keywordsMatched: [],
				criteria: [],
			};
		});
	}
}
