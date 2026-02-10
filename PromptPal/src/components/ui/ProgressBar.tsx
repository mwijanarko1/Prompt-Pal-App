import { View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  className?: string;
  height?: number; // Optional height in pixels, defaults to 8
  color?: string; // Optional fill color class, defaults to 'bg-primary'
}

export function ProgressBar({ progress, className = '', height = 8, color = 'bg-primary' }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, progress * 100));

  return (
    <View className={`w-full bg-surfaceVariant rounded-full overflow-hidden ${className}`} style={{ height }}>
      <View
        className={`h-full ${color} rounded-full`}
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
}
