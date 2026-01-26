/**
 * NanoAssistant - AI-powered hint system for PromptPal
 * 
 * Provides contextual hints based on:
 * - Current user prompt
 * - Module type (image/code/copy)
 * - Level difficulty
 * - Hidden keywords (for image modules)
 * 
 * Features:
 * - Hint cooldown to prevent spam
 * - Hint tracking per level (affects scoring)
 */

import { Level, ChallengeType } from '@/features/game/store';
import { AIProxyClient } from './aiProxy';
import { rateLimiter } from './rateLimiter';
import { logger } from './logger';

// Constants
const HINT_COOLDOWN_MS = 30000; // 30 seconds between hints
const HINT_RATE_LIMIT_KEY = 'nano-assistant-hints';
const MAX_HINTS_PER_MINUTE = 3;

// Flat penalty rate (same for all difficulties)
const FLAT_HINT_PENALTY = 5; // 5% per hint after the first free one

/**
 * Get maximum hints allowed based on difficulty
 * Harder difficulties = fewer hints available
 */
function getMaxHintsForDifficulty(difficulty: Level['difficulty'] = 'intermediate'): number {
  switch (difficulty) {
    case 'beginner':
      return 5; // Most hints for new players
    case 'intermediate':
      return 4; // Moderate hints
    case 'advanced':
      return 3; // Fewest hints for experienced players
    default:
      return 4;
  }
}

// In-memory storage for hint counts per level
const hintCountsByLevel: Map<string, number> = new Map();

// Last hint timestamp for cooldown
let lastHintTimestamp = 0;

/**
 * Generate a system prompt for the AI based on module type and difficulty
 */
function buildSystemPrompt(
  moduleType: ChallengeType,
  difficulty: Level['difficulty'],
  levelData: Level
): string {
  const difficultyContext = {
    beginner: 'Give clear, direct hints that guide the user step by step.',
    intermediate: 'Give moderate hints that point in the right direction without giving away the answer.',
    advanced: 'Give subtle hints that encourage critical thinking. Be cryptic but helpful.',
  };

  const basePrompt = `You are NanoAssistant, a helpful AI tutor for prompt engineering. 
Your role is to help users improve their prompts without giving away the exact answer.
Difficulty level: ${difficulty}. ${difficultyContext[difficulty]}
Keep hints concise (1-2 sentences max).`;

  switch (moduleType) {
    case 'image': {
      const keywordsHint = levelData.hiddenPromptKeywords?.length 
        ? `The target image contains elements related to: ${levelData.hiddenPromptKeywords.slice(0, 2).join(', ')}... (and more)`
        : '';
      return `${basePrompt}
This is an IMAGE GENERATION challenge. The user needs to write a prompt that generates an image similar to a target.
${keywordsHint}
${levelData.style ? `The desired style is: ${levelData.style}` : ''}
Focus hints on: composition, style, mood, specific elements, or artistic techniques.`;
    }

    case 'code':
      return `${basePrompt}
This is a CODE GENERATION challenge. The user needs to write a prompt that instructs an AI to generate code.
${levelData.requirementBrief ? `The requirement: ${levelData.requirementBrief}` : ''}
${levelData.language ? `Target language: ${levelData.language}` : ''}
Focus hints on: clarity of requirements, edge cases, function signatures, or algorithmic approach.`;

    case 'copywriting':
      return `${basePrompt}
This is a COPYWRITING challenge. The user needs to write a prompt for marketing/persuasive content.
${levelData.briefProduct ? `Product: ${levelData.briefProduct}` : ''}
${levelData.briefTarget ? `Target audience: ${levelData.briefTarget}` : ''}
${levelData.briefTone ? `Desired tone: ${levelData.briefTone}` : ''}
Focus hints on: audience engagement, tone, call-to-action, or persuasive techniques.`;

    default:
      return basePrompt;
  }
}

/**
 * Build the user message for hint generation
 */
function buildUserMessage(currentPrompt: string, moduleType: ChallengeType): string {
  if (!currentPrompt.trim()) {
    return `I haven't written anything yet. Can you give me a hint on how to start my ${moduleType} prompt?`;
  }
  
  return `Here's my current prompt attempt:
"${currentPrompt}"

Can you give me a hint on how to improve it? Don't give me the answer directly.`;
}

/**
 * Build all hints for a level (returns exactly 5 unique hints)
 */
function buildAllHints(
  moduleType: ChallengeType,
  levelData: Level
): string[] {
  const allHints: string[] = [];
  
  if (moduleType === 'image') {
    // General hints (always available)
    allHints.push(
      'Start by describing the main subject - what is the central focus of the image?',
      'Think about the setting first. Where does this scene take place?',
      'Consider the mood you want to create. Is it calm, energetic, mysterious?',
      'Try describing colors, lighting, or atmosphere in more detail.',
      'Add visual details - what textures or materials are visible?',
    );
    
    // Level-specific hints
    if (levelData.hiddenPromptKeywords?.length) {
      const keywords = levelData.hiddenPromptKeywords;
      if (keywords[0]) allHints.push(`The target image has something related to "${keywords[0]}" - is this in your prompt?`);
      if (keywords[1]) allHints.push(`Consider adding elements related to "${keywords[1]}" to your description.`);
    }
    
    if (levelData.style) {
      allHints.push(`Make sure your prompt captures the "${levelData.style}" style.`);
    }
    
    allHints.push(
      'Check if you\'ve described the lighting - natural light, sunset, studio lighting?',
      'Try adding camera perspective details - eye level, bird\'s eye, low angle?',
    );
  } else if (moduleType === 'code') {
    allHints.push(
      'Start by stating the main purpose of the code you need.',
      'Define what inputs the code should accept and what outputs it should produce.',
      'Be specific about edge cases the code should handle.',
      'Mention the expected data types for inputs and outputs.',
      'Specify if you need error handling or validation.',
    );
    
    if (levelData.requirementBrief) {
      allHints.push(`Re-read the requirement: "${levelData.requirementBrief.slice(0, 50)}..." - are all parts addressed?`);
    }
    if (levelData.language) {
      allHints.push(`Remember to use ${levelData.language}-specific conventions and best practices.`);
    }
    
    allHints.push(
      'Have you specified the exact function name or method signature needed?',
      'Consider mentioning what libraries or imports might be used.',
      'Specify the expected behavior for invalid inputs.',
    );
  } else if (moduleType === 'copywriting') {
    allHints.push(
      'Start by identifying the key benefit for the target audience.',
      'Think about what emotion you want to evoke in the reader.',
      'Include what action you want readers to take (the CTA).',
      'Consider the tone - professional, casual, urgent, friendly?',
      'Think about social proof - testimonials, numbers, credibility.',
    );
    
    if (levelData.briefProduct) {
      allHints.push(`Make sure your prompt highlights key features of "${levelData.briefProduct}".`);
    }
    if (levelData.briefTarget) {
      allHints.push(`Remember your audience is: ${levelData.briefTarget}. Speak to their needs.`);
    }
    if (levelData.briefTone) {
      allHints.push(`The tone should be "${levelData.briefTone}" - is your prompt reflecting that?`);
    }
    
    allHints.push(
      'Consider adding urgency or scarcity elements.',
      'Make sure there\'s a clear value proposition.',
    );
  } else {
    // Generic fallback
    allHints.push(
      'Be more specific about the details you want in the output.',
      'Consider what makes your target unique and distinctive.',
      'Add context about the style, tone, or format you need.',
      'Think about breaking down your request into clearer parts.',
      'Specify any constraints or requirements that must be met.',
    );
  }
  
  // Return exactly 5 hints (or all if less than 5)
  return allHints.slice(0, Math.max(5, allHints.length));
}

/**
 * Generate fallback hints when AI is unavailable
 * Returns the Nth hint for this level (based on how many hints have been used)
 */
function getFallbackHint(
  currentPrompt: string,
  moduleType: ChallengeType,
  levelData: Level
): string {
  const levelId = levelData.id;
  const hintNumber = hintCountsByLevel.get(levelId) || 1; // 1-indexed (already incremented)
  
  // Build all hints for this level
  const allHints = buildAllHints(moduleType, levelData);
  
  // Return the hint at the current position (0-indexed, so hintNumber - 1)
  const hintIndex = Math.min(hintNumber - 1, allHints.length - 1);
  return allHints[hintIndex];
}

/**
 * NanoAssistant class - Main interface for the hint system
 */
export class NanoAssistant {
  /**
   * Get a contextual hint based on the current prompt and level
   * 
   * @param currentPrompt - The user's current prompt text
   * @param moduleType - The type of challenge (image/code/copy)
   * @param levelData - The level configuration
   * @returns A helpful hint string
   * @throws Error if rate limited or on cooldown
   */
  static async getHint(
    currentPrompt: string,
    moduleType: ChallengeType,
    levelData: Level
  ): Promise<string> {
    const levelId = levelData.id;
    const currentCount = hintCountsByLevel.get(levelId) || 0;
    const maxHints = getMaxHintsForDifficulty(levelData.difficulty);
    
    // Check if max hints reached for this level
    if (currentCount >= maxHints) {
      throw new Error(`You've used all ${maxHints} hints for this level. Try your best with what you have!`);
    }
    
    // Check cooldown
    const now = Date.now();
    const timeSinceLastHint = now - lastHintTimestamp;
    
    if (timeSinceLastHint < HINT_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((HINT_COOLDOWN_MS - timeSinceLastHint) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting another hint.`);
    }

    // Check rate limit
    if (!rateLimiter.isAllowed(HINT_RATE_LIMIT_KEY, MAX_HINTS_PER_MINUTE, 60000)) {
      throw new Error('You\'ve used too many hints. Please wait a minute before trying again.');
    }

    // Update timestamp and increment hint count
    lastHintTimestamp = now;
    hintCountsByLevel.set(levelId, currentCount + 1);

    logger.info('NanoAssistant', 'Generating hint', {
      levelId,
      moduleType,
      promptLength: currentPrompt.length,
      hintsUsed: currentCount + 1,
    });

    try {
      // Build prompts for AI
      const systemPrompt = buildSystemPrompt(moduleType, levelData.difficulty, levelData);
      const userMessage = buildUserMessage(currentPrompt, moduleType);

      // Try to get AI-generated hint
      const response = await AIProxyClient.generateText(
        userMessage,
        systemPrompt
      );

      if (response.result) {
        return response.result;
      }

      // Fallback if AI returns empty
      return getFallbackHint(currentPrompt, moduleType, levelData);
    } catch (error) {
      logger.warn('NanoAssistant', 'AI hint generation failed, using fallback', { error });
      
      // Return fallback hint if AI fails
      return getFallbackHint(currentPrompt, moduleType, levelData);
    }
  }

  /**
   * Get the number of hints used for a specific level
   * 
   * @param levelId - The level ID to check
   * @returns Number of hints used
   */
  static getHintsUsed(levelId: string): number {
    return hintCountsByLevel.get(levelId) || 0;
  }

  /**
   * Reset hint count for a level (call when restarting a level)
   * 
   * @param levelId - The level ID to reset
   */
  static resetHintsForLevel(levelId: string): void {
    hintCountsByLevel.delete(levelId);
    logger.debug('NanoAssistant', 'Reset hints for level', { levelId });
  }

  /**
   * Reset all hint counts (call when resetting game progress)
   */
  static resetAllHints(): void {
    hintCountsByLevel.clear();
    lastHintTimestamp = 0;
    logger.debug('NanoAssistant', 'Reset all hints');
  }

  /**
   * Get cooldown status
   * 
   * @returns Object with cooldown info
   */
  static getCooldownStatus(): { isOnCooldown: boolean; remainingMs: number } {
    const now = Date.now();
    const timeSinceLastHint = now - lastHintTimestamp;
    const isOnCooldown = timeSinceLastHint < HINT_COOLDOWN_MS;
    const remainingMs = isOnCooldown ? HINT_COOLDOWN_MS - timeSinceLastHint : 0;

    return { isOnCooldown, remainingMs };
  }

  /**
   * Get maximum hints allowed per level based on difficulty
   * 
   * @param difficulty - Level difficulty (beginner: 5, intermediate: 4, advanced: 3)
   */
  static getMaxHintsPerLevel(difficulty: Level['difficulty'] = 'intermediate'): number {
    return getMaxHintsForDifficulty(difficulty);
  }

  /**
   * Check if more hints are available for a level
   * 
   * @param levelId - The level ID to check
   * @param difficulty - Level difficulty
   * @returns True if hints are still available
   */
  static hasHintsRemaining(levelId: string, difficulty: Level['difficulty'] = 'intermediate'): boolean {
    const used = hintCountsByLevel.get(levelId) || 0;
    const maxHints = getMaxHintsForDifficulty(difficulty);
    return used < maxHints;
  }

  /**
   * Get remaining hints for a level
   * 
   * @param levelId - The level ID to check
   * @param difficulty - Level difficulty
   * @returns Number of hints remaining
   */
  static getHintsRemaining(levelId: string, difficulty: Level['difficulty'] = 'intermediate'): number {
    const used = hintCountsByLevel.get(levelId) || 0;
    const maxHints = getMaxHintsForDifficulty(difficulty);
    return Math.max(0, maxHints - used);
  }

  /**
   * Get the flat-rate penalty percentages (same for all difficulties)
   * 
   * Flat rate system: First hint is FREE, then 5% per hint
   * Difficulty scaling is handled by hint COUNT instead:
   * - Beginner: 5 hints available (max 20% penalty)
   * - Intermediate: 4 hints available (max 15% penalty)
   * - Advanced: 3 hints available (max 10% penalty)
   * 
   * @param difficulty - The level difficulty (used to determine array length)
   * @returns Array of penalty percentages for each hint
   */
  static getProgressivePenalties(difficulty: Level['difficulty'] = 'intermediate'): number[] {
    const maxHints = getMaxHintsForDifficulty(difficulty);
    // First hint free (0%), then flat 5% for each subsequent hint
    const penalties = [0];
    for (let i = 1; i < maxHints; i++) {
      penalties.push(FLAT_HINT_PENALTY);
    }
    return penalties;
  }

  /**
   * Calculate total penalty percentage based on hints used and difficulty
   * 
   * @param hintsUsed - Number of hints used
   * @param difficulty - Level difficulty
   * @returns Total penalty percentage
   */
  static calculatePenaltyPercentage(
    hintsUsed: number, 
    difficulty: Level['difficulty'] = 'intermediate'
  ): number {
    if (hintsUsed === 0) return 0;
    
    const penalties = NanoAssistant.getProgressivePenalties(difficulty);
    let totalPenalty = 0;
    
    for (let i = 0; i < Math.min(hintsUsed, penalties.length); i++) {
      totalPenalty += penalties[i];
    }
    
    return totalPenalty;
  }

  /**
   * Calculate score penalty based on hints used
   * 
   * The penalty system is designed to:
   * 1. First hint is FREE - encourages trying hints without fear
   * 2. Progressive penalties - each subsequent hint costs more
   * 3. Difficulty scaling - beginner has lighter penalties than advanced
   * 4. Never prevents a pass if user would have passed without hints
   * 
   * @param levelId - The level ID
   * @param baseScore - The base score before penalty
   * @param passingScore - Optional passing threshold to ensure hints don't block a pass
   * @param difficulty - Level difficulty for scaling penalties
   * @returns Adjusted score after hint penalty
   */
  static calculateScoreWithHintPenalty(
    levelId: string, 
    baseScore: number, 
    passingScore?: number,
    difficulty: Level['difficulty'] = 'intermediate'
  ): number {
    const hintsUsed = NanoAssistant.getHintsUsed(levelId);
    
    if (hintsUsed === 0) {
      return Math.round(baseScore);
    }
    
    // Calculate progressive penalty based on difficulty
    const penaltyPercentage = NanoAssistant.calculatePenaltyPercentage(hintsUsed, difficulty);
    const penalty = baseScore * (penaltyPercentage / 100);
    let adjustedScore = baseScore - penalty;
    
    // If passing score is provided, ensure hints don't prevent a deserved pass
    // User still gets penalized, but score won't drop below passing if they earned it
    if (passingScore !== undefined && baseScore >= passingScore) {
      adjustedScore = Math.max(adjustedScore, passingScore);
    }
    
    return Math.round(adjustedScore);
  }

  /**
   * Get detailed penalty information for UI display
   * 
   * @param levelId - The level ID
   * @param baseScore - The base score before penalty
   * @param passingScore - The passing threshold
   * @param difficulty - Level difficulty
   * @returns Object with penalty details
   */
  static getPenaltyDetails(
    levelId: string, 
    baseScore: number, 
    passingScore: number,
    difficulty: Level['difficulty'] = 'intermediate'
  ): {
    hintsUsed: number;
    penaltyPercentage: number;
    penaltyPoints: number;
    finalScore: number;
    wouldHavePassed: boolean;
    passProtected: boolean;
    penalties: number[];
    difficulty: Level['difficulty'];
  } {
    const hintsUsed = NanoAssistant.getHintsUsed(levelId);
    const penalties = NanoAssistant.getProgressivePenalties(difficulty);
    const penaltyPercentage = NanoAssistant.calculatePenaltyPercentage(hintsUsed, difficulty);
    const penaltyPoints = Math.round(baseScore * (penaltyPercentage / 100));
    const rawAdjustedScore = baseScore - penaltyPoints;
    const finalScore = NanoAssistant.calculateScoreWithHintPenalty(levelId, baseScore, passingScore, difficulty);
    const wouldHavePassed = baseScore >= passingScore;
    const passProtected = wouldHavePassed && rawAdjustedScore < passingScore;
    
    return {
      hintsUsed,
      penaltyPercentage,
      penaltyPoints,
      finalScore,
      wouldHavePassed,
      passProtected,
      penalties, // Array of individual hint penalties
      difficulty,
    };
  }
  
  /**
   * Get a dynamic description of the next hint's penalty
   * 
   * @param levelId - The level ID
   * @param difficulty - Level difficulty
   * @returns Description string for the next hint
   */
  static getNextHintPenaltyDescription(levelId: string, difficulty: Level['difficulty'] = 'intermediate'): string {
    const hintsUsed = NanoAssistant.getHintsUsed(levelId);
    const maxHints = getMaxHintsForDifficulty(difficulty);
    const penalties = NanoAssistant.getProgressivePenalties(difficulty);
    
    // No more hints available - show total penalty
    if (hintsUsed >= maxHints) {
      const totalPenalty = NanoAssistant.calculatePenaltyPercentage(hintsUsed, difficulty);
      return `Total penalty: -${totalPenalty}% from score`;
    }
    
    const nextPenalty = penalties[hintsUsed] || 0;
    
    if (nextPenalty === 0) {
      return 'Next hint is free!';
    }
    
    // Calculate current total penalty
    const currentTotal = NanoAssistant.calculatePenaltyPercentage(hintsUsed, difficulty);
    
    // Show current accumulated penalty (flat rate makes this clear)
    if (currentTotal === 0) {
      return `Next hint: -${nextPenalty}% from score`;
    }
    
    const newTotal = currentTotal + nextPenalty;
    return `Current: -${currentTotal}% | Next: -${newTotal}% total`;
  }
}

export default NanoAssistant;
