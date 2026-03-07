import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api.js";

export function useConvexAI() {
  const generateTextAction = useAction(api.ai.generateText);
  const generateImageAction = useAction(api.ai.generateImage);
  const evaluateImageAction = useAction(api.ai.evaluateImage);
  const evaluateCodeSubmissionAction = useAction(api.ai.evaluateCodeSubmission);
  const evaluateCopySubmissionAction = useAction(api.ai.evaluateCopySubmission);

  const generateText = async (prompt: string, context?: string) => {
    try {
      const result = await generateTextAction({
        prompt,
        appId: "prompt-pal",
        context
      });
      return result;
    } catch (error) {
      // Handle quota exceeded, network errors, etc.
      throw error;
    }
  };

  const generateImage = async (prompt: string, size?: string) => {
    try {
      const result = await generateImageAction({
        prompt,
        appId: "prompt-pal",
        size: size as any
      });
      return result;
    } catch (error) {
      throw error;
    }
  };

  const evaluateImage = async (options: {
    taskId: string;
    userImageUrl: string;
    expectedImageUrl: string;
    hiddenPromptKeywords?: string[];
    style?: string;
    userPrompt?: string;
    targetPrompt?: string;
  }) => {
    try {
      const result = await evaluateImageAction(options);
      return result;
    } catch (error) {
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

  return { generateText, generateImage, evaluateImage, evaluateCodeSubmission, evaluateCopySubmission };
}
