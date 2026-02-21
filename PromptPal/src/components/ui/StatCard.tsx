import React, { memo, ComponentProps } from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: string;
  icon?: string;
  trend?: string;
  color?: string;
  isSecondary?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Helper to map emoji icons to Ionicons names
const getIconName = (icon: string): IoniconName => {
  const mapping: Record<string, IoniconName> = {
    "🎨": "color-palette",
    "💻": "laptop",
    "✍️": "create",
    "🧠": "hardware-chip",
    "✨": "sparkles",
    "🔥": "flame",
    "🏆": "trophy",
    "📅": "calendar",
    "trophy-outline": "trophy-outline",
    "flash-outline": "flash-outline",
    "flame-outline": "flame-outline",
    "star": "star",
    "trending-up": "trending-up",
  };
  if (icon && icon in Ionicons.glyphMap) {
    return icon as IoniconName;
  }
  return mapping[icon] || "stats-chart";
};

export const StatCard = memo(function StatCard({ 
  label, 
  value, 
  icon,
  trend,
  color = "#FF6B00",
  isSecondary = false,
  variant = 'default'
}: StatCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const onSurfaceVariant = isDark ? '#A1A1AA' : '#71717A';

  // Compact variant (used in Home page stats bar)
  if (variant === 'compact') {
    return (
      <View className="bg-surface/50 border border-outline/30 p-4 rounded-3xl flex-1 mx-1 items-center">
        <Text className="text-onSurface text-2xl font-black mb-1">{value}</Text>
        <View className="flex-row items-center">
          <Ionicons name={getIconName(icon || 'stats-chart')} size={14} color={onSurfaceVariant} />
          <Text className="text-onSurfaceVariant text-[8px] font-black uppercase ml-1 tracking-widest">{label}</Text>
        </View>
      </View>
    );
  }

  // Featured variant (used in Profile page)
  if (variant === 'featured') {
    return (
      <View
        className="flex-1 rounded-[30px] p-6 border border-white/5"
        style={{ backgroundColor: isSecondary ? 'rgba(65, 81, 255, 0.05)' : 'rgba(255, 107, 0, 0.05)' }}
      >
        <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">{label}</Text>
        <Text className="text-onSurface text-4xl font-black mb-3">{value}</Text>
        {trend && (
          <View className="flex-row items-center">
            <Ionicons
              name={isSecondary ? "star" : "trending-up"}
              size={12}
              color={color}
            />
            <Text className="text-xs font-bold ml-1" style={{ color }}>{trend}</Text>
          </View>
        )}
      </View>
    );
  }

  // Default variant
  return (
    <View className="bg-surface/50 border border-outline/30 p-4 rounded-3xl flex-1 mx-1 items-center">
      <Text className="text-onSurface text-2xl font-black mb-1">{value}</Text>
      <View className="flex-row items-center">
        <Ionicons name={getIconName(icon || 'stats-chart')} size={14} color={onSurfaceVariant} />
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase ml-1 tracking-widest">{label}</Text>
      </View>
    </View>
  );
});

export default StatCard;
