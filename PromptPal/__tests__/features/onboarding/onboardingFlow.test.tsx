import React from 'react';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import TestRenderer, { act } from 'react-test-renderer';
import { TouchableOpacity } from 'react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => { };
  return Reanimated;
});

const mockMutation = jest.fn(() => Promise.resolve(null));

jest.mock('@/lib/convex-client', () => ({
  convexHttpClient: {
    mutation: mockMutation,
  },
}));

jest.mock('../../../src/features/onboarding/components/PromptoCharacter', () => ({
  PromptoCharacter: () => null,
}));

jest.mock('../../../src/features/onboarding/components/OnboardingScreenWrapper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    OnboardingScreenWrapper: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

import { api } from '../../../convex/_generated/api';
import { ModuleSelectionScreen } from '../../../src/features/onboarding/screens/ModuleSelectionScreen';
import { CompleteScreen } from '../../../src/features/onboarding/screens/CompleteScreen';
import { GeneratingScreen } from '../../../src/features/onboarding/screens/GeneratingScreen';
import { useOnboardingStore } from '../../../src/features/onboarding/store';

describe('onboarding flow updates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockMutation.mockClear();
    useOnboardingStore.getState().resetOnboarding();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('persists the selected module and advances the flow', async () => {
    useOnboardingStore.setState({ currentStep: 'module-selection' });
    const screen = TestRenderer.create(<ModuleSelectionScreen />);
    const codingButton = screen.root.find(
      (node) =>
        node.type === TouchableOpacity &&
        node.props.accessibilityLabel === 'Choose Coding module'
    );

    await act(async () => {
      await codingButton.props.onPress();
    });

    expect(mockMutation).toHaveBeenCalledWith(
      api.mutations.updateUserPreferences,
      { favoriteModule: 'coding-logic' }
    );
    expect(useOnboardingStore.getState().selectedModule).toBe('coding-logic');
    expect(useOnboardingStore.getState().currentStep).toBe('complete');
  });

  it('renders earned badges from store state', () => {
    useOnboardingStore.setState({
      currentStep: 'complete',
      badges: ['prompt-apprentice', 'onboarding-complete'],
    });

    const screen = TestRenderer.create(<CompleteScreen />);
    const labeledNodes = screen.root.findAll(
      (node) =>
        node.props.accessibilityLabel === 'Prompt Apprentice' ||
        node.props.accessibilityLabel === 'Onboarding Complete'
    );

    expect(labeledNodes).toHaveLength(2);
  });

  it('waits for the full generating duration before advancing', () => {
    useOnboardingStore.setState({ currentStep: 'generating' });
    TestRenderer.create(<GeneratingScreen />);

    act(() => {
      jest.advanceTimersByTime(8999);
    });
    expect(useOnboardingStore.getState().currentStep).toBe('generating');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(useOnboardingStore.getState().currentStep).toBe('results');
  });
});
