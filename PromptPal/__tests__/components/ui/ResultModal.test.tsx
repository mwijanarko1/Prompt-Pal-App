/**
 * ResultModal tests — S3 scope: Enhanced ResultModal requirements.
 * Covers S3 "done" criteria from jan-25-plan: similarity, test table, radar, Next Level, share.
 */
import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  ResultModal,
  getResultModalSubtitleLabel,
  type ModuleType,
} from '@/components/ui/ResultModal';

jest.mock('react-native');
jest.mock('react-native-svg');
jest.mock('@expo/vector-icons');

/* Jest mock factory runs before imports; require() is the intended API — eslint-disable for that block */
jest.mock('@/components/ui', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Jest mock factory
  const React = require('react');
  const actual = jest.requireActual<typeof import('@/components/ui')>('@/components/ui');
  return {
    ...actual,
    Button: (props: { children: unknown; onPress: () => void }) =>
      React.createElement('Button', { ...props, onPress: props.onPress }, props.children),
    Card: (props: { children: unknown }) => React.createElement('Card', props, props.children),
    RadarChart: () => React.createElement('RadarChart', {}, null),
  };
});

const defaultProps = {
  visible: true,
  score: 85,
  xp: 50,
  onNext: jest.fn(),
  onClose: jest.fn(),
};

describe('ResultModal (S3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getResultModalSubtitleLabel (S3 subtitle by module type)', () => {
    it('returns SIMILARITY SCORE for image module', () => {
      expect(getResultModalSubtitleLabel('image')).toBe('SIMILARITY SCORE');
    });

    it('returns COPY SCORE for copywriting module', () => {
      expect(getResultModalSubtitleLabel('copywriting')).toBe('COPY SCORE');
    });

    it('returns LOGIC VALIDATION for code module', () => {
      expect(getResultModalSubtitleLabel('code')).toBe('LOGIC VALIDATION');
    });

    it('returns LOGIC VALIDATION when moduleType is undefined', () => {
      expect(getResultModalSubtitleLabel(undefined)).toBe('LOGIC VALIDATION');
    });
  });

  describe('ResultModal component (S3 contract)', () => {
    it('is a function component', () => {
      expect(typeof ResultModal).toBe('function');
    });

    it('accepts S3 scoring props: score, xp, moduleType, testCases, copyMetrics, imageSimilarity, imageFeedback, keywordsMatched', () => {
      const element = React.createElement(ResultModal, {
        visible: false,
        score: 85,
        xp: 50,
        onNext: () => {},
        onClose: () => {},
        moduleType: 'image' as ModuleType,
        imageSimilarity: 72,
        imageFeedback: ['Good contrast'],
        keywordsMatched: ['sunset'],
        testCases: [{ name: 'Test 1', passed: true }],
        copyMetrics: [{ label: 'Clarity', value: 80 }],
      });
      expect(element).toBeTruthy();
      expect(element.type).toBe(ResultModal);
      expect(element.props.score).toBe(85);
      expect(element.props.moduleType).toBe('image');
      expect(element.props.imageSimilarity).toBe(72);
      expect(element.props.testCases).toHaveLength(1);
      expect(element.props.copyMetrics).toHaveLength(1);
    });

    it('accepts onShare for share score (S3)', () => {
      const onShare = jest.fn();
      const element = React.createElement(ResultModal, {
        visible: false,
        score: 0,
        xp: 0,
        onNext: () => {},
        onClose: () => {},
        onShare,
      });
      expect(element.props.onShare).toBe(onShare);
    });
  });

  describe('ResultModal rendering (S3 done criteria — plan requirements)', () => {
    it('S3: displays similarity score for image challenges when scoring results provided', () => {
      render(
        <ResultModal
          {...defaultProps}
          moduleType="image"
          imageSimilarity={72}
          imageFeedback={['Good contrast.']}
          keywordsMatched={['sunset', 'beach']}
        />
      );
      expect(screen.getByText(/SIMILARITY SCORE/)).toBeTruthy();
      expect(screen.getByText(/Score breakdown/)).toBeTruthy();
      expect(screen.getByText(/Visual similarity:.*72%/)).toBeTruthy();
      expect(screen.getByText(/Keywords captured/)).toBeTruthy();
      expect(screen.getByText(/sunset, beach/)).toBeTruthy();
      expect(screen.getByText(/Good contrast\./)).toBeTruthy();
    });

    it('S3: shows test results table for code challenges when testCases provided', () => {
      render(
        <ResultModal
          {...defaultProps}
          moduleType="code"
          testCases={[
            { name: 'Test 1', passed: true },
            { name: 'Test 2', passed: false, error: 'Expected 2, got 3' },
          ]}
        />
      );
      expect(screen.getByText(/LOGIC VALIDATION/)).toBeTruthy();
      expect(screen.getByText('Test 1')).toBeTruthy();
      expect(screen.getByText('Test 2')).toBeTruthy();
      expect(screen.getByText('PASSED')).toBeTruthy();
      expect(screen.getByText('FAILED')).toBeTruthy();
      expect(screen.getByText('Expected 2, got 3')).toBeTruthy();
    });

    it('S3: shows radar chart section for copywriting when copyMetrics provided', () => {
      const copyMetrics = [
        { label: 'Clarity', value: 80 },
        { label: 'Tone', value: 90 },
      ];
      render(
        <ResultModal
          {...defaultProps}
          moduleType="copywriting"
          copyMetrics={copyMetrics}
        />
      );
      expect(screen.getByText(/COPY SCORE/)).toBeTruthy();
      expect(screen.getByText('Score breakdown')).toBeTruthy();
    });

    it('S3: shows Next Level button when passed (primary action)', () => {
      render(<ResultModal {...defaultProps} passed={true} />);
      expect(screen.getByText('Next Challenge →')).toBeTruthy();
      fireEvent.press(screen.getByText('Next Challenge →'));
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    it('S3: shows Try Again when failed', () => {
      render(<ResultModal {...defaultProps} passed={false} />);
      expect(screen.getByText('Challenge Failed')).toBeTruthy();
      expect(screen.getByText('Try Again')).toBeTruthy();
    });

    it('S3: share score — button visible and onShare called when pressed', () => {
      const onShare = jest.fn();
      render(<ResultModal {...defaultProps} onShare={onShare} />);
      const shareButton = screen.getByText('Share your score');
      expect(shareButton).toBeTruthy();
      fireEvent.press(shareButton);
      expect(onShare).toHaveBeenCalledTimes(1);
    });

    it('S3: displays score and XP when passed', () => {
      render(<ResultModal {...defaultProps} passed={true} />);
      expect(screen.getByText(/85%/)).toBeTruthy();
      expect(screen.getByText('+50 XP')).toBeTruthy();
      expect(screen.getByText('Challenge Passed!')).toBeTruthy();
    });
  });
});
