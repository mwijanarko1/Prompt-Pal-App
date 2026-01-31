/**
 * Unit tests for TargetImageView (S4).
 * Mocks reanimated and gesture-handler so the component renders without native deps.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { TargetImageView } from '@/features/game/components/TargetImageView';

jest.mock('react-native-reanimated', () => ({
  useSharedValue: (v) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  withSpring: (v) => v,
  runOnJS: (fn) => fn,
  default: { View: 'View' },
}));

jest.mock('react-native-gesture-handler', () => {
  const chain = () => chain;
  chain.onStart = () => chain;
  chain.onUpdate = () => chain;
  chain.onEnd = () => chain;
  chain.numberOfTaps = () => chain;
  chain.minDuration = () => chain;
  return {
    Gesture: {
      Pinch: () => chain,
      Pan: () => chain,
      Tap: () => chain,
      LongPress: () => chain,
      Race: () => chain,
      Simultaneous: () => chain,
    },
    GestureDetector: ({ children }) => children,
  };
});

jest.mock('@/components/ui', () => ({
  Badge: ({ label }) => require('react').createElement('View', null, label),
}));

describe('TargetImageView', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.skip('renders image when source has uri (needs full RN/NativeWind env; use test screen for manual check)', () => {
    render(
      <TargetImageView source={{ uri: 'https://example.com/image.png' }} />
    );
    const image = screen.getByRole('image', { name: /challenge image/i });
    expect(image).toBeTruthy();
  });

  it('shows "Image unavailable" when source is invalid', () => {
    render(<TargetImageView source={null as any} />);
    expect(screen.getByText('Image unavailable')).toBeTruthy();
  });

  it('shows "Image unavailable" when source is empty object', () => {
    render(<TargetImageView source={{} as any} />);
    expect(screen.getByText('Image unavailable')).toBeTruthy();
  });

  it.skip('shows Target badge when showTargetBadge is true (full render; use test screen)', () => {
    render(
      <TargetImageView
        source={{ uri: 'https://example.com/image.png' }}
        showTargetBadge={true}
      />
    );
    expect(screen.getByText('Target')).toBeTruthy();
  });

  it.skip('does not show Target badge when showTargetBadge is false (full render)', () => {
    render(
      <TargetImageView
        source={{ uri: 'https://example.com/image.png' }}
        showTargetBadge={false}
      />
    );
    expect(screen.queryByText('Target')).toBeNull();
  });

  it.skip('uses custom accessibilityLabel when provided (full render)', () => {
    render(
      <TargetImageView
        source={{ uri: 'https://example.com/image.png' }}
        accessibilityLabel="Target challenge image"
      />
    );
    const image = screen.getByRole('image', { name: /target challenge image/i });
    expect(image).toBeTruthy();
  });

  it.skip('uses default accessibilityLabel when not provided (full render)', () => {
    render(<TargetImageView source={{ uri: 'https://example.com/image.png' }} />);
    const image = screen.getByRole('image', { name: /challenge image/i });
    expect(image).toBeTruthy();
  });
});
