import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { generateText as aiGenerateText } from "ai";
import { internal } from "./_generated/api";
import { isAppAIErrorData, type AppAIErrorData } from "../src/lib/aiErrors";
import { MAX_CODE_LENGTH, MAX_COPY_LENGTH, MAX_PROMPT_LENGTH } from "./aiConstants";
import { getErrorMessage, toProviderErrorData } from "./aiProviderErrors";
import {
	logAIGenerationFailure,
	refundQuotaUsage,
} from "./aiQuotaHelpers";
import { google } from "./geminiClient";
import { generateTextWithQuota, type TextQuotaCheck } from "./textQuotaGeneration";
import { CodeScoringService } from "../src/lib/scoring/codeScoring";
import {
	buildCopyAnalysisPrompt,
	calculateCopyOverallScore,
	checkRequiredElements,
	countWords,
	DEFAULT_COPY_WORD_LIMIT,
	generateCopyFeedback,
	isWithinWordLimit,
	parseCopyMetrics,
} from "../src/lib/scoring/copyScoringCore";
import {
	assessCodePromptQuality,
	assessCopyPromptQuality,
	assessImagePromptQuality,
} from "../src/lib/scoring/promptQuality";

type QuotaResult = TextQuotaCheck;

type GenerateTextResult = {
	result: string;
	tokensUsed?: number;
	remainingQuota?: number;
	limit?: number;
	tier?: "free" | "pro";
	error?: AppAIErrorData;
};

type GenerateImageResult = {
	imageUrl: string;
	remainingQuota: number;
	limit: number;
	tier: "free" | "pro";
};

type EvaluateImageResult = {
	evaluation: ImageEvaluation;
	remainingQuota: number;
	limit: number;
	tier: "free" | "pro";
};

type PromptEvaluationResult = {
	score: number;
	promptQualityScore: number;
	feedback: string[];
};

type GradingCriterion = {
	id: string;
	description: string;
	weight: number;
	required?: boolean;
	method?: string;
};

type ImageEvaluationCriterion = {
	name: string;
	score: number;
	feedback: string;
};

type ImageEvaluation = {
	score: number;
	similarity: number;
	keywordScore: number;
	styleScore: number;
	promptQualityScore: number;
	feedback: string[];
	keywordsMatched: string[];
	criteria: ImageEvaluationCriterion[];
};

function clampScore(value: unknown): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		return 0;
	}

	return Math.max(0, Math.min(100, Math.round(value)));
}

function dedupeFeedback(items: Array<string | undefined>): string[] {
	return Array.from(
		new Set(
			items
				.map((item) => item?.trim())
				.filter((item): item is string => Boolean(item)),
		),
	);
}

function defaultImageEvaluation(message: string): ImageEvaluation {
	return {
		score: 0,
		similarity: 0,
		keywordScore: 0,
		styleScore: 0,
		promptQualityScore: 0,
		feedback: [message],
		keywordsMatched: [],
		criteria: [],
	};
}

function createAIError(
	code: AppAIErrorData["code"],
	message: string,
	retryable = false,
): ConvexError<AppAIErrorData> {
	return new ConvexError<AppAIErrorData>({
		code,
		message,
		retryable,
	});
}

function normalizeImageEvaluation(raw: unknown): ImageEvaluation {
	const candidate =
		raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
	const similarity = clampScore(candidate.similarity);
	const keywordScore = clampScore(candidate.keywordScore);
	const styleScore = clampScore(candidate.styleScore);
	const fallbackScore = Math.round(
		similarity * 0.6 + keywordScore * 0.25 + styleScore * 0.15,
	);
	const criteria = Array.isArray(candidate.criteria)
		? candidate.criteria
				.filter(
					(item): item is Record<string, unknown> =>
						Boolean(item) && typeof item === "object",
				)
				.map((item) => ({
					name:
						typeof item.name === "string" ? item.name : "Evaluation criterion",
					score: clampScore(item.score),
					feedback:
						typeof item.feedback === "string"
							? item.feedback
							: "No detailed feedback provided.",
				}))
		: [];

	return {
		score: clampScore(candidate.score ?? fallbackScore),
		similarity,
		keywordScore,
		styleScore,
		promptQualityScore: clampScore(candidate.promptQualityScore ?? 100),
		feedback: Array.isArray(candidate.feedback)
			? candidate.feedback.filter(
					(item): item is string => typeof item === "string" && item.trim().length > 0,
				)
			: [],
		keywordsMatched: Array.isArray(candidate.keywordsMatched)
			? candidate.keywordsMatched.filter(
					(item): item is string => typeof item === "string" && item.trim().length > 0,
				)
			: [],
		criteria,
	};
}

export const generateText = action({
	args: {
		prompt: v.string(),
		appId: v.literal("prompt-pal"),
		context: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<GenerateTextResult> => {
		// Clerk auth is automatic
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		try {
			const { text, tokensUsed, quotaCheck } = await generateTextWithQuota(
				ctx,
				{
					userId: identity.subject,
					prompt: args.prompt,
					context: args.context,
				},
			);

			return {
				result: text,
				tokensUsed,
				remainingQuota: quotaCheck.remaining,
				limit: quotaCheck.limit,
				tier: quotaCheck.tier,
			};
		} catch (error) {
			if (
				error instanceof ConvexError &&
				isAppAIErrorData(error.data)
			) {
				return {
					result: "",
					error: error.data,
				};
			}

			throw error;
		}
	},
});

function parseOnboardingPromptJudgeResponse(responseText: string): {
	hasSubject: boolean;
	hasStyle: boolean;
	hasGuardrail: boolean;
	coachMessage: string;
} | null {
	try {
		let jsonText = responseText;
		const backtickMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (backtickMatch?.[1]) jsonText = backtickMatch[1];
		else {
			const braceMatch = responseText.match(/\{[\s\S]*\}/);
			if (braceMatch?.[0]) jsonText = braceMatch[0];
		}
		const parsed = JSON.parse(jsonText.trim()) as Record<string, unknown>;
		const hasSubject =
			parsed.has_subject === true || parsed.hasSubject === true;
		const hasStyle = parsed.has_style === true || parsed.hasStyle === true;
		const hasGuardrail =
			parsed.has_guardrail === true || parsed.hasGuardrail === true;
		const coachMessage =
			typeof parsed.coach_message === "string"
				? parsed.coach_message
				: typeof parsed.coachMessage === "string"
					? parsed.coachMessage
					: "";
		return { hasSubject, hasStyle, hasGuardrail, coachMessage };
	} catch {
		return null;
	}
}

export const evaluateOnboardingPrompt = action({
	args: {
		userPrompt: v.string(),
		taskBrief: v.string(),
	},
	handler: async (
		ctx,
		args,
	): Promise<{
		hasSubject: boolean;
		hasStyle: boolean;
		hasGuardrail: boolean;
		passed: boolean;
		coachMessage: string;
		remainingQuota: number;
		limit: number;
		tier: "free" | "pro";
	}> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw createAIError(
				"UNAUTHENTICATED",
				"Please sign in to check your prompt.",
			);
		}

		const trimmed = args.userPrompt.trim();
		if (trimmed.length === 0) {
			throw createAIError(
				"AI_REQUEST_FAILED",
				"Write a prompt before checking it.",
			);
		}
		if (trimmed.length > MAX_PROMPT_LENGTH) {
			throw createAIError(
				"AI_REQUEST_FAILED",
				`Prompt is too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`,
			);
		}
		if (args.taskBrief.length > MAX_PROMPT_LENGTH) {
			throw createAIError(
				"AI_REQUEST_FAILED",
				`Task brief is too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`,
			);
		}

		const judgeUserPrompt = [
			"DELIVERABLE THE USER'S PROMPT SHOULD HELP AN AI PRODUCE:",
			args.taskBrief.trim(),
			"",
			"USER'S META-PROMPT (what they wrote to instruct the AI):",
			"---",
			trimmed,
			"---",
			"",
			"Decide if this meta-prompt clearly includes ALL of:",
			"1) SUBJECT — what to write or produce (e.g. a tagline for Blackout Coffee Co., or the concrete output).",
			"2) STYLE — tone, voice, audience, or creative direction (not vague \"make it good\").",
			"3) GUARDRAIL — a concrete constraint (length, words to avoid, format, what must not change, etc.).",
			"",
			"Be strict but fair: synonyms and clear implication count.",
			"",
			"Respond with JSON only, no markdown fences:",
			'{"has_subject":true,"has_style":true,"has_guardrail":true,"coach_message":"one short helpful sentence"}',
		].join("\n");

		const { text, quotaCheck } = await generateTextWithQuota(ctx, {
			userId: identity.subject,
			prompt: judgeUserPrompt,
			context:
				"You are a strict prompt-engineering coach. Output only valid JSON matching the schema in the user message.",
		});

		const parsed = parseOnboardingPromptJudgeResponse(text);
		if (!parsed) {
			await refundQuotaUsage(ctx, {
				userId: identity.subject,
				appId: "prompt-pal",
				quotaType: "textCalls",
			});
			await logAIGenerationFailure(ctx, {
				userId: identity.subject,
				appId: "prompt-pal",
				requestId: crypto.randomUUID(),
				type: "evaluate",
				model: "gemini-2.5-flash",
				promptLength: judgeUserPrompt.length,
				durationMs: 0,
				errorMessage: "Onboarding prompt judge returned invalid JSON.",
			});

			return {
				hasSubject: false,
				hasStyle: false,
				hasGuardrail: false,
				passed: false,
				coachMessage:
					"We couldn't verify your prompt. Please try again in a moment.",
				remainingQuota: Math.min(quotaCheck.limit, quotaCheck.remaining + 1),
				limit: quotaCheck.limit,
				tier: quotaCheck.tier,
			};
		}

		const passed =
			parsed.hasSubject && parsed.hasStyle && parsed.hasGuardrail;
		const coachMessage =
			parsed.coachMessage.trim() ||
			(passed
				? "Nice work — subject, style, and guardrails are all there."
				: "Add what's missing so your prompt is ready to ship.");

		return {
			hasSubject: parsed.hasSubject,
			hasStyle: parsed.hasStyle,
			hasGuardrail: parsed.hasGuardrail,
			passed,
			coachMessage,
			remainingQuota: quotaCheck.remaining,
			limit: quotaCheck.limit,
			tier: quotaCheck.tier,
		};
	},
});

export const evaluateCodeSubmission = action({
	args: {
		levelId: v.string(),
		code: v.string(),
		userPrompt: v.string(),
		visibleBrief: v.optional(v.string()),
		visibleHints: v.optional(v.array(v.string())),
	},
	handler: async (
		ctx,
		args,
	): Promise<PromptEvaluationResult & { testResults: any[] }> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (
			args.userPrompt.length > MAX_PROMPT_LENGTH ||
			args.code.length > MAX_CODE_LENGTH
		) {
			throw new Error("Input too long");
		}

		const level = await ctx.runQuery(internal.queries.getLevelEvaluationData, {
			id: args.levelId,
		});
		if (!level || level.type !== "code") {
			throw new Error("Coding level not found");
		}

		const promptAssessment = assessCodePromptQuality({
			userPrompt: args.userPrompt,
			publicReferences: [
				args.visibleBrief,
				level.title,
				level.description,
				level.moduleTitle,
				...(args.visibleHints || []),
			],
			checklist: level.promptChecklist,
		});

		const grading = level.grading as
			| {
					method?: string;
					criteria?: GradingCriterion[];
					passingCondition?: string;
			  }
			| undefined;
		const shouldUseCriteriaEvaluation =
			Boolean(grading?.criteria?.length) &&
			(!level.testCases?.length ||
				level.language === "html" ||
				grading?.method?.includes("llm_judge"));

		if (shouldUseCriteriaEvaluation && grading?.criteria) {
			const judgePrompt = buildCodeLlmJudgePrompt({
				userPrompt: args.userPrompt,
				generatedCode: args.code,
				visibleBrief: args.visibleBrief,
				visibleHints: args.visibleHints,
				whatUserSees: level.whatUserSees,
				starterCode: level.starterCode,
				criteria: grading.criteria,
			});
			const generated = await generateTextWithQuota(ctx, {
				userId: identity.subject,
				prompt: judgePrompt,
				context:
					"You are a strict frontend code reviewer. Evaluate only against the criteria and respond only with valid JSON.",
			});
			const { passed, reasons } = parseLlmJudgeResponse(
				generated.text,
				grading.criteria,
			);
			const { score: criteriaScore } = computeLlmJudgeScore(
				passed,
				grading.criteria,
				grading.passingCondition ?? "All required criteria pass",
			);
			const score = Math.round(
				criteriaScore * 0.8 + promptAssessment.score * 0.2,
			);
			const failState = level.failState as { nudge?: string } | undefined;
			const successState = level.successState as
				| { feedback?: string }
				| undefined;
			const feedback: string[] = [];

			if (score >= level.passingScore && successState?.feedback) {
				feedback.push(successState.feedback);
			} else if (score < level.passingScore && failState?.nudge) {
				feedback.push(failState.nudge);
			}

			for (const criterion of grading.criteria) {
				if (!passed[criterion.id] && reasons[criterion.id]) {
					feedback.push(`${criterion.id}: ${reasons[criterion.id]}`);
				}
			}

			if (feedback.length === 0) {
				feedback.push("Evaluation complete.");
			}

			return {
				score,
				promptQualityScore: promptAssessment.score,
				feedback,
				testResults: grading.criteria.map((criterion) => ({
					id: criterion.id,
					name: criterion.description,
					passed: passed[criterion.id] === true,
					error: passed[criterion.id] ? undefined : reasons[criterion.id],
					expectedOutput: criterion.required
						? "Required criterion passes"
						: "Optional criterion passes",
					actualOutput: passed[criterion.id] ? "PASS" : "FAIL",
				})),
			};
		}

		const hiddenTestCases = (level.testCases || []).map(
			(testCase: any, index: number) => ({
				id: `hidden-${index + 1}`,
				name: testCase.description || `Hidden Test ${index + 1}`,
				input: testCase.input,
				expectedOutput: testCase.expectedOutput,
				description: testCase.description,
			}),
		);

		const codeResult = await CodeScoringService.scoreCode({
			code: args.code,
			language: level.language || "javascript",
			testCases: hiddenTestCases,
			functionName: level.functionName,
			passingScore: level.passingScore,
		});

		const score = Math.round(
			codeResult.score * 0.8 + promptAssessment.score * 0.2,
		);
		const feedback = Array.from(
			new Set([...promptAssessment.feedback, ...codeResult.feedback]),
		);

		return {
			score,
			promptQualityScore: promptAssessment.score,
			feedback,
			testResults: codeResult.testResults,
		};
	},
});

function buildCodeLlmJudgePrompt(args: {
	userPrompt: string;
	generatedCode: string;
	visibleBrief?: string;
	visibleHints?: string[];
	whatUserSees?: string;
	starterCode?: string;
	criteria: GradingCriterion[];
}): string {
	const criteriaList = args.criteria
		.map(
			(criterion) =>
				`- ${criterion.id}: ${criterion.description} (method: ${criterion.method ?? "llm_judge"}, weight: ${criterion.weight}, required: ${criterion.required ?? false})`,
		)
		.join("\n");

	return `You are evaluating an AI-assisted coding lesson.

VISIBLE BRIEF:
${args.visibleBrief || "No additional brief provided."}

WHAT THE USER SAW BEFORE THE CHANGE:
${args.whatUserSees || "Not provided."}

STARTER CODE:
---
${args.starterCode || "Not provided."}
---

USER PROMPT (evaluate this for criteria about the user's prompt):
---
${args.userPrompt}
---

GENERATED OUTPUT (evaluate this for criteria about the AI's response):
---
${args.generatedCode}
---

Note: The generated output may be HTML/JS code, a plan, or an audit report depending on the lesson. Evaluate each criterion against the appropriate source.

EVALUATION RULES:
- For criteria about the USER PROMPT (e.g. prompt_asked_for_plan, prompt_uses_no_technical_terms, prompt_summarizes_current_state): evaluate the USER PROMPT above.
- For criteria about the AI OUTPUT (e.g. has_hero_section, ai_output_is_a_plan, ai_identifies_hardcoded_key): evaluate the GENERATED OUTPUT above.
- For criteria marked static_analysis: verify by inspecting the code/output directly (e.g. presence of <form>, addEventListener, .catch, authStore.logout, fetch call, etc.).

VISIBLE HINTS:
${args.visibleHints?.length ? args.visibleHints.map((hint) => `- ${hint}`).join("\n") : "- None"}

CRITERIA:
${criteriaList}

Respond with a JSON object only, no prose:
{
  "results": [
    { "id": "criterion_id", "pass": true, "reason": "brief explanation" }
  ]
}`;
}

/** Build LLM judge prompt and parse result for copy lessons with grading.method === "llm_judge" */
function buildCopyLlmJudgePrompt(
	userPrompt: string,
	generatedCopy: string,
	starterContext: Record<string, unknown> | undefined,
	criteria: Array<{
		id: string;
		description: string;
		weight: number;
		required?: boolean;
	}>,
): string {
	const contextStr = starterContext
		? `CONTEXT:\n${JSON.stringify(starterContext, null, 2)}\n\n`
		: "";
	const criteriaList = criteria
		.map(
			(c) =>
				`- ${c.id}: ${c.description} (weight: ${c.weight}, required: ${c.required ?? false})`,
		)
		.join("\n");
	return `You are evaluating a copywriting prompt engineering exercise.

${contextStr}USER'S PROMPT (what the user wrote to instruct the AI):
---
${userPrompt}
---

GENERATED COPY (what the AI produced):
---
${generatedCopy}
---

Evaluate each criterion. For each, determine PASS or FAIL based on the description.

CRITERIA:
${criteriaList}

Respond with a JSON object only, no other text:
{
  "results": [
    { "id": "criterion_id", "pass": true, "reason": "brief explanation" },
    ...
  ]
}`;
}

function parseLlmJudgeResponse(
	responseText: string,
	criteria: Array<{ id: string; weight: number; required?: boolean }>,
): { passed: Record<string, boolean>; reasons: Record<string, string> } {
	const passed: Record<string, boolean> = {};
	const reasons: Record<string, string> = {};
	try {
		let jsonText = responseText;
		const backtickMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
		if (backtickMatch?.[1]) jsonText = backtickMatch[1];
		else {
			const braceMatch = responseText.match(/\{[\s\S]*\}/);
			if (braceMatch?.[0]) jsonText = braceMatch[0];
		}
		const parsed = JSON.parse(jsonText.trim()) as {
			results?: Array<{ id: string; pass: boolean; reason?: string }>;
		};
		const results = parsed.results ?? [];
		for (const r of results) {
			passed[r.id] = r.pass === true;
			if (r.reason) reasons[r.id] = r.reason;
		}
		for (const c of criteria) {
			if (passed[c.id] === undefined) passed[c.id] = false;
		}
	} catch {
		for (const c of criteria) {
			passed[c.id] = false;
			reasons[c.id] = "Could not parse evaluation.";
		}
	}
	return { passed, reasons };
}

function computeLlmJudgeScore(
	passed: Record<string, boolean>,
	criteria: Array<{ id: string; weight: number; required?: boolean }>,
	passingCondition: string,
): { score: number; passed: boolean } {
	const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
	let earnedWeight = 0;
	for (const c of criteria) {
		if (passed[c.id]) earnedWeight += c.weight;
	}
	const allRequiredPass = criteria
		.filter((c) => c.required)
		.every((c) => passed[c.id]);
	const score =
		totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
	// Parse passingCondition heuristically: "All required criteria pass" or "total weight score is at least X out of Y"
	let conditionMet = allRequiredPass;
	const weightMatch = passingCondition.match(/at least (\d+) out of (\d+)/i);
	if (weightMatch) {
		const [, minStr, maxStr] = weightMatch;
		const minScore = parseInt(minStr ?? "0", 10);
		const maxScore = parseInt(maxStr ?? "6", 10);
		conditionMet = conditionMet && earnedWeight >= minScore && maxScore > 0;
	}
	return { score, passed: conditionMet };
}

export const evaluateCopySubmission = action({
	args: {
		levelId: v.string(),
		text: v.string(),
		userPrompt: v.string(),
		visibleBrief: v.optional(v.string()),
		visibleHints: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (
			args.userPrompt.length > MAX_PROMPT_LENGTH ||
			args.text.length > MAX_COPY_LENGTH
		) {
			throw new Error("Input too long");
		}

		const level = await ctx.runQuery(internal.queries.getLevelEvaluationData, {
			id: args.levelId,
		});
		if (!level || level.type !== "copywriting") {
			throw new Error("Copywriting level not found");
		}

		const trimmedText = args.text.trim();
		const wordCount = countWords(trimmedText);

		// LLM-judge path for copy lessons with custom grading criteria
		const grading = level.grading as
			| {
					method?: string;
					criteria?: Array<{
						id: string;
						description: string;
						weight: number;
						required?: boolean;
					}>;
					passingCondition?: string;
			  }
			| undefined;
		if (
			grading?.method === "llm_judge" &&
			grading.criteria &&
			grading.criteria.length > 0
		) {
			const judgePrompt = buildCopyLlmJudgePrompt(
				args.userPrompt,
				trimmedText,
				level.starterContext as Record<string, unknown> | undefined,
				grading.criteria,
			);
			const generated = await generateTextWithQuota(ctx, {
				userId: identity.subject,
				prompt: judgePrompt,
				context:
					"You are a strict copywriting evaluator. Respond only with valid JSON.",
			});
			const { passed, reasons } = parseLlmJudgeResponse(
				generated.text,
				grading.criteria,
			);
			const { score, passed: conditionMet } = computeLlmJudgeScore(
				passed,
				grading.criteria,
				grading.passingCondition ?? "All required criteria pass",
			);
			const failState = level.failState as { nudge?: string } | undefined;
			const successState = level.successState as
				| { feedback?: string }
				| undefined;
			const feedbackLines: string[] = [];
			if (conditionMet && successState?.feedback) {
				feedbackLines.push(successState.feedback);
			} else if (!conditionMet && failState?.nudge) {
				feedbackLines.push(failState.nudge);
			}
			for (const c of grading.criteria) {
				if (!passed[c.id] && reasons[c.id]) {
					feedbackLines.push(`${c.id}: ${reasons[c.id]}`);
				}
			}
			const metrics = grading.criteria.map((c) => ({
				name: c.id.replace(/_/g, " "),
				value: passed[c.id] ? 100 : 0,
			}));
			return {
				score,
				metrics: metrics.map((m) => ({ label: m.name, value: m.value })),
				feedback:
					feedbackLines.length > 0 ? feedbackLines : ["Evaluation complete."],
				wordCount,
				withinLimit: true,
				promptQualityScore: score,
			};
		}

		// Legacy metrics-based path
		const limits = level.wordLimit || DEFAULT_COPY_WORD_LIMIT;
		const withinLimit = isWithinWordLimit(wordCount, limits);

		const promptAssessment = assessCopyPromptQuality({
			userPrompt: args.userPrompt,
			publicReferences: [
				args.visibleBrief,
				level.title,
				level.description,
				level.briefTitle,
				...(args.visibleHints || []),
			],
			checklist: level.promptChecklist,
		});

		const analysisPrompt = buildCopyAnalysisPrompt(trimmedText, {
			briefProduct: level.briefProduct,
			briefTarget: level.briefTarget,
			briefTone: level.briefTone,
			briefGoal: level.briefGoal,
		});

		const generated = await generateTextWithQuota(ctx, {
			userId: identity.subject,
			prompt: analysisPrompt,
			context: level.briefTone || undefined,
		});
		const analysisText = generated.text;

		const metrics = parseCopyMetrics(analysisText, trimmedText, {
			briefProduct: level.briefProduct,
			briefTarget: level.briefTarget,
			briefTone: level.briefTone,
			briefGoal: level.briefGoal,
		});
		const elementChecks = checkRequiredElements(
			trimmedText,
			level.requiredElements,
		);
		const score = calculateCopyOverallScore(
			metrics,
			elementChecks,
			withinLimit,
			promptAssessment.score,
		);
		const feedback = generateCopyFeedback({
			metrics,
			elementChecks,
			wordCount,
			limits,
			overallScore: score,
			passingScore: level.passingScore,
			promptFeedback: promptAssessment.feedback,
		});

		return {
			score,
			metrics,
			feedback,
			wordCount,
			withinLimit,
			promptQualityScore: promptAssessment.score,
		};
	},
});

export const generateImage = action({
	args: {
		prompt: v.string(),
		appId: v.literal("prompt-pal"),
		size: v.optional(
			v.union(
				v.literal("512x512"),
				v.literal("1024x1024"),
				v.literal("1536x1536"),
			),
		),
	},
	handler: async (ctx, args): Promise<GenerateImageResult> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (args.prompt.length > MAX_PROMPT_LENGTH) {
			throw new ConvexError<AppAIErrorData>({
				code: "AI_REQUEST_FAILED",
				message: `Prompt is too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`,
				retryable: false,
			});
		}

		// Check quota
		const quotaCheck: QuotaResult = await ctx.runMutation(
			internal.mutations.checkAndIncrementQuota,
			{
				userId: identity.subject,
				appId: args.appId,
				quotaType: "imageCalls",
			},
		);

		if (!quotaCheck.allowed) {
			throw new ConvexError<AppAIErrorData>({
				code: "APP_QUOTA_EXCEEDED",
				message: `Usage limit reached. ${quotaCheck.remaining} calls remaining.`,
				retryable: false,
			});
		}

		const startedAt = Date.now();
		const requestId = crypto.randomUUID();
		let result;

		try {
			result = await aiGenerateText({
				model: google("gemini-2.5-flash-image"),
				prompt: args.prompt,
				maxRetries: 0,
			});
		} catch (error) {
			const durationMs = Date.now() - startedAt;

			await refundQuotaUsage(ctx, {
				userId: identity.subject,
				appId: args.appId,
				quotaType: "imageCalls",
			});
			await logAIGenerationFailure(ctx, {
				userId: identity.subject,
				appId: args.appId,
				requestId,
				type: "image",
				model: "gemini-2.5-flash-image",
				promptLength: args.prompt.length,
				durationMs,
				errorMessage: getErrorMessage(error),
			});

			throw new ConvexError<AppAIErrorData>(toProviderErrorData(error));
		}

		const durationMs = Date.now() - startedAt;

		// Extract image from result.files
		const imageFile = result.files?.find((file) =>
			file.mediaType?.startsWith("image/"),
		);
		if (!imageFile) {
			throw new Error("No image generated");
		}

		// Convert Uint8Array to Blob for storage
		const imageBlob = new Blob([imageFile.uint8Array as any], {
			type: imageFile.mediaType || "image/png",
		});

		// Store image in Convex storage
		// Note: This assumes storage.store is available in mutations for this Convex version
		const imageId = await (ctx as any).storage.store(imageBlob);

		// Save metadata
		await ctx.runMutation(internal.mutations.saveGeneratedImage, {
			userId: identity.subject,
			appId: args.appId,
			storageId: imageId,
			prompt: args.prompt,
			model: "gemini-2.5-flash-image",
			requestId,
			mimeType: imageFile.mediaType || "image/png",
			size: imageBlob.size,
			width: undefined,
			height: undefined,
		});

		// Log analytics
		await ctx.runMutation(internal.mutations.logAIGeneration, {
			userId: identity.subject,
			appId: args.appId,
			requestId,
			type: "image",
			model: "gemini-2.5-flash-image",
			promptLength: args.prompt.length,
			durationMs,
			success: true,
		});

		const imageUrl = await ctx.storage.getUrl(imageId);

		if (!imageUrl) {
			throw new Error("Failed to generate image URL");
		}

		return {
			imageUrl,
			remainingQuota: quotaCheck.remaining,
			limit: quotaCheck.limit,
			tier: quotaCheck.tier,
		};
	},
});

export const evaluateImage = action({
	args: {
		taskId: v.string(),
		userImageUrl: v.string(),
		expectedImageUrl: v.string(),
		hiddenPromptKeywords: v.optional(v.array(v.string())),
		style: v.optional(v.string()),
		userPrompt: v.optional(v.string()),
		targetPrompt: v.optional(v.string()),
	},
	handler: async (ctx, args): Promise<EvaluateImageResult> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		if (args.userPrompt && args.userPrompt.length > MAX_PROMPT_LENGTH) {
			throw new Error("Input too long");
		}

		const level = args.taskId
			? await ctx.runQuery(internal.queries.getLevelEvaluationData, {
					id: args.taskId,
				})
			: null;

		const promptAssessment = args.userPrompt
			? assessImagePromptQuality({
					userPrompt: args.userPrompt,
					publicReferences: [
						level?.title,
						level?.description,
						args.style,
						...(level?.hints || []),
					],
				})
			: {
					score: 100,
					parrotPenalty: 0,
					checklistCoverage: 100,
					strategicSignalCoverage: 100,
					feedback: [],
				};

		// Check quota - image evaluation uses text calls
		const quotaCheck: QuotaResult = await ctx.runMutation(
			internal.mutations.checkAndIncrementQuota,
			{
				userId: identity.subject,
				appId: "prompt-pal",
				quotaType: "textCalls",
			},
		);

		if (!quotaCheck.allowed) {
			throw new ConvexError<AppAIErrorData>({
				code: "APP_QUOTA_EXCEEDED",
				message: `Usage limit reached. ${quotaCheck.remaining} calls remaining.`,
				retryable: false,
			});
		}

		// Generate evaluation prompt
		const evaluationPrompt = `Compare these two images and provide a detailed evaluation:

Target Image: ${args.expectedImageUrl}
User Generated Image: ${args.userImageUrl}

${args.userPrompt ? `User's Prompt: "${args.userPrompt}"` : ""}
${args.targetPrompt ? `Expected Prompt: "${args.targetPrompt}"` : ""}
${args.hiddenPromptKeywords?.length ? `Required Keywords: ${args.hiddenPromptKeywords.join(", ")}` : ""}
${args.style ? `Required Style: ${args.style}` : ""}

Please evaluate the user's image against the target and provide:
1. A score from 0-100 based on similarity and quality
2. Similarity score (0-100)
3. Keyword score (0-100) - how well the image matches required keywords
4. Style score (0-100) - how well the image matches required style
5. Detailed feedback explaining the scores
6. List of keywords that were matched
7. Detailed criteria breakdown

Return your response as JSON with this exact format:
{
  "score": 85,
  "similarity": 78,
  "keywordScore": 90,
  "styleScore": 82,
  "feedback": ["The image captures the main subject well...", "However, the lighting could be improved..."],
  "keywordsMatched": ["sunset", "ocean", "beach"],
  "criteria": [
    {"name": "Subject Accuracy", "score": 85, "feedback": "Main subject is clearly represented"},
    {"name": "Composition", "score": 78, "feedback": "Good composition but could be more balanced"}
  ]
}`;

		// Generate evaluation using AI
		const startedAt = Date.now();
		const requestId = crypto.randomUUID();
		let result;

		try {
			result = await aiGenerateText({
				model: google("gemini-2.5-flash"),
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: evaluationPrompt },
							{ type: "image", image: new URL(args.expectedImageUrl) },
							{ type: "image", image: new URL(args.userImageUrl) },
						],
					},
				],
				maxRetries: 0,
			});
		} catch (error) {
			const durationMs = Date.now() - startedAt;

			await refundQuotaUsage(ctx, {
				userId: identity.subject,
				appId: "prompt-pal",
				quotaType: "textCalls",
			});
			await logAIGenerationFailure(ctx, {
				userId: identity.subject,
				appId: "prompt-pal",
				requestId,
				type: "evaluate",
				model: "gemini-2.5-flash",
				promptLength: evaluationPrompt.length,
				durationMs,
				errorMessage: getErrorMessage(error),
			});

			throw new ConvexError<AppAIErrorData>(toProviderErrorData(error));
		}

		const durationMs = Date.now() - startedAt;

		// Parse the AI response as JSON
		let evaluation: ImageEvaluation;
		try {
			evaluation = normalizeImageEvaluation(JSON.parse(result.text));
		} catch {
			evaluation = defaultImageEvaluation("Unable to parse AI evaluation response.");
		}

		const finalScore = clampScore(
			evaluation.score * 0.8 + promptAssessment.score * 0.2,
		);
		evaluation = {
			...evaluation,
			score: finalScore,
			promptQualityScore: promptAssessment.score,
			feedback: dedupeFeedback([
				...promptAssessment.feedback,
				...evaluation.feedback,
			]),
		};
		if (evaluation.feedback.length === 0) {
			evaluation.feedback = ["Evaluation complete."];
		}

		// Log analytics
		await ctx.runMutation(internal.mutations.logAIGeneration, {
			userId: identity.subject,
			appId: "prompt-pal",
			requestId,
			type: "evaluate",
			model: "gemini-2.5-flash",
			promptLength: evaluationPrompt.length,
			responseLength: result.text.length,
			tokensUsed: result.usage?.totalTokens,
			durationMs,
			success: true,
		});

		return {
			evaluation,
			remainingQuota: quotaCheck.remaining,
			limit: quotaCheck.limit,
			tier: quotaCheck.tier,
		};
	},
});

const SUPER_CATEGORY_SYSTEM: Record<"image" | "copy" | "code", string> = {
	image: `You are an expert prompt engineer for image generation models. The user will describe an idea in plain English.

Your job: output ONE detailed, copy-paste-ready text prompt they can use with any major image model.

Include where relevant: subject and composition; art style and medium; lighting and mood; camera angle and framing; color palette; and explicit exclusions (what to avoid).

Rules: output only the final prompt text—no headings, no quotes around the whole thing, no "Here is your prompt".`,

	copy: `You are an expert prompt engineer for marketing and long-form copy tasks. The user will describe an idea in plain English.

Your job: output ONE detailed prompt they can paste into a general-purpose LLM to get strong copy.

Include where relevant: target audience; tone and voice; objective; structure (sections or beats); key proof points; and desired call to action.

Rules: output only the final prompt text—no headings, no meta commentary.`,

	code: `You are an expert prompt engineer for coding assistants. The user will describe what they want built or changed in plain English.

Your job: output ONE detailed prompt covering: stack or language assumptions; functional requirements; non-functional constraints (performance, security); desired output format (e.g. files, tests, comments); and edge cases to handle.

Rules: output only the final prompt text—no headings, no meta commentary.`,
};

const SUPER_REFINE_INSTRUCTION: Record<
	"more_detailed" | "simplify" | "change_tone",
	string
> = {
	more_detailed:
		"Rewrite the prompt to be more detailed and specific while preserving the original intent.",
	simplify:
		"Rewrite the prompt to be shorter and clearer while preserving the original intent.",
	change_tone:
		"Rewrite the prompt with a noticeably different tone (more confident and direct) while preserving goals and constraints.",
};

function buildSuperpromptUserMessage(args: {
	idea: string;
	existingPrompt?: string;
	refineMode?: "more_detailed" | "simplify" | "change_tone";
}): string {
	if (args.refineMode && args.existingPrompt?.trim()) {
		const refine = SUPER_REFINE_INSTRUCTION[args.refineMode];
		const ideaLine = args.idea.trim()
			? `Original user idea (context only):\n${args.idea.trim()}\n\n`
			: "";
		return `${ideaLine}Current generated prompt:\n${args.existingPrompt.trim()}\n\n${refine}\n\nOutput only the fully rewritten prompt.`;
	}

	return `User idea:\n${args.idea.trim()}`;
}

export type SuperpromptGenerateResult = {
	prompt: string;
	category: "image" | "copy" | "code";
	remainingQuota?: number;
	limit?: number;
	tier?: "free" | "pro";
	error?: AppAIErrorData;
};

export const generatePrompt = action({
	args: {
		category: v.union(v.literal("image"), v.literal("copy"), v.literal("code")),
		idea: v.string(),
		existingPrompt: v.optional(v.string()),
		refineMode: v.optional(
			v.union(
				v.literal("more_detailed"),
				v.literal("simplify"),
				v.literal("change_tone"),
			),
		),
	},
	handler: async (ctx, args): Promise<SuperpromptGenerateResult> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new Error("Not authenticated");

		const idea = args.idea.trim();
		if (args.refineMode) {
			if (!args.existingPrompt?.trim()) {
				throw new ConvexError<AppAIErrorData>({
					code: "AI_REQUEST_FAILED",
					message: "Nothing to refine yet.",
					retryable: false,
				});
			}
		} else if (!idea) {
			throw new ConvexError<AppAIErrorData>({
				code: "AI_REQUEST_FAILED",
				message: "Describe what you want before generating.",
				retryable: false,
			});
		}

		const userMessage = buildSuperpromptUserMessage({
			idea: idea || args.existingPrompt || "",
			existingPrompt: args.existingPrompt,
			refineMode: args.refineMode,
		});

		if (userMessage.length > MAX_PROMPT_LENGTH) {
			throw new ConvexError<AppAIErrorData>({
				code: "AI_REQUEST_FAILED",
				message: `Input is too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`,
				retryable: false,
			});
		}

		const systemContext = SUPER_CATEGORY_SYSTEM[args.category];

		try {
			const { text, quotaCheck } = await generateTextWithQuota(ctx, {
				userId: identity.subject,
				prompt: userMessage,
				context: systemContext,
			});

			return {
				prompt: text.trim(),
				category: args.category,
				remainingQuota: quotaCheck.remaining,
				limit: quotaCheck.limit,
				tier: quotaCheck.tier,
			};
		} catch (error) {
			if (
				error instanceof ConvexError &&
				isAppAIErrorData(error.data)
			) {
				return {
					prompt: "",
					category: args.category,
					error: error.data,
				};
			}

			throw error;
		}
	},
});
