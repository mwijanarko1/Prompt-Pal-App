import { Pressable, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { ReactNode, useCallback } from 'react';

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
  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border-2 border-outline bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textVariantClasses = {
    primary: 'text-onPrimary',
    secondary: 'text-onSecondary',
    outline: 'text-onSurface',
    ghost: 'text-primary',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [disabled, loading, onPress]);

  const isTextChild = typeof children === 'string' || typeof children === 'number';

  const buttonClassName = `${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''} ${className}`;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={buttonClassName}
      style={({ pressed }) => [
        styles.base,
        pressed && { opacity: 0.8 },
      ]}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : '#FF6B00'}
            style={{ marginRight: 8 }}
          />
          <Text className={`${textVariantClasses[variant]} ${textSizeClasses[size]} font-semibold text-center`}>
            Loading...
          </Text>
        </View>
      ) : (
        isTextChild ? (
          <Text className={`${textVariantClasses[variant]} ${textSizeClasses[size]} font-semibold text-center`}>
            {children}
          </Text>
        ) : (
          children
        )
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
