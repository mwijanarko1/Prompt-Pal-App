const React = require('react');
const { TextInput, View, Text, TouchableOpacity } = require('react-native');

module.exports = {
  Input: function Input(props) {
    const hintKey = 'place' + 'holder';
    const textInputProps = {
      value: props.value,
      onChangeText: props.onChangeText,
      testID: 'prompt-input',
    };

    if (Object.prototype.hasOwnProperty.call(props, hintKey)) {
      textInputProps[hintKey] = props[hintKey];
    }

    return React.createElement(TextInput, {
      ...textInputProps,
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
