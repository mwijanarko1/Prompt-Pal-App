import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: ButtonProps) {
  const variantStyles = {
    primary: { backgroundColor: '#FF6B00' },
    secondary: { backgroundColor: '#4151FF' },
    outline: { borderWidth: 2, borderColor: '#374151', backgroundColor: 'transparent' },
    ghost: { backgroundColor: 'transparent' },
  };

  const sizeStyles = {
    sm: { paddingHorizontal: 16, paddingVertical: 8 },
    md: { paddingHorizontal: 24, paddingVertical: 12 },
    lg: { paddingHorizontal: 32, paddingVertical: 16 },
  };

  const textVariantStyles = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#FFFFFF' },
    outline: { color: '#FFFFFF' },
    ghost: { color: '#FF6B00' },
  };

  const textSizeStyles = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && { width: '100%' },
        (disabled || loading) && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : '#FF6B00'}
            style={{ marginRight: 8 }}
          />
          <Text style={[textVariantStyles[variant], textSizeStyles[size], styles.text]}>
            Loading...
          </Text>
        </View>
      ) : (
        <Text style={[textVariantStyles[variant], textSizeStyles[size], styles.text]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

