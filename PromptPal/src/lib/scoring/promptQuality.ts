export interface PromptQualityAssessment {
  score: number;
  parrotPenalty: number;
  checklistCoverage: number;
  strategicSignalCoverage: number;
  feedback: string[];
}

interface PromptQualityInput {
  userPrompt: string;
  publicReferences: Array<string | undefined>;
  checklist?: string[];
  strategicSignals: string[];
  domain: 'code' | 'copy';
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has',
  'have', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'of', 'on', 'or', 'that',
  'the', 'their', 'then', 'this', 'to', 'with', 'write', 'create', 'generate',
  'make', 'your', 'you', 'use',
]);

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
}

function uniqueTokens(text: string): Set<string> {
  return new Set(tokenize(text));
}

function coverage(source: Set<string>, target: Set<string>): number {
  if (target.size === 0) return 0;
  let matches = 0;
  target.forEach(token => {
    if (source.has(token)) matches += 1;
  });
  return matches / target.size;
}

function matchesChecklistItem(promptText: string, promptTokens: Set<string>, item: string): boolean {
  const normalizedItem = item.trim().toLowerCase();
  if (!normalizedItem) return false;
  if (promptText.includes(normalizedItem)) return true;

  const itemTokens = uniqueTokens(item);
  if (itemTokens.size === 0) return false;

  return coverage(promptTokens, itemTokens) >= 0.6;
}

function assessPromptQuality({
  userPrompt,
  publicReferences,
  checklist,
  strategicSignals,
  domain,
}: PromptQualityInput): PromptQualityAssessment {
  const promptText = userPrompt.trim().toLowerCase();
  const promptTokens = uniqueTokens(promptText);
  const referenceTokens = uniqueTokens(publicReferences.filter(Boolean).join(' '));

  const overlap = coverage(promptTokens, referenceTokens);
  const checklistItems = checklist?.filter(Boolean) ?? [];
  const matchedChecklist = checklistItems.filter(item =>
    matchesChecklistItem(promptText, promptTokens, item)
  );
  const matchedSignals = strategicSignals.filter(signal =>
    matchesChecklistItem(promptText, promptTokens, signal)
  );

  const promptLengthBonus = clamp((promptTokens.size - 8) * 3, 0, 15);
  const checklistCoverage = checklistItems.length > 0
    ? Math.round((matchedChecklist.length / checklistItems.length) * 100)
    : 60;
  const strategicSignalCoverage = strategicSignals.length > 0
    ? Math.round((matchedSignals.length / strategicSignals.length) * 100)
    : 60;

  const parrotPenalty = overlap >= 0.78 && promptTokens.size <= referenceTokens.size * 1.35
    ? 35
    : overlap >= 0.6
      ? 15
      : 0;

  const score = clamp(
    38 +
      checklistCoverage * 0.32 +
      strategicSignalCoverage * 0.2 +
      promptLengthBonus -
      parrotPenalty
  );

  const feedback: string[] = [];

  if (promptTokens.size < 8) {
    feedback.push(
      domain === 'code'
        ? 'Your prompt is too thin. Add concrete instructions, constraints, and edge cases.'
        : 'Your prompt is too thin. Add audience, tone, and structure guidance.'
    );
  }

  if (parrotPenalty > 0) {
    feedback.push(
      domain === 'code'
        ? 'Your prompt mostly repeats the on-screen brief. Add implementation constraints and failure cases.'
        : 'Your prompt mostly repeats the brief. Add messaging strategy, structure, and persuasion guidance.'
    );
  }

  if (checklistCoverage < 55) {
    feedback.push(
      domain === 'code'
        ? 'Ask for more of the success criteria explicitly instead of relying on the model to infer them.'
        : 'Be more explicit about the messaging requirements you want the model to satisfy.'
    );
  }

  if (strategicSignalCoverage < 45) {
    feedback.push(
      domain === 'code'
        ? 'Mention output format, constraints, and how to handle tricky inputs.'
        : 'Mention audience, tone, CTA, and how the copy should be structured.'
    );
  }

  return {
    score,
    parrotPenalty,
    checklistCoverage,
    strategicSignalCoverage,
    feedback,
  };
}

export function assessCodePromptQuality(input: {
  userPrompt: string;
  publicReferences: Array<string | undefined>;
  checklist?: string[];
}): PromptQualityAssessment {
  return assessPromptQuality({
    ...input,
    domain: 'code',
    strategicSignals: [
      'edge case',
      'handle empty',
      'return',
      'javascript',
      'function',
      'valid',
      'no imports',
      'example',
    ],
  });
}

export function assessCopyPromptQuality(input: {
  userPrompt: string;
  publicReferences: Array<string | undefined>;
  checklist?: string[];
}): PromptQualityAssessment {
  return assessPromptQuality({
    ...input,
    domain: 'copy',
    strategicSignals: [
      'audience',
      'tone',
      'benefit',
      'call to action',
      'cta',
      'headline',
      'structure',
      'objection',
      'variant',
      'persona',
    ],
  });
}
