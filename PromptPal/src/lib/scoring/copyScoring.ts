import { AIProxyClient, AIProxyResponse } from '../aiProxy';
import { logger } from '../logger';

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
  private static readonly DEFAULT_WORD_LIMIT = { min: 20, max: 300 };

  private static readonly METRIC_LABELS = [
    'TONE',
    'PERSUASION',
    'CLARITY',
    'AUDIENCE FIT',
    'CREATIVITY',
    'ENGAGEMENT',
  ] as const;

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

      const wordCount = this.countWords(trimmedText);
      const limits = wordLimit || this.DEFAULT_WORD_LIMIT;
      const withinLimit = this.checkWordLimit(wordCount, limits);

      const metrics = await this.analyzeMetrics(trimmedText, {
        briefProduct,
        briefTarget,
        briefTone,
        briefGoal,
      });

      const elementChecks = this.checkRequiredElements(trimmedText, requiredElements);

      const overallScore = this.calculateOverallScore(metrics, elementChecks, withinLimit);
      const feedback = this.generateFeedback(metrics, elementChecks, wordCount, limits, overallScore, passingScore);

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
        metrics: this.METRIC_LABELS.map(label => ({ label, value: 0 })),
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
      const prompt = this.buildAnalysisPrompt(text, brief);
      
      const aiResponse = await AIProxyClient.generateText(prompt);
      
      return this.parseMetricsFromResponse(aiResponse, brief);
    } catch (error) {
      logger.warn('CopyScoringService', 'AI analysis failed, using fallback', { error });
      
      return this.calculateFallbackMetrics(text, brief);
    }
  }

  /**
   * Builds prompt for AI analysis
   */
  private static buildAnalysisPrompt(
    text: string,
    brief: {
      briefProduct?: string;
      briefTarget?: string;
      briefTone?: string;
      briefGoal?: string;
    }
  ): string {
    const briefParts = [];
    if (brief.briefProduct) briefParts.push(`Product: ${brief.briefProduct}`);
    if (brief.briefTarget) briefParts.push(`Target Audience: ${brief.briefTarget}`);
    if (brief.briefTone) briefParts.push(`Desired Tone: ${brief.briefTone}`);
    if (brief.briefGoal) briefParts.push(`Goal: ${brief.briefGoal}`);

    return `
Analyze the following copy and provide scores (0-100) for these metrics:
- TONE: How well the tone matches the desired tone
- PERSUASION: How persuasive and compelling the copy is
- CLARITY: How clear and understandable the message is
- AUDIENCE FIT: How well it resonates with the target audience
- CREATIVITY: Originality and creative approach
- ENGAGEMENT: How likely it is to engage readers

${briefParts.length > 0 ? `Brief:\n${briefParts.join('\n')}\n` : ''}

Copy to analyze:
${text}

Provide scores in JSON format:
{
  "TONE": <score>,
  "PERSUASION": <score>,
  "CLARITY": <score>,
  "AUDIENCE FIT": <score>,
  "CREATIVITY": <score>,
  "ENGAGEMENT": <score>
}
`.trim();
  }

  /**
   * Parses metrics from AI response
   */
  private static parseMetricsFromResponse(
    aiResponse: AIProxyResponse,
    brief: {
      briefProduct?: string;
      briefTarget?: string;
      briefTone?: string;
      briefGoal?: string;
    }
  ): { label: string; value: number }[] {
    try {
      if (aiResponse.result) {
        const jsonMatch = aiResponse.result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const scores = JSON.parse(jsonMatch[0]);
          
          return this.METRIC_LABELS.map(label => {
            const key = label.replace(/ /g, '_').toUpperCase();
            return {
              label,
              value: Math.min(Math.max(scores[key] || 50, 0), 100),
            };
          });
        }
      }

      return this.calculateFallbackMetrics('', brief);
    } catch (error) {
      logger.warn('CopyScoringService', 'Failed to parse AI response', { error });
      return this.calculateFallbackMetrics('', brief);
    }
  }

  /**
   * Calculates fallback metrics when AI analysis fails
   */
  private static calculateFallbackMetrics(
    text: string,
    brief: {
      briefProduct?: string;
      briefTarget?: string;
      briefTone?: string;
      briefGoal?: string;
    }
  ): { label: string; value: number }[] {
    const scores: Record<string, number> = {};

    const textLower = text.toLowerCase();

    scores.TONE = brief.briefTone ? this.calculateToneScore(text, brief.briefTone) : 60;
    scores.PERSUASION = this.calculatePersuasionScore(text);
    scores.CLARITY = this.calculateClarityScore(text);
    scores['AUDIENCE FIT'] = brief.briefTarget ? this.calculateAudienceScore(text, brief.briefTarget) : 60;
    scores.CREATIVITY = this.calculateCreativityScore(text);
    scores.ENGAGEMENT = this.calculateEngagementScore(text);

    return this.METRIC_LABELS.map(label => ({
      label,
      value: Math.min(Math.max(scores[label] || 50, 0), 100),
    }));
  }

  /**
   * Calculates tone matching score
   */
  private static calculateToneScore(text: string, desiredTone: string): number {
    const toneKeywords: Record<string, string[]> = {
      'bold & energetic': ['exciting', 'powerful', 'dynamic', 'bold', 'energetic', 'vibrant'],
      'professional': ['professional', 'expert', 'reliable', 'trusted', 'quality'],
      'friendly': ['friendly', 'warm', 'welcoming', 'inviting', 'helpful'],
      'humorous': ['funny', 'laugh', 'humor', 'joke', 'amusing', 'witty'],
    };

    const desiredToneLower = desiredTone.toLowerCase();
    const keywords = Object.entries(toneKeywords).find(([key]) => 
      desiredToneLower.includes(key)
    )?.[1] || [];

    if (keywords.length === 0) return 60;

    const textLower = text.toLowerCase();
    const matchCount = keywords.filter(kw => textLower.includes(kw)).length;

    return Math.min(60 + matchCount * 10, 100);
  }

  /**
   * Calculates persuasion score
   */
  private static calculatePersuasionScore(text: string): number {
    const persuasiveWords = [
      'discover', 'unlock', 'transform', 'revolutionize', 'exclusive',
      'limited', 'guarantee', 'proven', 'effective', 'essential',
      'amazing', 'incredible', 'powerful', 'best', 'perfect',
    ];

    const textLower = text.toLowerCase();
    const matchCount = persuasiveWords.filter(w => textLower.includes(w)).length;

    const words = text.split(/\s+/).length;
    const density = matchCount / Math.max(words, 1);

    return Math.min(50 + density * 500, 95);
  }

  /**
   * Calculates clarity score
   */
  private static calculateClarityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);

    if (sentences.length === 0) return 50;

    const avgSentenceLength = words.length / sentences.length;
    
    let clarityScore = 80;

    if (avgSentenceLength > 25) clarityScore -= 15;
    else if (avgSentenceLength > 20) clarityScore -= 5;
    else if (avgSentenceLength < 8) clarityScore -= 10;

    const complexWords = words.filter(w => w.length > 8).length;
    const complexityRatio = complexWords / words.length;
    if (complexityRatio > 0.3) clarityScore -= 15;

    return Math.max(clarityScore, 40);
  }

  /**
   * Calculates audience fit score
   */
  private static calculateAudienceScore(text: string, targetAudience: string): number {
    const audienceKeywords: Record<string, string[]> = {
      'gen z': ['trending', 'viral', 'aesthetic', 'vibe', 'flex', 'slay', 'drip'],
      'professionals': ['productivity', 'efficiency', 'professional', 'business', 'career'],
      'parents': ['family', 'kids', 'children', 'parenting', 'safe', 'care'],
      'students': ['study', 'learn', 'school', 'college', 'university', 'exam'],
    };

    const targetLower = targetAudience.toLowerCase();
    const keywords = Object.entries(audienceKeywords).find(([key]) => 
      targetLower.includes(key)
    )?.[1] || [];

    if (keywords.length === 0) return 60;

    const textLower = text.toLowerCase();
    const matchCount = keywords.filter(kw => textLower.includes(kw)).length;

    return Math.min(50 + matchCount * 15, 100);
  }

  /**
   * Calculates creativity score
   */
  private static calculateCreativityScore(text: string): number {
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
    const totalWords = text.split(/\s+/).length;
    const uniqueness = uniqueWords / Math.max(totalWords, 1);

    let score = 50;

    if (uniqueness > 0.7) score += 20;
    else if (uniqueness > 0.5) score += 10;

    const questions = (text.match(/\?/g) || []).length;
    if (questions > 0) score += 10;

    const exclamations = (text.match(/!/g) || []).length;
    if (exclamations > 0 && exclamations < 3) score += 5;

    return Math.min(score, 100);
  }

  /**
   * Calculates engagement score
   */
  private static calculateEngagementScore(text: string): number {
    const engagementSignals = [
      'you', 'your', 'you\'ll', 'you\'re',
      'get', 'now', 'today', 'join', 'start',
    ];

    const textLower = text.toLowerCase();
    const matchCount = engagementSignals.filter(sig => textLower.includes(sig)).length;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const questions = sentences.filter(s => s.trim().endsWith('?')).length;

    let score = 50;

    score += matchCount * 8;
    score += questions * 10;

    return Math.min(score, 100);
  }

  /**
   * Checks for required elements in text
   */
  private static checkRequiredElements(
    text: string,
    requiredElements?: string[]
  ): { present: string[]; missing: string[]; score: number } {
    if (!requiredElements || requiredElements.length === 0) {
      return { present: [], missing: [], score: 100 };
    }

    const textLower = text.toLowerCase();
    const present: string[] = [];
    const missing: string[] = [];

    requiredElements.forEach(element => {
      if (textLower.includes(element.toLowerCase())) {
        present.push(element);
      } else {
        missing.push(element);
      }
    });

    const score = requiredElements.length > 0
      ? Math.round((present.length / requiredElements.length) * 100)
      : 100;

    return { present, missing, score };
  }

  /**
   * Counts words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Checks if word count is within limits
   */
  private static checkWordLimit(wordCount: number, limits: { min?: number; max?: number }): boolean {
    if (limits.min && wordCount < limits.min) return false;
    if (limits.max && wordCount > limits.max) return false;
    return true;
  }

  /**
   * Calculates overall score from metrics and checks
   */
  private static calculateOverallScore(
    metrics: { label: string; value: number }[],
    elementChecks: { present: string[]; missing: string[]; score: number },
    withinLimit: boolean
  ): number {
    const metricScores = metrics.map(m => m.value);
    const avgMetricScore = metricScores.reduce((sum, score) => sum + score, 0) / metricScores.length;

    const weights = {
      metrics: 0.7,
      elements: 0.2,
      wordLimit: 0.1,
    };

    const wordLimitScore = withinLimit ? 100 : 70;

    return Math.round(
      avgMetricScore * weights.metrics +
      elementChecks.score * weights.elements +
      wordLimitScore * weights.wordLimit
    );
  }

  /**
   * Generates feedback based on analysis
   */
  private static generateFeedback(
    metrics: { label: string; value: number }[],
    elementChecks: { present: string[]; missing: string[]; score: number },
    wordCount: number,
    limits: { min?: number; max?: number },
    overallScore: number,
    passingScore?: number
  ): string[] {
    const feedback: string[] = [];

    if (passingScore && overallScore >= passingScore) {
      feedback.push('Excellent work! Your copy meets all requirements.');
      return feedback;
    }

    const lowMetrics = metrics.filter(m => m.value < 60);
    if (lowMetrics.length > 0) {
      feedback.push(`Areas to improve: ${lowMetrics.map(m => m.label).join(', ')}.`);
    }

    if (!limits.min || wordCount < limits.min) {
      feedback.push('Consider adding more detail to your copy.');
    } else if (!limits.max || wordCount > limits.max) {
      feedback.push('Try to be more concise.');
    }

    if (elementChecks.missing.length > 0) {
      feedback.push(`Include: ${elementChecks.missing.join(', ')}`);
    }

    if (elementChecks.present.length > 0) {
      feedback.push(`Good inclusion of: ${elementChecks.present.join(', ')}`);
    }

    const highMetrics = metrics.filter(m => m.value >= 80);
    if (highMetrics.length > 0) {
      feedback.push(`Strong ${highMetrics.map(m => m.label.toLowerCase()).join(' and ')}.`);
    }

    if (overallScore < 40) {
      feedback.push('Major revision needed. Review the brief carefully.');
    } else if (overallScore < 70) {
      feedback.push('Good foundation. Refine based on feedback above.');
    }

    return feedback;
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
        metrics: this.METRIC_LABELS.map(label => ({ label, value: 0 })),
        feedback: ['Scoring failed for this copy.'],
        wordCount: 0,
        withinLimit: false,
      };
    });
  }
}
