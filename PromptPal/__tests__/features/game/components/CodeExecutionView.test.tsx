import React from 'react';
jest.mock('react-native');
jest.mock('@expo/vector-icons');
import { render } from '@testing-library/react-native';
import { CodeExecutionView } from '@/features/game/components/CodeExecutionView';

/** Recursively collect text from React Test Instance tree (strings and instance children). */
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

describe('CodeExecutionView', () => {
  it('returns null when no code and no result content', () => {
    const { toJSON } = render(
      <CodeExecutionView code="" executionResult={null} language="javascript" />
    );
    expect(toJSON()).toBeNull();
  });

  it('returns null when code is whitespace-only and no result', () => {
    const { toJSON } = render(
      <CodeExecutionView code="   " executionResult={null} language="javascript" />
    );
    expect(toJSON()).toBeNull();
  });

  it('renders "Generated code" section when code is provided', () => {
    const { root } = render(
      <CodeExecutionView
        code="const x = 1;"
        executionResult={null}
        language="javascript"
      />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Generated code');
    expect(out).toContain('const');
    expect(out).toContain('x');
    expect(out).toContain('1');
  });

  it('renders error card with message when executionResult has error', () => {
    const executionResult = {
      testResults: [],
      output: '',
      success: false,
      error: 'Syntax error in code',
    };
    const { root } = render(
      <CodeExecutionView
        code="broken code"
        executionResult={executionResult}
        language="javascript"
      />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Error');
    expect(out).toContain('Syntax error in code');
  });

  it('renders test results with names and Pass/Fail labels', () => {
    const executionResult = {
      testResults: [
        { id: '1', name: 'Basic sum', passed: true },
        { id: '2', name: 'Negative numbers', passed: false },
      ],
      output: '',
      success: false,
    };
    const { root } = render(
      <CodeExecutionView
        code="function sum(a,b){ return a+b; }"
        executionResult={executionResult}
        language="javascript"
      />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Test results');
    expect(out).toContain('Basic sum');
    expect(out).toContain('Negative numbers');
    expect(out).toContain('Pass');
    expect(out).toContain('Fail');
  });

  it('renders output section when executionResult has output', () => {
    const executionResult = {
      testResults: [],
      output: 'Tests completed',
      success: true,
    };
    const { root } = render(
      <CodeExecutionView
        code="const x = 1;"
        executionResult={executionResult}
        language="javascript"
      />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Output');
    expect(out).toContain('Tests completed');
  });

  it('renders when no code but executionResult has content (hasResult path)', () => {
    const executionResult = {
      testResults: [{ id: '1', name: 'Only test', passed: true }],
      output: '',
      success: true,
    };
    const { root, toJSON } = render(
      <CodeExecutionView code="" executionResult={executionResult} language="javascript" />
    );
    expect(toJSON()).not.toBeNull();
    const out = getRenderedText(root);
    expect(out).toContain('Test results');
    expect(out).toContain('Only test');
    expect(out).toContain('Pass');
  });

  it('renders code with Python keywords when language is python', () => {
    const { root } = render(
      <CodeExecutionView
        code="def foo(): return True"
        executionResult={null}
        language="python"
      />
    );
    const out = getRenderedText(root);
    expect(out).toContain('Generated code');
    expect(out).toContain('def');
    expect(out).toContain('return');
    expect(out).toContain('True');
  });

  it('does not render Output when output is empty string', () => {
    const executionResult = {
      testResults: [{ id: '1', name: 'T', passed: true }],
      output: '',
      success: true,
    };
    const { root } = render(
      <CodeExecutionView
        code="x"
        executionResult={executionResult}
        language="javascript"
      />
    );
    const out = getRenderedText(root);
    expect(out).not.toContain('Output');
  });
});
