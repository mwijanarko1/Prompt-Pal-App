import type { Level } from '../store';

export interface QuestHelpSection {
  title: string;
  items: string[];
}

export interface QuestHelpContent {
  eyebrow: string;
  headline: string;
  summary: string;
  referenceLabel: string;
  sections: QuestHelpSection[];
}

function uniqueItems(items: Array<string | undefined | null>): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => item?.trim())
        .filter((item): item is string => Boolean(item))
    )
  );
}

function getWordLimitLabel(wordLimit?: Level['wordLimit']): string | undefined {
  if (!wordLimit) return undefined;

  const min = wordLimit.min ?? 0;
  const max = wordLimit.max ?? 500;
  return `Stay between ${min} and ${max} words.`;
}

export function buildQuestHelpContent(level: Level, visibleHints: string[]): QuestHelpContent {
  const headline = level.title || 'Challenge Help';
  const passingScoreLabel = `Reach ${level.passingScore}% or higher to clear this challenge.`;

  if (level.type === 'code') {
    return {
      eyebrow: 'CODE CHALLENGE',
      headline,
      summary: 'Use this panel for the success criteria without scrolling back to the instruction card.',
      referenceLabel: 'Instructions',
      sections: [
        {
          title: 'Mission',
          items: uniqueItems([
            level.description || 'Guide the model to return working JavaScript for this challenge.',
          ]),
        },
        {
          title: 'Implementation Checklist',
          items: uniqueItems([
            level.functionName ? `Ask for a function named ${level.functionName}.` : undefined,
            level.language ? `The response must be valid ${level.language}.` : 'The response must be valid JavaScript.',
            'Tell the model what inputs it receives and what it should return.',
            ...(level.promptChecklist ?? []),
            passingScoreLabel,
          ]),
        },
        ...(level.moduleTitle
          ? [
              {
                title: 'Focus Area',
                items: [level.moduleTitle],
              },
            ]
          : []),
        ...(visibleHints.length > 0
          ? [
              {
                title: 'Prompt Signals To Consider',
                items: uniqueItems(visibleHints),
              },
            ]
          : []),
      ],
    };
  }

  if (level.type === 'copywriting') {
    return {
      eyebrow: 'COPY CHALLENGE',
      headline,
      summary: 'Keep the brief requirements in view while you shape the prompt strategy.',
      referenceLabel: 'Brief',
      sections: [
        {
          title: 'Mission',
          items: uniqueItems([
            level.description || 'Write a prompt that leads to stronger conversion-focused copy.',
          ]),
        },
        {
          title: 'Brief Requirements',
          items: uniqueItems([
            level.briefTitle ? `Deliverable: ${level.briefTitle}.` : undefined,
            level.briefTarget ? `Audience: ${level.briefTarget}.` : undefined,
            level.briefTone ? `Tone: ${level.briefTone}.` : undefined,
            level.briefGoal ? `Goal: ${level.briefGoal}.` : undefined,
            getWordLimitLabel(level.wordLimit),
            passingScoreLabel,
          ]),
        },
        ...(level.requiredElements && level.requiredElements.length > 0
          ? [
              {
                title: 'Must Cover',
                items: uniqueItems(level.requiredElements),
              },
            ]
          : []),
        ...((level.promptChecklist?.length ?? 0) > 0 || visibleHints.length > 0
          ? [
              {
                title: 'Prompt Signals To Consider',
                items: uniqueItems([...(level.promptChecklist ?? []), ...visibleHints]),
              },
            ]
          : []),
      ],
    };
  }

  return {
    eyebrow: 'IMAGE CHALLENGE',
    headline,
    summary: 'Use the target image as your reference and describe the shot with clear, concrete visual detail.',
    referenceLabel: 'Target Image',
    sections: [
      {
        title: 'Mission',
        items: uniqueItems([
          level.description || 'Write a prompt that recreates the target image as closely as possible.',
        ]),
      },
      {
        title: 'What Strong Prompts Include',
        items: uniqueItems([
          'Describe the subject, materials, lighting, angle, and background.',
          level.style ? `Keep the visual direction aligned with the ${level.style} style.` : undefined,
          'Be specific enough that the model can reproduce the composition, not just the idea.',
          passingScoreLabel,
        ]),
      },
      ...(visibleHints.length > 0
        ? [
            {
              title: 'Prompt Signals To Consider',
              items: uniqueItems(visibleHints),
            },
          ]
        : []),
    ],
  };
}
