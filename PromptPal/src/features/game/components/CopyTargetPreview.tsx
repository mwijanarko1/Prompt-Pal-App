import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface CopyTargetPreviewProps {
  /** The mission/instruction text */
  instruction: string;
  /** Success criteria from grading (checkable items) */
  criteria?: string[];
  /** Optional starter context (brand, audience, etc.) */
  context?: string;
  /** Height of the preview area (matches HtmlPreview default) */
  height?: number;
}

/**
 * Renders the copywriting target brief in a document-style preview.
 * Mirrors the coding HtmlPreview: shows what the user is aiming for.
 */
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
        className="flex-1 bg-surface rounded-xl border border-outline/20 p-4"
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {parts.map((p, i) => (
          <Text key={`p-${i}`} className="text-onSurface text-sm leading-5 mb-3">
            {p}
          </Text>
        ))}
        {criteria.length > 0 && (
          <View className="mt-2">
            <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2">
              Success criteria
            </Text>
            {criteria.map((c, i) => (
              <View key={`c-${i}`} className="flex-row items-start mb-2">
                <View className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5 mr-2.5" />
                <Text className="text-onSurface text-[13px] leading-5 flex-1">{c}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
