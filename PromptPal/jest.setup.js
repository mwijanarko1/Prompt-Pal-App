/* Global test setup. Mock react-native-css-interop so @testing-library/react-native can render. */
/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports -- Jest setup; CommonJS and require() are required */
jest.mock('react-native-css-interop/jsx-runtime', () => {
  const React = require('react');
  return {
    jsx: React.createElement,
    jsxs: React.createElement,
  };
});
