/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
const React = require('react');

const View = ({ children, testID }) =>
  React.createElement('div', { 'data-testid': testID }, children);
const Text = ({ children, testID }) =>
  React.createElement('span', { 'data-testid': testID }, children);

const TouchableMixin = {};
module.exports = {
  View,
  Text,
  ScrollView: View,
  TouchableOpacity: View,
  Touchable: { Mixin: TouchableMixin },
  Modal: View,
  Image: View,
  ActivityIndicator: View,
  Keyboard: { addListener: () => ({ remove: () => {} }) },
  Alert: { alert: () => {} },
  Dimensions: { get: () => ({ width: 375, height: 812 }) },
  Platform: { OS: 'ios' },
  Appearance: {
    getColorScheme: () => 'light',
    addChangeListener: () => ({ remove: () => {} }),
  },
  NativeModules: {},
  StyleSheet: { create: (s) => s, flatten: (s) => s },
};
