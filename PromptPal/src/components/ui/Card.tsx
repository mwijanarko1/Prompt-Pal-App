import { View, Text } from 'react-native';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({
  children,
  title,
  subtitle,
  className = '',
  padding = 'md',
  variant = 'default'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const variantClasses = {
    default: 'bg-surface border border-outline',
    elevated: 'bg-surfaceElevated shadow-lg',
    outlined: 'bg-surface border-2 border-outline'
  };

  return (
    <View className={`rounded-2xl ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}>
      {(title || subtitle) && (
        <View className="mb-4">
          {title && (
            <Text className="text-onSurface text-lg font-bold mb-1">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-onSurfaceVariant text-sm">
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </View>
  );
}