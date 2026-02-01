import React from 'react';
jest.mock('react-native');
jest.mock('@expo/vector-icons');
import { render } from '@testing-library/react-native';
import { CopyAnalysisView } from '@/features/game/components/CopyAnalysisView';

/** Recursively collect text from React Test Instance tree. */
function getTextFromInstance(inst: unknown): string[] {
  if (inst == null) return [];
  if (typeof inst === 'string') return [inst];
  const node = inst as { children?: unknown[]; props?: { children?: unknown } };
  const children = node.children ?? (Array.isArray(node.props?.children) ? node.props.children : node.props?.children != null ? [node.props.children] : []);
  const list = Array.isArray(children) ? children : [children];
  return list.flatMap((c) => getTextFromInstance(c));
}

function getRenderedText(root: unknown): string {
  return getTextFromInstance(root).join(' ');
}

describe('CopyAnalysisView', () => {
  it('returns null when no copy and no result', () => {
    const { toJSON } = render(
      <CopyAnalysisView copy="" copyResult={null} />
    );
    expect(toJSON()).toBeNull();
  });

  it('returns null when copy is whitespace-only and no result', () => {
    const { toJSON } = render(
      <CopyAnalysisView copy="   " copyResult={null} />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders "Generated copy" section when copy is provided', () => {
    const { root } = render(
      <CopyAnalysisView copy="Buy now and save 20%." copyResult={null} />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Generated copy');
    expect(out).toContain('Buy now and save 20%');
  });

  it('renders word count and "Within limit" when copyResult has withinLimit true', () => {
    const copyResult = {
      score: 80,
      metrics: [],
      feedback: [],
      wordCount: 45,
      withinLimit: true,
    };
    const { root } = render(
      <CopyAnalysisView copy="Some copy text." copyResult={copyResult} />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Word count');
    expect(out).toContain('45');
    expect(out).toContain('words');
    expect(out).toContain('Within limit');
  });

  it('renders "Outside limit" when copyResult has withinLimit false', () => {
    const copyResult = {
      score: 60,
      metrics: [],
      feedback: [],
      wordCount: 500,
      withinLimit: false,
    };
    const { root } = render(
      <CopyAnalysisView copy="Long copy..." copyResult={copyResult} />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Outside limit');
    expect(out).toContain('500');
  });

  it('renders Metrics section when copyResult has metrics', () => {
    const copyResult = {
      score: 75,
      metrics: [
        { label: 'TONE', value: 80 },
        { label: 'CLARITY', value: 70 },
      ],
      feedback: [],
      wordCount: 30,
      withinLimit: true,
    };
    const { root } = render(
      <CopyAnalysisView copy="Copy" copyResult={copyResult} />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Metrics');
    // RadarChart is mocked; metric labels (TONE, CLARITY) are inside the real component
    expect(out).toContain('RadarChart');
  });

  it('renders Requirements with Matched/Missing when requiredElements provided', () => {
    const copyResult = {
      score: 70,
      metrics: [],
      feedback: [],
      wordCount: 25,
      withinLimit: true,
    };
    const { root } = render(
      <CopyAnalysisView
        copy="Use code SAVE10 today"
        copyResult={copyResult}
        requiredElements={['SAVE10', 'expires']}
      />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Requirements');
    expect(out).toContain('SAVE10');
    expect(out).toContain('expires');
    expect(out).toContain('Matched');
    expect(out).toContain('Missing');
  });

  it('renders Feedback section when copyResult has feedback', () => {
    const copyResult = {
      score: 65,
      metrics: [],
      feedback: ['Improve tone.', 'Add a CTA.'],
      wordCount: 40,
      withinLimit: true,
    };
    const { root } = render(
      <CopyAnalysisView copy="Copy" copyResult={copyResult} />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Feedback');
    expect(out).toContain('Improve tone');
    expect(out).toContain('Add a CTA');
  });

  it('renders when no copy but copyResult is set (result-only path)', () => {
    const copyResult = {
      score: 80,
      metrics: [],
      feedback: [],
      wordCount: 10,
      withinLimit: true,
    };
    const { root, toJSON } = render(
      <CopyAnalysisView copy="" copyResult={copyResult} />
    );
    expect(toJSON()).not.toBeNull();
    const out = getRenderedText(root);
    expect(out).toContain('Word count');
    expect(out).toContain('10');
  });

  it('does not render Requirements when requiredElements is empty', () => {
    const copyResult = {
      score: 80,
      metrics: [],
      feedback: [],
      wordCount: 20,
      withinLimit: true,
    };
    const { root } = render(
      <CopyAnalysisView copy="Copy" copyResult={copyResult} requiredElements={[]} />
    );
    const out = getRenderedText(root);
    expect(out).not.toContain('Requirements');
  });
});
