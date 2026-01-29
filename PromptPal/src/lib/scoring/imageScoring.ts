import { AIProxyClient, AIProxyResponse } from '../aiProxy';
import { logger } from '../logger';

export interface ImageScoringInput {
  targetImageUrl: string;
  resultImageUrl: string;
  hiddenPromptKeywords?: string[];
  style?: string;
  passingScore?: number;
}

export interface ImageScoringResult {
  score: number;
  similarity: number;
  feedback: string[];
  keywordsMatched: string[];
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
  static async scoreImage(input: ImageScoringInput): Promise<ImageScoringResult> {
    const { targetImageUrl, resultImageUrl, hiddenPromptKeywords, style, passingScore } = input;

    try {
      if (!targetImageUrl || !resultImageUrl) {
        throw new Error('Both target and result image URLs are required');
      }

      const feedback: string[] = [];
      const keywordsMatched: string[] = [];

      let aiResponse: AIProxyResponse | null = null;
      let similarity = 0;

      try {
        aiResponse = await Promise.race([
          AIProxyClient.compareImages(targetImageUrl, resultImageUrl),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Image comparison timeout')), this.TIMEOUT_MS)
          )
        ]) as AIProxyResponse;
        
        similarity = aiResponse.score !== undefined ? Math.round(aiResponse.score * 100) : 0;
        
        if (!aiResponse.score && aiResponse.score !== 0) {
          logger.warn('ImageScoringService', 'No similarity score in AI response');
        }
      } catch (error) {
        logger.warn('ImageScoringService', 'AI comparison failed, using fallback scoring', { error });
        similarity = this.calculateFallbackSimilarity(targetImageUrl, resultImageUrl);
      }

      const keywordScore = hiddenPromptKeywords && hiddenPromptKeywords.length > 0
        ? this.calculateKeywordScore(aiResponse, hiddenPromptKeywords, keywordsMatched)
        : 0;

      const styleScore = style ? this.calculateStyleScore(aiResponse, style) : 0;

      const overallScore = this.calculateOverallScore(similarity, keywordScore, styleScore);

      this.generateFeedback(similarity, keywordScore, styleScore, overallScore, feedback, passingScore);

      if (keywordsMatched.length > 0) {
        feedback.push(`Captured elements: ${keywordsMatched.join(', ')}`);
      }

      if (hiddenPromptKeywords && hiddenPromptKeywords.length > 0) {
        const missedKeywords = hiddenPromptKeywords.filter(kw => !keywordsMatched.includes(kw));
        if (missedKeywords.length > 0) {
          feedback.push(`Try including: ${missedKeywords.join(', ')}`);
        }
      }

      return {
        score: Math.min(Math.max(overallScore, this.MIN_SCORE), this.MAX_SCORE),
        similarity,
        feedback,
        keywordsMatched,
      };
    } catch (error) {
      logger.error('ImageScoringService', error, { operation: 'scoreImage', input });
      
      return {
        score: this.MIN_SCORE,
        similarity: 0,
        feedback: ['Failed to score image. Please try again.'],
        keywordsMatched: [],
      };
    }
  }

  /**
   * Calculates keyword matching score from AI response
   */
  private static calculateKeywordScore(
    aiResponse: AIProxyResponse | null,
    keywords: string[],
    matchedKeywords: string[]
  ): number {
    if (!aiResponse || !aiResponse.metadata) {
      return 0;
    }

    const metadata = aiResponse.metadata as { detectedKeywords?: string[] };
    const detectedKeywords = metadata.detectedKeywords || [];
    
    const matchedCount = keywords.filter(keyword => 
      detectedKeywords.some(detected => 
        detected.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(detected.toLowerCase())
      )
    ).length;

    matchedKeywords.push(...keywords.filter(keyword => 
      detectedKeywords.some(detected => 
        detected.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(detected.toLowerCase())
      )
    ));

    return keywords.length > 0 ? (matchedCount / keywords.length) * 100 : 0;
  }

  /**
   * Calculates style matching score
   */
  private static calculateStyleScore(aiResponse: AIProxyResponse | null, targetStyle: string): number {
    if (!aiResponse || !aiResponse.metadata) {
      return 0;
    }

    const metadata = aiResponse.metadata as { styleMatch?: number };
    return metadata.styleMatch !== undefined ? Math.round(metadata.styleMatch * 100) : 0;
  }

  /**
   * Calculates overall score from component scores
   */
  private static calculateOverallScore(
    similarity: number,
    keywordScore: number,
    styleScore: number
  ): number {
    const weights = {
      similarity: 0.6,
      keyword: 0.3,
      style: 0.1,
    };

    return Math.round(
      similarity * weights.similarity +
      keywordScore * weights.keyword +
      styleScore * weights.style
    );
  }

  /**
   * Generates feedback based on score components
   */
  private static generateFeedback(
    similarity: number,
    keywordScore: number,
    styleScore: number,
    overallScore: number,
    feedback: string[],
    passingScore?: number
  ): void {
    if (passingScore && overallScore >= passingScore) {
      feedback.push('Excellent work! Your image meets the passing criteria.');
      return;
    }

    if (similarity < 50) {
      feedback.push('Focus on the main subject and composition.');
    } else if (similarity < 75) {
      feedback.push('Good overall match. Refine details for better accuracy.');
    }

    if (keywordScore < 50) {
      feedback.push('Add more descriptive elements from the reference.');
    }

    if (styleScore < 50) {
      feedback.push('Try adjusting the artistic style to match better.');
    }

    if (overallScore < 30) {
      feedback.push('Consider revising your prompt completely.');
    } else if (overallScore < 60) {
      feedback.push('You\'re on the right track. Keep refining!');
    }
  }

  /**
   * Fallback similarity calculation when AI comparison fails
   * Returns a conservative default as actual image analysis requires AI
   */
  private static calculateFallbackSimilarity(): number {
    logger.warn('ImageScoringService', 'Using fallback similarity score (AI comparison unavailable)');
    return 25;
  }

  /**
   * Simple hash function for fallback comparison
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Batch score multiple images
   */
  static async scoreImages(inputs: ImageScoringInput[]): Promise<ImageScoringResult[]> {
    const results = await Promise.allSettled(
      inputs.map(input => this.scoreImage(input))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      logger.error('ImageScoringService', result.reason, { operation: 'scoreImages', index });
      return {
        score: 0,
        similarity: 0,
        feedback: ['Scoring failed for this image.'],
        keywordsMatched: [],
      };
    });
  }
}
