module.exports = {
  moduleNameMapper: {
    '^@/components/ui$': '<rootDir>/__mocks__/@/components/ui.js',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/features/(.*)$': '<rootDir>/src/features/$1',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-css-interop|nativewind|@testing-library)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
};
