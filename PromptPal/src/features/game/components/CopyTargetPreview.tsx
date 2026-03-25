import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface CopyTargetPreviewProps {
  instruction: string;
  criteria?: string[];
  context?: string;
  height?: number;
}

export function CopyTargetPreview({
  instruction,
  criteria = [],
  context,
  height = 220,
}: CopyTargetPreviewProps) {
  const parts: string[] = [];
  if (instruction?.trim()) parts.push(instruction.trim());
  if (context?.trim()) parts.push(context.trim());

  if (parts.length === 0 && criteria.length === 0) return null;

  return (
    <View style={{ height, minHeight: 120 }}>
      <ScrollView
        className="flex-1 bg-surface rounded-xl border border-outline/10 p-4"
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {parts.map((p, i) => (
          <Animated.View key={`p-${i}`} entering={FadeInDown.delay(100 * i).duration(400)}>
            <Text className="text-onSurface text-[14px] leading-[22px] mb-3 font-medium">
              {p}
            </Text>
          </Animated.View>
        ))}
        {criteria.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-3 pt-3 border-t border-outline/10">
            <View className="flex-row items-center mb-2">
              <Ionicons name="checkmark-circle-outline" size={14} color="#4151FF" />
              <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-[2px] ml-1.5">
                Checklist
              </Text>
            </View>
            {criteria.map((c, i) => (
              <View key={`c-${i}`} className="flex-row items-start mb-2">
                <View className="w-4 h-4 rounded border border-outline/30 mr-2.5 mt-0.5 items-center justify-center">
                  <View className="w-2 h-2 rounded-sm bg-secondary/30" />
                </View>
                <Text className="text-onSurface text-[13px] leading-5 flex-1">{c}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
