import { extractCodeFromMarkdown } from '@/features/game/utils/codeUtils';

describe('extractCodeFromMarkdown', () => {
  it('extracts code from fenced block with language tag', () => {
    const text = 'Here is the code:\n```javascript\nconst x = 1;\n```';
    expect(extractCodeFromMarkdown(text)).toBe('const x = 1;');
  });

  it('extracts code from fenced block without language tag', () => {
    const text = '```\nfunction foo() {}\n```';
    expect(extractCodeFromMarkdown(text)).toBe('function foo() {}');
  });

  it('trims whitespace inside extracted code', () => {
    const text = '```js\n  const a = 1;  \n```';
    expect(extractCodeFromMarkdown(text)).toBe('const a = 1;');
  });

  it('returns trimmed text when no fenced block', () => {
    const text = '  just plain text  ';
    expect(extractCodeFromMarkdown(text)).toBe('just plain text');
  });

  it('returns first fenced block when multiple present', () => {
    const text = '```\nfirst\n```\n```\nsecond\n```';
    expect(extractCodeFromMarkdown(text)).toBe('first');
  });

  it('handles empty string', () => {
    expect(extractCodeFromMarkdown('')).toBe('');
  });

  it('handles empty fenced block', () => {
    expect(extractCodeFromMarkdown('```\n\n```').trim()).toBe('');
  });
});
