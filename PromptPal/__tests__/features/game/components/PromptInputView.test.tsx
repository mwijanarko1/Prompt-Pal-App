/**
 * Unit tests for PromptInputView (S2).
 * Covers S2 requirements: character/token counting, hint button, collapsible hints,
 * loading state, validation feedback, max length, module labels.
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { PromptInputView } from '@/features/game/components/PromptInputView';
import type { Level } from '@/features/game/store';

const mockLevel: Level = {
  id: 'level-1',
  difficulty: 'intermediate',
  passingScore: 70,
  unlocked: true,
};

jest.mock('@/lib/nanoAssistant', () => ({
  NanoAssistant: {
    getCooldownStatus: jest.fn(() => ({ isOnCooldown: false, remainingMs: 0 })),
    getHintsRemaining: jest.fn(() => 4),
    getMaxHintsPerLevel: jest.fn(() => 4),
    getHintsUsed: jest.fn(() => 0),
    getHint: jest.fn(() => Promise.resolve('Try adding more detail.')),
    resetHintsForLevel: jest.fn(),
    getNextHintPenaltyDescription: jest.fn(() => 'Next hint: -5% score'),
  },
}));

/* eslint-disable @typescript-eslint/no-require-imports -- Jest mock factory */
jest.mock('@/components/ui', () => {
  const React = require('react');
  const { TextInput, View, Text, TouchableOpacity } = require('react-native');
  return {
    Input: (props: { value: string; onChangeText: (t: string) => void; placeholder?: string }) =>
      React.createElement(TextInput, {
        value: props.value,
        onChangeText: props.onChangeText,
        placeholder: props.placeholder,
        testID: 'prompt-input',
      }),
    Card: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    Badge: ({ label }: { label: string }) => React.createElement(Text, null, label),
    Button: ({ children, onPress, disabled }: { children: React.ReactNode; onPress: () => void; disabled?: boolean }) =>
      React.createElement(TouchableOpacity, { onPress: () => { if (!disabled) onPress(); } }, children),
  };
});

describe('PromptInputView (S2)', () => {
  const defaultProps = {
    value: '',
    onChangeText: jest.fn(),
    onGenerate: jest.fn(),
    level: mockLevel,
    moduleType: 'image' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { NanoAssistant } = require('@/lib/nanoAssistant');
    NanoAssistant.getCooldownStatus.mockReturnValue({ isOnCooldown: false, remainingMs: 0 });
    NanoAssistant.getHintsRemaining.mockReturnValue(4);
    NanoAssistant.getMaxHintsPerLevel.mockReturnValue(4);
    NanoAssistant.getHintsUsed.mockReturnValue(0);
    NanoAssistant.getHint.mockResolvedValue('Try adding more detail.');
    NanoAssistant.getNextHintPenaltyDescription.mockReturnValue('Next hint: -5% score');
  });

  describe('S2: Standalone prompt input', () => {
    it('renders prompt input with placeholder', () => {
      render(<PromptInputView {...defaultProps} placeholder="Type your prompt" />);
      expect(screen.getByPlaceholderText('Type your prompt')).toBeTruthy();
    });

    it('calls onChangeText when user types (within limit)', () => {
      const onChangeText = jest.fn();
      render(<PromptInputView {...defaultProps} value="" onChangeText={onChangeText} />);
      const input = screen.getByPlaceholderText('Enter your prompt here...');
      fireEvent.changeText(input, 'hello');
      expect(onChangeText).toHaveBeenCalledWith('hello');
    });
  });

  describe('S2: Character and token counting', () => {
    it('displays 0 chars and 0 tokens when value is empty', () => {
      render(<PromptInputView {...defaultProps} value="" />);
      expect(screen.getByText('0 chars')).toBeTruthy();
      expect(screen.getByText('0 tokens')).toBeTruthy();
    });

    it('displays correct character count', () => {
      render(<PromptInputView {...defaultProps} value="hello" />);
      expect(screen.getByText('5 chars')).toBeTruthy();
    });

    it('displays approximate token count (~4 chars per token)', () => {
      render(<PromptInputView {...defaultProps} value="hello world" />);
      // 11 chars -> ceil(11/4) = 3 tokens
      expect(screen.getByText('3 tokens')).toBeTruthy();
    });
  });

  describe('S2: Hint button with NanoAssistant integration', () => {
    it('shows Free Hint when no hints used', () => {
      render(<PromptInputView {...defaultProps} />);
      expect(screen.getByText('Free Hint')).toBeTruthy();
    });

    it('shows Hint (n/m) when some hints used', () => {
      const { NanoAssistant } = require('@/lib/nanoAssistant');
      NanoAssistant.getHintsUsed.mockReturnValue(1);
      NanoAssistant.getHintsRemaining.mockReturnValue(3);
      render(<PromptInputView {...defaultProps} />);
      expect(screen.getByText('Hint (3/4)')).toBeTruthy();
    });

    it('shows No hints left when hints remaining is 0', () => {
      const { NanoAssistant } = require('@/lib/nanoAssistant');
      NanoAssistant.getHintsRemaining.mockReturnValue(0);
      render(<PromptInputView {...defaultProps} />);
      expect(screen.getByText('No hints left')).toBeTruthy();
    });
  });

  describe('S2: Collapsible hint display area', () => {
    it('does not show hints card when hints array is empty', () => {
      render(<PromptInputView {...defaultProps} />);
      expect(screen.queryByText(/Hints \(\d+\)/)).toBeNull();
    });

    it('shows Hints (n) and toggle when hints are present (after getHint)', async () => {
      const { NanoAssistant } = require('@/lib/nanoAssistant');
      NanoAssistant.getHint.mockResolvedValue('Try adding lighting details.');
      render(<PromptInputView {...defaultProps} value="a cat" />);
      const hintButton = screen.getByText('Free Hint');
      fireEvent.press(hintButton);
      await screen.findByText('Hints (1)');
      expect(screen.getByText('▲ Hide')).toBeTruthy();
      expect(screen.getByText('Try adding lighting details.')).toBeTruthy();
      fireEvent.press(screen.getByText('▲ Hide'));
      expect(screen.getByText('▼ Show')).toBeTruthy();
    }, 5000);
  });

  describe('S2: Loading state during generation', () => {
    it('generate button is disabled when value is empty', () => {
      render(<PromptInputView {...defaultProps} value="" />);
      const button = screen.getByText('Generate & Compare');
      expect(button).toBeTruthy();
      fireEvent.press(button);
      expect(defaultProps.onGenerate).not.toHaveBeenCalled();
    });

    it('generate button is disabled when value is only whitespace', () => {
      render(<PromptInputView {...defaultProps} value="   " />);
      const button = screen.getByText('Generate & Compare');
      fireEvent.press(button);
      expect(defaultProps.onGenerate).not.toHaveBeenCalled();
    });

    it('calls onGenerate when generate button pressed with non-empty value', () => {
      const onGenerate = jest.fn();
      render(<PromptInputView {...defaultProps} value="a sunset" onGenerate={onGenerate} />);
      const button = screen.getByText('Generate & Compare');
      fireEvent.press(button);
      expect(onGenerate).toHaveBeenCalledTimes(1);
    });

    it('shows Generate for code/copywriting module type', () => {
      render(<PromptInputView {...defaultProps} moduleType="code" />);
      expect(screen.getByText('Generate')).toBeTruthy();
    });
  });

  describe('S2: Validation feedback', () => {
    it('displays error message when error prop is set', () => {
      render(<PromptInputView {...defaultProps} error="Prompt is too short" />);
      expect(screen.getByText('Prompt is too short')).toBeTruthy();
    });

    it('does not show error block when error is not set', () => {
      render(<PromptInputView {...defaultProps} />);
      expect(screen.queryByText('Prompt is too short')).toBeNull();
    });
  });

  describe('S2: Max length and module labels', () => {
    it('enforces max length (onChangeText not called when exceeding)', () => {
      const onChangeText = jest.fn();
      render(<PromptInputView {...defaultProps} value="" onChangeText={onChangeText} maxLength={5} />);
      const input = screen.getByPlaceholderText('Enter your prompt here...');
      fireEvent.changeText(input, '123456');
      expect(onChangeText).not.toHaveBeenCalledWith('123456');
      fireEvent.changeText(input, '12345');
      expect(onChangeText).toHaveBeenCalledWith('12345');
    });

    it('shows YOUR PROMPT for image module', () => {
      render(<PromptInputView {...defaultProps} moduleType="image" />);
      expect(screen.getByText('YOUR PROMPT')).toBeTruthy();
    });

    it('shows YOUR PROMPT EDITOR for code module', () => {
      render(<PromptInputView {...defaultProps} moduleType="code" />);
      expect(screen.getByText('YOUR PROMPT EDITOR')).toBeTruthy();
    });

    it('shows CRAFT YOUR PROMPT for copywriting module', () => {
      render(<PromptInputView {...defaultProps} moduleType="copywriting" />);
      expect(screen.getByText('CRAFT YOUR PROMPT')).toBeTruthy();
    });
  });

  describe('S2: Style badge (image challenges)', () => {
    it('shows style badge when styleBadge prop is provided', () => {
      render(<PromptInputView {...defaultProps} styleBadge="oil painting" />);
      expect(screen.getByText('oil painting')).toBeTruthy();
    });
  });
});
