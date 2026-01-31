/**
 * Type declaration for react-native-gesture-handler (S4 TargetImageView).
 * Ensures TS can resolve the module when package types are not picked up.
 */
declare module 'react-native-gesture-handler' {
  import type { ComponentType, ReactNode } from 'react';

  export type GestureChain = {
    onStart: (fn: () => void) => GestureChain;
    onUpdate: (fn: (e: { scale?: number; translationX?: number; translationY?: number }) => void) => GestureChain;
    onEnd: (fn: () => void) => GestureChain;
    numberOfTaps: (n: number) => GestureChain;
    minDuration: (ms: number) => GestureChain;
  };

  export const Gesture: {
    Pinch: () => GestureChain;
    Pan: () => GestureChain;
    Tap: () => GestureChain;
    LongPress: () => GestureChain;
    Race: (...gestures: unknown[]) => unknown;
    Simultaneous: (...gestures: unknown[]) => unknown;
  };

  export const GestureDetector: ComponentType<{
    gesture: unknown;
    children: ReactNode;
  }>;
}
