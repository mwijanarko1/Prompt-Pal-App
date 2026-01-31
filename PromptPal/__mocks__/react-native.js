/**
 * Manual mock for react-native so Jest can run component tests.
 */
/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports -- Jest mock; CommonJS and require() are required */
const React = require('react');

const View = (props) => React.createElement('View', props, props.children);
const Text = (props) => React.createElement('Text', props, props.children);
const TextInput = (props) => React.createElement('TextInput', props);
const TouchableOpacity = (props) => {
  const { onPress, children, ...rest } = props;
  return React.createElement('TouchableOpacity', { ...rest, onPress }, children);
};
const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props);
const Alert = { alert: jest.fn() };
const StyleSheet = { create: (obj) => obj, flatten: (s) => s || {} };

module.exports = {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
};
