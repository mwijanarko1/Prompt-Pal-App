import { View } from 'react-native';

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <View className={`bg-surfaceVariant animate-pulse ${className}`} />
  );
}
