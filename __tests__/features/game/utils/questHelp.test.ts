import { describe, expect, it } from '@jest/globals';
import { buildQuestHelpContent } from '@/features/game/utils/questHelp';

describe('buildQuestHelpContent', () => {
  it('builds code challenge help with checklist and visible hints', () => {
    const content = buildQuestHelpContent(
      {
        id: 'code-1',
        type: 'code',
        title: 'Hello Function',
        difficulty: 'beginner',
        passingScore: 75,
        unlocked: true,
        description: 'Write a prompt to generate a greeting function.',
        functionName: 'createGreeting',
        language: 'javascript',
        moduleTitle: 'JavaScript Basics',
        promptChecklist: ['mention the return format'],
      },
      ['Be specific about the function signature']
    );

    expect(content.eyebrow).toBe('CODE CHALLENGE');
    expect(content.referenceLabel).toBe('Instructions');
    expect(content.sections.find((section) => section.title === 'Implementation Checklist')?.items).toEqual(
      expect.arrayContaining([
        'Ask for a function named createGreeting.',
        'The response must be valid javascript.',
        'mention the return format',
        'Reach 75% or higher to clear this challenge.',
      ])
    );
    expect(content.sections.find((section) => section.title === 'Prompt Signals To Consider')?.items).toEqual([
      'Be specific about the function signature',
    ]);
  });

  it('builds copy challenge help with brief requirements and required elements', () => {
    const content = buildQuestHelpContent(
      {
        id: 'copy-1',
        type: 'copywriting',
        title: 'Water Bottle Headline',
        difficulty: 'beginner',
        passingScore: 80,
        unlocked: true,
        description: 'Create a prompt for a stronger headline.',
        briefTitle: 'Homepage headline',
        briefTarget: 'Health-conscious adults',
        briefTone: 'Energetic and motivating',
        briefGoal: 'Encourage daily water intake',
        wordLimit: { min: 6, max: 12 },
        requiredElements: ['benefit', 'hydration'],
      },
      ['Ask for one clear benefit']
    );

    expect(content.referenceLabel).toBe('Brief');
    expect(content.sections.find((section) => section.title === 'Brief Requirements')?.items).toEqual(
      expect.arrayContaining([
        'Deliverable: Homepage headline.',
        'Audience: Health-conscious adults.',
        'Tone: Energetic and motivating.',
        'Goal: Encourage daily water intake.',
        'Stay between 6 and 12 words.',
      ])
    );
    expect(content.sections.find((section) => section.title === 'Must Cover')?.items).toEqual([
      'benefit',
      'hydration',
    ]);
  });

  it('builds image challenge help without leaking hidden keywords', () => {
    const content = buildQuestHelpContent(
      {
        id: 'image-1',
        type: 'image',
        title: 'Brass Key',
        difficulty: 'beginner',
        passingScore: 75,
        unlocked: true,
        description: 'Recreate the target image.',
        style: 'Realistic',
        hiddenPromptKeywords: ['brass', 'velvet'],
      },
      ['Mention lighting and angle']
    );

    expect(content.eyebrow).toBe('IMAGE CHALLENGE');
    expect(content.sections.find((section) => section.title === 'What Strong Prompts Include')?.items).toEqual(
      expect.arrayContaining([
        'Keep the visual direction aligned with the Realistic style.',
      ])
    );
    expect(JSON.stringify(content)).not.toContain('brass');
    expect(JSON.stringify(content)).not.toContain('velvet');
  });
});
