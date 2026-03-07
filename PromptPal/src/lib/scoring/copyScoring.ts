import { convexHttpClient } from '../convex-client';
import { api } from '../../../convex/_generated/api.js';
import { logger } from '../logger';
import {
  buildCopyAnalysisPrompt,
  calculateCopyOverallScore,
  checkRequiredElements,
  countWords,
  COPY_METRIC_LABELS,
  DEFAULT_COPY_WORD_LIMIT,
  generateCopyFeedback,
  isWithinWordLimit,
  parseCopyMetrics,
} from './copyScoringCore';

export interface CopyScoringInput {
  text: string;
  briefProduct?: string;
  briefTarget?: string;
  briefTone?: string;
  briefGoal?: string;
  wordLimit?: { min?: number; max?: number };
  requiredElements?: string[];
  passingScore?: number;
}

export interface CopyScoringResult {
  score: number;
  metrics: { label: string; value: number }[];
  feedback: string[];
  wordCount: number;
  withinLimit: boolean;
}

export class CopyScoringService {
  private static readonly MIN_TEXT_LENGTH = 10;
  private static readonly MAX_TEXT_LENGTH = 5000;

  /**
   * Scores copywriting text against brief requirements
   */
  static async scoreCopy(input: CopyScoringInput): Promise<CopyScoringResult> {
    const {
      text,
      briefProduct,
      briefTarget,
      briefTone,
      briefGoal,
      wordLimit,
      requiredElements,
      passingScore,
    } = input;

    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      const trimmedText = text.trim();

      if (trimmedText.length < this.MIN_TEXT_LENGTH) {
        throw new Error('Text is too short');
      }

      if (trimmedText.length > this.MAX_TEXT_LENGTH) {
        throw new Error('Text exceeds maximum length');
      }

      const wordCount = countWords(trimmedText);
      const limits = wordLimit || DEFAULT_COPY_WORD_LIMIT;
      const withinLimit = isWithinWordLimit(wordCount, limits);

      const metrics = await this.analyzeMetrics(trimmedText, {
        briefProduct,
        briefTarget,
        briefTone,
        briefGoal,
      });

      const elementChecks = checkRequiredElements(trimmedText, requiredElements);

      const overallScore = calculateCopyOverallScore(metrics, elementChecks, withinLimit);
      const feedback = generateCopyFeedback({
        metrics,
        elementChecks,
        wordCount,
        limits,
        overallScore,
        passingScore,
      });

      return {
        score: overallScore,
        metrics,
        feedback,
        wordCount,
        withinLimit,
      };
    } catch (error) {
      logger.error('CopyScoringService', error, { operation: 'scoreCopy', input });

      return {
        score: 0,
        metrics: COPY_METRIC_LABELS.map(label => ({ label, value: 0 })),
        feedback: ['Failed to score copy. Please try again.'],
        wordCount: 0,
        withinLimit: false,
      };
    }
  }

  /**
   * Analyzes copy metrics using AI
   */
  private static async analyzeMetrics(
    text: string,
    brief: {
      briefProduct?: string;
      briefTarget?: string;
      briefTone?: string;
      briefGoal?: string;
    }
  ): Promise<{ label: string; value: number }[]> {
    try {
      const prompt = buildCopyAnalysisPrompt(text, brief);

      const aiResponse = await convexHttpClient.action(api.ai.generateText, {
        prompt,
        appId: "prompt-pal",
        context: brief.briefTone,
      });

      return parseCopyMetrics(aiResponse.result, text, brief);
    } catch (error) {
      logger.warn('CopyScoringService', 'AI analysis failed, using fallback', { error });

      return parseCopyMetrics('', text, brief);
    }
  }

  /**
   * Batch score multiple copy submissions
   */
  static async scoreCopies(inputs: CopyScoringInput[]): Promise<CopyScoringResult[]> {
    const results = await Promise.allSettled(
      inputs.map(input => this.scoreCopy(input))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      logger.error('CopyScoringService', result.reason, { operation: 'scoreCopies', index });
      return {
        score: 0,
        metrics: COPY_METRIC_LABELS.map(label => ({ label, value: 0 })),
        feedback: ['Scoring failed for this copy.'],
        wordCount: 0,
        withinLimit: false,
      };
    });
  }
}
