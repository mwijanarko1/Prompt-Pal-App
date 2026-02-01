/**
 * Manual mock for react-native so Jest can run component tests without
 * loading the real react-native (which uses Flow/ESM that breaks in Jest).
 */
/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports -- Jest mock; CommonJS and require() are required */
const React = require('react');

const View = (props) => React.createElement('View', props, props.children);
const Text = (props) => React.createElement('Text', props, props.children);
const TouchableOpacity = (props) => {
  const { onPress, children, ...rest } = props;
  return React.createElement('TouchableOpacity', { ...rest, onPress }, children);
};
const Modal = (props) => {
  const { visible, children, onRequestClose } = props;
  if (!visible) return null;
  return React.createElement('Modal', { onRequestClose }, children);
};
const ActivityIndicator = (props) => React.createElement('ActivityIndicator', props);
const Pressable = (props) => React.createElement('Pressable', props, props.children);
const ScrollView = (props) => React.createElement('ScrollView', props, props.children);
const TextInput = (props) => React.createElement('TextInput', props);
const StyleSheet = {
  create: (obj) => obj,
  flatten: (style) => (Array.isArray(style) ? Object.assign({}, ...style) : style || {}),
};
const Dimensions = { get: () => ({ width: 400, height: 800 }) };

const Share = {
  share: jest.fn().mockResolvedValue(undefined),
};

module.exports = {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
};
