/* eslint-env node */
/* eslint-disable no-undef */
// Suppress react-test-renderer deprecation warning (used by @testing-library/react-native)
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('react-test-renderer is deprecated')
  ) {
    return;
  }
  originalError.apply(console, args);
};
