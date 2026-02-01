/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const React = require('react');

const View = ({ children, testID }) =>
  React.createElement('div', { 'data-testid': testID }, children);
const Text = ({ children, testID }) =>
  React.createElement('span', { 'data-testid': testID }, children);

module.exports = {
  View,
  Text,
  ScrollView: View,
  TouchableOpacity: View,
  Image: View,
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  Platform: { OS: 'ios' },
  StyleSheet: { create: (s) => s, flatten: (s) => s },
  Appearance: {
    getColorScheme: () => 'light',
    addChangeListener: () => ({ remove: () => {} }),
  },
};
