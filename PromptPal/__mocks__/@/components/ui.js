const React = require('react');
const { TextInput, View, Text, TouchableOpacity } = require('react-native');

module.exports = {
  Input: function Input(props) {
    return React.createElement(TextInput, {
      value: props.value,
      onChangeText: props.onChangeText,
      placeholder: props.placeholder,
      testID: 'prompt-input',
    });
  },
  Card: function Card({ children }) {
    return React.createElement(View, null, children);
  },
  Badge: function Badge({ label }) {
    return React.createElement(Text, null, label);
  },
  Button: function Button({ children, onPress, disabled }) {
    return React.createElement(TouchableOpacity, { 
      onPress: () => { if (!disabled) onPress(); },
    }, children);
  },
};
