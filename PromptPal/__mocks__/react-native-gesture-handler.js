/**
 * Stub for Jest so "react-native-gesture-handler" resolves.
 * TargetImageView.test.tsx replaces this with its own jest.mock() factory.
 */
/* eslint-env node */
/* eslint-disable no-undef -- CommonJS mock file */
const GestureDetector = ({ children }) => children;
const Gesture = {
  Pinch: () => ({}),
  Pan: () => ({}),
  Tap: () => ({}),
  LongPress: () => ({}),
  Race: () => ({}),
  Simultaneous: () => ({}),
};
module.exports = { Gesture, GestureDetector };
