/**
 * Minimal screen to manually test TargetImageView (S4).
 * Open in Expo: press "w" for web, or navigate to /test-target-image.
 * No backend required — uses a static image URL.
 */
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TargetImageView } from '@/features/game/components/TargetImageView';

const SAMPLE_IMAGE_URI = 'https://picsum.photos/400/400';

export default function TestTargetImageScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <Text className="text-onSurface text-lg font-bold mb-2">
          S4: TargetImageView manual test
        </Text>
        <Text className="text-onSurfaceVariant text-sm mb-4">
          Double-tap to zoom • Pinch to zoom • Long-press for analysis tips
        </Text>

        <Text className="text-onSurfaceVariant text-xs mb-2">With Target badge:</Text>
        <View className="mb-6">
          <TargetImageView
            source={{ uri: SAMPLE_IMAGE_URI }}
            showTargetBadge={true}
            analysisTips={['Check composition.', 'Match the style.']}
            accessibilityLabel="Test target image"
            className="rounded-xl overflow-hidden"
          />
        </View>

        <Text className="text-onSurfaceVariant text-xs mb-2">Without badge:</Text>
        <View>
          <TargetImageView
            source={{ uri: SAMPLE_IMAGE_URI }}
            showTargetBadge={false}
            accessibilityLabel="Test image no badge"
            className="rounded-xl overflow-hidden"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
