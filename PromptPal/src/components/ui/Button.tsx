import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Button({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
}: ButtonProps) {
  const baseClasses = 'rounded-lg items-center justify-center';

  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border-2 border-primary bg-transparent',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  const textColorClasses = {
    primary: 'text-onPrimary',
    secondary: 'text-onSecondary',
    outline: 'text-primary',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const disabledClasses = disabled || loading ? 'opacity-50' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color="#000000" />
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
