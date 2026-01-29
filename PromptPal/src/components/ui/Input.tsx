import React from 'react';
import { TextInput as RNTextInput, View, Text } from 'react-native';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: string;
  onFocus?: () => void;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  className = '',
  onFocus,
}: InputProps) {
  const hasError = !!error;
  const borderColor = hasError ? 'border-error' : 'border-outline';

  return (
    <View className={`mb-6 ${className}`}>
      {label && (
        <Text className="text-onSurface text-sm font-semibold mb-2 capitalize">
          {label}
        </Text>
      )}
      <View className={`bg-surface border-2 rounded-xl overflow-hidden ${borderColor}`}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? 100 : 48
          }}
          className="text-onSurface"
        />
      </View>
      {error && (
        <View className="flex-row items-center mt-2">
          <Text className="text-error text-sm ml-1">
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
