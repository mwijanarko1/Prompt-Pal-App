/**
 * TargetImageView - Zoomable image with "Target" badge, long-press analysis tips, and smooth transitions.
 * S4 per jan-30-report. Supports double-tap zoom, pinch-to-zoom, and pan when zoomed.
 * AGENTS: JSDoc for shared components; a11y labels for interactive elements and images.
 */

import { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  type ImageSourcePropType,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Badge } from '@/components/ui';

export interface TargetImageViewProps {
  /** Image source: URI string or require() asset number */
  source: ImageSourcePropType | { uri: string };
  /** When true, show "Target" overlay badge */
  showTargetBadge?: boolean;
  /** Tips shown on long-press (e.g. "Consider composition, lighting, and keywords") */
  analysisTips?: string | string[];
  /** Optional accessibility label for the image and scroll container (screen readers). */
  accessibilityLabel?: string;
  /** Aspect ratio container (e.g. aspect-square) */
  className?: string;
}

const DEFAULT_TIPS = [
  'Consider composition and framing.',
  'Check lighting and shadows.',
  'Match the style and mood.',
  'Include key descriptive details.',
];

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 1.5;

const springConfig = { damping: 15, stiffness: 150 };

/**
 * Displays a zoomable challenge image with optional Target badge, analysis tips on long-press, and fade transition.
 * Double-tap toggles zoom; pinch to zoom continuously; pan when zoomed; long-press shows analysis tips.
 *
 * @param props.source - Image source (URI object or require() asset).
 * @param props.showTargetBadge - When true, shows "Target" overlay badge.
 * @param props.analysisTips - Tips shown in Alert on long-press (string or string[]).
 * @param props.accessibilityLabel - Label for screen readers (image and scroll container).
 * @param props.className - Optional Tailwind classes for the container.
 */
export function TargetImageView({
  source,
  showTargetBadge = false,
  analysisTips,
  accessibilityLabel = 'Challenge image',
  className = '',
}: TargetImageViewProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const tips = Array.isArray(analysisTips)
    ? analysisTips
    : analysisTips
      ? [analysisTips]
      : DEFAULT_TIPS;
  const tipsText = tips.join('\n\n');

  const showTips = useCallback(() => {
    Alert.alert('Analysis tips', tipsText, [{ text: 'OK' }]);
  }, [tipsText]);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e: { scale?: number }) => {
      const next = savedScale.value * (e.scale ?? 1);
      scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e: { translationX?: number; translationY?: number }) => {
      translateX.value = savedTranslateX.value + (e.translationX ?? 0);
      translateY.value = savedTranslateY.value + (e.translationY ?? 0);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const current = scale.value;
      if (current <= 1) {
        scale.value = withSpring(DOUBLE_TAP_SCALE, springConfig);
        savedScale.value = DOUBLE_TAP_SCALE;
      } else {
        scale.value = withSpring(1, springConfig);
        savedScale.value = 1;
        translateX.value = withSpring(0, springConfig);
        translateY.value = withSpring(0, springConfig);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onEnd(() => {
      runOnJS(showTips)();
    });

  const composed = Gesture.Race(
    doubleTapGesture,
    longPressGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const triggerFadeTransition = useCallback(() => {
    opacity.value = 0;
    opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, [opacity]);

  const hasValidSource = source != null && (typeof source === 'number' || (typeof source === 'object' && 'uri' in source));
  if (!hasValidSource) {
    return (
      <View className={`relative overflow-hidden aspect-square items-center justify-center bg-surfaceVariant ${className}`}>
        <Text className="text-onSurfaceVariant text-center">Image unavailable</Text>
      </View>
    );
  }

  const imageSource = typeof source === 'object' && 'uri' in source ? source : source;

  return (
    <View className={`relative overflow-hidden ${className}`}>
      <GestureDetector gesture={composed}>
        <Animated.View
          style={animatedStyle}
          className="w-full"
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Double-tap to zoom. Pinch to zoom in or out. Long-press for analysis tips."
        >
          <Image
            source={imageSource}
            className="w-full aspect-square"
            resizeMode="cover"
            onLoad={triggerFadeTransition}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="image"
          />
        </Animated.View>
      </GestureDetector>
      {showTargetBadge && (
        <View className="absolute top-6 right-6" pointerEvents="none">
          <Badge
            label="Target"
            variant="primary"
            className="bg-primary px-3 py-1.5 rounded-full border-0"
          />
        </View>
      )}
    </View>
  );
}
