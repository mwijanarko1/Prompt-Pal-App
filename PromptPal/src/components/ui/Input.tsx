import { TextInput, View, Text } from 'react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  className?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  multiline = false,
  numberOfLines = 1,
  className = '',
}: InputProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-onSurface text-sm font-medium mb-2">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        multiline={multiline}
        numberOfLines={numberOfLines}
        className={`bg-surface border border-accent/20 rounded-lg px-4 py-3 text-onSurface text-base ${
          multiline ? 'min-h-[100px]' : ''
        }`}
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
      />
      {error && (
        <Text className="text-error text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}
