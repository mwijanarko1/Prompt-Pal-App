import { View } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  className?: string;
}

export function ProgressBar({ progress, className = '' }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, progress * 100));

  return (
    <View className={`h-1.5 w-full bg-surfaceVariant rounded-full overflow-hidden ${className}`}>
      <View 
        className="h-full bg-primary"
        style={{ width: `${percentage}%` }}
      />
    </View>
  );
}
