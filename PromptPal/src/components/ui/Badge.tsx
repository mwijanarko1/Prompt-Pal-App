import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'surface';
  className?: string;
}

export function Badge({ label, variant = 'surface', className = '' }: BadgeProps) {
  const variantClasses = {
    primary: 'bg-primary/20 border-primary',
    secondary: 'bg-secondary/20 border-secondary',
    outline: 'bg-transparent border-outline',
    surface: 'bg-surfaceVariant border-outline',
  };

  const textClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    outline: 'text-onSurfaceVariant',
    surface: 'text-onSurfaceVariant',
  };

  return (
    <View className={`px-2 py-1 rounded-md border ${variantClasses[variant]} ${className}`}>
      <Text className={`text-[10px] font-bold uppercase tracking-wider ${textClasses[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
