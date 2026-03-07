import { action } from "./_generated/server";
import { v } from "convex/values";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText as aiGenerateText } from "ai";
import { api, internal } from "./_generated/api";
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
import { assessCodePromptQuality, assessCopyPromptQuality } from "../src/lib/scoring/promptQuality";

// Validate environment variable at startup
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});

type QuotaResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: "free" | "pro";
};

type GenerateTextResult = {
  result: string;
  tokensUsed?: number;
  remainingQuota: number;
  limit: number;
  tier: "free" | "pro";
};

type GenerateImageResult = {
  imageUrl: string;
  remainingQuota: number;
  limit: number;
  tier: "free" | "pro";
};

type EvaluateImageResult = {
  evaluation: any;
  remainingQuota: number;
  limit: number;
  tier: "free" | "pro";
};

type PromptEvaluationResult = {
  score: number;
  promptQualityScore: number;
  feedback: string[];
};

async function generateTextWithQuota(
  ctx: any,
  args: { userId: string; prompt: string; context?: string }
): Promise<{ text: string; tokensUsed?: number; quotaCheck: QuotaResult }> {
  const quotaCheck: QuotaResult = await ctx.runMutation(internal.mutations.checkAndIncrementQuota, {
    userId: args.userId,
    appId: "prompt-pal",
    quotaType: "textCalls",
  });

  if (!quotaCheck.allowed) {
    throw new Error(`Quota exceeded. ${quotaCheck.remaining} calls remaining.`);
  }

  const startedAt = Date.now();
  const result = await aiGenerateText({
    model: google("gemini-2.5-flash"),
    prompt: args.prompt,
    system: args.context,
  });
  const durationMs = Date.now() - startedAt;

  await ctx.runMutation(internal.mutations.logAIGeneration, {
    userId: args.userId,
    appId: "prompt-pal",
    requestId: crypto.randomUUID(),
    type: "text",
    model: "gemini-2.5-flash",
    promptLength: args.prompt.length,
    responseLength: result.text.length,
    tokensUsed: result.usage?.totalTokens,
    durationMs,
    success: true,
  });

  return {
    text: result.text,
    tokensUsed: result.usage?.totalTokens,
    quotaCheck,
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

    const { text, tokensUsed, quotaCheck } = await generateTextWithQuota(ctx, {
      userId: identity.subject,
      prompt: args.prompt,
      context: args.context,
    });

    return {
      result: text,
      tokensUsed,
      remainingQuota: quotaCheck.remaining,
      limit: quotaCheck.limit,
      tier: quotaCheck.tier
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
  handler: async (ctx, args): Promise<PromptEvaluationResult & { testResults: any[] }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const level = await ctx.runQuery(internal.queries.getLevelEvaluationData, { id: args.levelId });
    if (!level || level.type !== "code") {
      throw new Error("Coding level not found");
    }

    const hiddenTestCases = (level.testCases || []).map((testCase: any, index: number) => ({
      id: `hidden-${index + 1}`,
      name: testCase.description || `Hidden Test ${index + 1}`,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      description: testCase.description,
    }));

    const codeResult = await CodeScoringService.scoreCode({
      code: args.code,
      language: level.language || "javascript",
      testCases: hiddenTestCases,
      functionName: level.functionName,
      passingScore: level.passingScore,
    });

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

    const score = Math.round(codeResult.score * 0.8 + promptAssessment.score * 0.2);
    const feedback = Array.from(
      new Set([...promptAssessment.feedback, ...codeResult.feedback])
    );

    return {
      score,
      promptQualityScore: promptAssessment.score,
      feedback,
      testResults: codeResult.testResults,
    };
  },
});

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

    const level = await ctx.runQuery(internal.queries.getLevelEvaluationData, { id: args.levelId });
    if (!level || level.type !== "copywriting") {
      throw new Error("Copywriting level not found");
    }

    const trimmedText = args.text.trim();
    const limits = level.wordLimit || DEFAULT_COPY_WORD_LIMIT;
    const wordCount = countWords(trimmedText);
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
    const elementChecks = checkRequiredElements(trimmedText, level.requiredElements);
    const score = calculateCopyOverallScore(
      metrics,
      elementChecks,
      withinLimit,
      promptAssessment.score
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
    size: v.optional(v.union(
      v.literal("512x512"),
      v.literal("1024x1024"),
      v.literal("1536x1536")
    )),
  },
  handler: async (ctx, args): Promise<GenerateImageResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check quota
    const quotaCheck: QuotaResult = await ctx.runMutation(internal.mutations.checkAndIncrementQuota, {
      userId: identity.subject,
      appId: args.appId,
      quotaType: "imageCalls"
    });

    if (!quotaCheck.allowed) {
      throw new Error(`Quota exceeded. ${quotaCheck.remaining} calls remaining.`);
    }

    const startedAt = Date.now();
    // Generate image using Gemini 2.5 Flash Image (preview) model
    const result = await aiGenerateText({
      model: google("gemini-2.5-flash-image-preview"),
      prompt: args.prompt,
    });
    const durationMs = Date.now() - startedAt;

    // Extract image from result.files
    const imageFile = result.files?.find(file => file.mediaType?.startsWith('image/'));
    if (!imageFile) {
      throw new Error("No image generated");
    }

    // Convert Uint8Array to Blob for storage
    const imageBlob = new Blob([imageFile.uint8Array as any], { type: imageFile.mediaType || "image/png" });

    // Store image in Convex storage
    // Note: This assumes storage.store is available in mutations for this Convex version
    const imageId = await (ctx as any).storage.store(imageBlob);

    // Save metadata
    await ctx.runMutation(internal.mutations.saveGeneratedImage, {
      userId: identity.subject,
      appId: args.appId,
      storageId: imageId,
      prompt: args.prompt,
      model: "gemini-2.5-flash-image-preview",
      requestId: crypto.randomUUID(),
      mimeType: imageFile.mediaType || "image/png",
      size: imageBlob.size,
      width: undefined,
      height: undefined,
    });

    // Log analytics
    await ctx.runMutation(internal.mutations.logAIGeneration, {
      userId: identity.subject,
      appId: args.appId,
      requestId: crypto.randomUUID(),
      type: "image",
      model: "gemini-2.5-flash-image-preview",
      promptLength: args.prompt.length,
      durationMs,
      success: true,
    });

    // Return image URL
    const imageUrl = await ctx.storage.getUrl(imageId);

    if (!imageUrl) {
      throw new Error("Failed to generate image URL");
    }

    return {
      imageUrl,
      remainingQuota: quotaCheck.remaining,
      limit: quotaCheck.limit,
      tier: quotaCheck.tier
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

    // Check quota - image evaluation uses text calls
    const quotaCheck: QuotaResult = await ctx.runMutation(internal.mutations.checkAndIncrementQuota, {
      userId: identity.subject,
      appId: "prompt-pal",
      quotaType: "textCalls"
    });

    if (!quotaCheck.allowed) {
      throw new Error(`Quota exceeded. ${quotaCheck.remaining} calls remaining.`);
    }

    // Generate evaluation prompt
    const evaluationPrompt = `Compare these two images and provide a detailed evaluation:

Target Image: ${args.expectedImageUrl}
User Generated Image: ${args.userImageUrl}

${args.userPrompt ? `User's Prompt: "${args.userPrompt}"` : ''}
${args.targetPrompt ? `Expected Prompt: "${args.targetPrompt}"` : ''}
${args.hiddenPromptKeywords?.length ? `Required Keywords: ${args.hiddenPromptKeywords.join(', ')}` : ''}
${args.style ? `Required Style: ${args.style}` : ''}

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
    const result = await aiGenerateText({
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
    });
    const durationMs = Date.now() - startedAt;

    // Parse the AI response as JSON
    let evaluation;
    try {
      evaluation = JSON.parse(result.text);
    } catch (parseError) {
      // Fallback evaluation if AI doesn't return valid JSON
      evaluation = {
        score: 50,
        similarity: 50,
        keywordScore: 50,
        styleScore: 50,
        feedback: ["Unable to parse AI evaluation response"],
        keywordsMatched: [],
        criteria: []
      };
    }

    // Log analytics
    await ctx.runMutation(internal.mutations.logAIGeneration, {
      userId: identity.subject,
      appId: "prompt-pal",
      requestId: crypto.randomUUID(),
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
      tier: quotaCheck.tier
    };
  },
});
