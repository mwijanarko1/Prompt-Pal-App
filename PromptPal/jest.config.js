/** Jest config for PromptPal. Supports @/ path alias and React Native component tests. */
/* eslint-env node */
/* eslint-disable no-undef -- CommonJS config file; module is defined in Node */
module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.jest.js' }],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
