import React from 'react';
import { View, Text } from 'react-native';
import { UsageStats } from '@/lib/usage';

interface UsageDisplayProps {
  usage: UsageStats;
  compact?: boolean;
}

export function UsageDisplay({ usage, compact = false }: UsageDisplayProps) {
  const getUsageColor = (used: number, limit: number) => {
    const percent = (used / limit) * 100;
    if (percent >= 90) return 'text-error';
    if (percent >= 70) return 'text-warning';
    return 'text-success';
  };

  const getProgressBarColor = (used: number, limit: number) => {
    const percent = (used / limit) * 100;
    if (percent >= 90) return 'bg-error';
    if (percent >= 70) return 'bg-warning';
    return 'bg-success';
  };

  const getProgressWidth = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  if (compact) {
    const totalUsed = usage.used.textCalls + usage.used.imageCalls;
    const totalLimit = usage.limits.textCalls + usage.limits.imageCalls;

    return (
      <View className="bg-surfaceVariant rounded-xl px-4 py-3 border border-outline">
        <View className="flex-row justify-between items-center">
          <Text className="text-primary text-sm font-semibold uppercase tracking-wide">
            {usage.tier}
          </Text>
          <Text className={`text-sm font-bold ${getUsageColor(totalUsed, totalLimit)}`}>
            {totalUsed}/{totalLimit}
          </Text>
        </View>
        <View className="bg-surfaceElevated rounded-full h-2 mt-2 overflow-hidden">
          <View
            className={`h-full ${getProgressBarColor(totalUsed, totalLimit)} rounded-full`}
            style={{ width: `${getProgressWidth(totalUsed, totalLimit)}%` }}
          />
        </View>
      </View>
    );
  }

  return (
    <View className="bg-surfaceElevated rounded-2xl p-6 shadow-lg">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-onSurface text-lg font-bold">Usage Stats</Text>
        <View className="bg-primary px-3 py-1 rounded-full">
          <Text className="text-onPrimary text-xs font-bold uppercase">
            {usage.tier}
          </Text>
        </View>
      </View>

      {/* Text Calls */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-onSurfaceVariant text-sm font-medium">Text Calls</Text>
          <Text className={`text-sm font-bold ${getUsageColor(usage.used.textCalls, usage.limits.textCalls)}`}>
            {usage.used.textCalls}/{usage.limits.textCalls}
          </Text>
        </View>
        <View className="bg-surfaceVariant rounded-full h-3 overflow-hidden">
          <View
            className={`h-full ${getProgressBarColor(usage.used.textCalls, usage.limits.textCalls)} rounded-full`}
            style={{ width: `${getProgressWidth(usage.used.textCalls, usage.limits.textCalls)}%` }}
          />
        </View>
      </View>

      {/* Image Calls */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-onSurfaceVariant text-sm font-medium">Image Calls</Text>
          <Text className={`text-sm font-bold ${getUsageColor(usage.used.imageCalls, usage.limits.imageCalls)}`}>
            {usage.used.imageCalls}/{usage.limits.imageCalls}
          </Text>
        </View>
        <View className="bg-surfaceVariant rounded-full h-3 overflow-hidden">
          <View
            className={`h-full ${getProgressBarColor(usage.used.imageCalls, usage.limits.imageCalls)} rounded-full`}
            style={{ width: `${getProgressWidth(usage.used.imageCalls, usage.limits.imageCalls)}%` }}
          />
        </View>
      </View>

      {/* Period Info */}
      <View className="pt-4 border-t border-outline">
        <Text className="text-textMuted text-xs text-center">
          Period started: {new Date(usage.periodStart).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}