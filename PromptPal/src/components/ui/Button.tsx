import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
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
  const baseClasses = 'rounded-xl items-center justify-center transition-all duration-200 active:scale-95';

  const variantClasses = {
    primary: 'bg-primary shadow-glow',
    secondary: 'bg-secondary shadow-glow-secondary',
    outline: 'border-2 border-outline bg-transparent',
    ghost: 'bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-4 py-2',
    md: 'px-6 py-3',
    lg: 'px-8 py-4',
  };

  const textColorClasses = {
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

  const disabledClasses = (disabled || loading) ? 'opacity-50' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${widthClass} ${className}`}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : '#FF6B00'}
            className="mr-2"
          />
          <Text className={`${textColorClasses[variant]} ${textSizeClasses[size]} font-semibold`}>
            Loading...
          </Text>
        </View>
      ) : (
        <Text
          className={`${textColorClasses[variant]} ${textSizeClasses[size]} font-semibold`}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}
