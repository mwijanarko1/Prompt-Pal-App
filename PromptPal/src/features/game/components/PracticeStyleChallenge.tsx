import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button, Card, Input, Badge } from '@/components/ui';

type Tone = 'neutral' | 'accent' | 'warning' | 'secondary';

export interface PracticeStyleSection {
  title: string;
  icon?: string;
  tone?: Tone;
  body?: string;
  code?: string;
  items?: string[];
  badge?: string;
}

interface PracticeStyleChallengeProps {
  title: string;
  subtitle?: string;
  previewLabel: string;
  sections: PracticeStyleSection[];
  promptLabel: string;
  prompt: string;
  onChangePrompt: (text: string) => void;
  promptPlaceholder: string;
  charCount: number;
  tokenCount: number;
  wordCountLabel?: string;
  wordProgress?: number;
  wordProgressTone?: 'success' | 'warning' | 'error';
  inputAccessoryViewID?: string;
  hintActionLabel: string;
  onPressHint: () => void;
  hintActionDisabled?: boolean;
  hintPanel?: React.ReactNode;
  /** Live preview (e.g. HTML in WebView) - like onboarding's target design mockup */
  targetPreview?: React.ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  submitIcon: string;
  submitDisabled?: boolean;
  isSubmitting?: boolean;
  attemptTitle?: string;
  attemptView?: React.ReactNode;
}

const toneClasses: Record<Tone, { container: string; stripe: string; text: string; badge: string; iconColor: string }> = {
  neutral: {
    container: 'bg-surfaceVariant/20 border-outline/15',
    stripe: 'bg-outline/40',
    text: 'text-onSurfaceVariant',
    badge: 'bg-surfaceVariant text-onSurfaceVariant',
    iconColor: '#6B7280',
  },
  accent: {
    container: 'bg-primary/8 border-primary/15',
    stripe: 'bg-primary',
    text: 'text-primary',
    badge: 'bg-primary/15 text-primary',
    iconColor: '#FF6B00',
  },
  warning: {
    container: 'bg-warning/5 border-warning/15',
    stripe: 'bg-warning',
    text: 'text-warning',
    badge: 'bg-warning/15 text-warning',
    iconColor: '#F59E0B',
  },
  secondary: {
    container: 'bg-secondary/5 border-secondary/15',
    stripe: 'bg-secondary',
    text: 'text-secondary',
    badge: 'bg-secondary/15 text-secondary',
    iconColor: '#4151FF',
  },
};

function renderBulletItems(items: string[]) {
  return items.map((item, index) => (
    <View key={`${item}-${index}`} className="flex-row items-start mb-2 last:mb-0">
      <View className="w-1 h-1 rounded-full bg-onSurfaceVariant/40 mt-1.5 mr-2.5" />
      <Text className="text-onSurface text-[13px] leading-5 flex-1">{item}</Text>
    </View>
  ));
}

export function PracticeStyleChallenge({
  subtitle,
  previewLabel,
  sections,
  promptLabel,
  prompt,
  onChangePrompt,
  promptPlaceholder,
  charCount,
  tokenCount,
  wordCountLabel,
  wordProgress,
  wordProgressTone = 'success',
  inputAccessoryViewID,
  hintActionLabel,
  onPressHint,
  hintActionDisabled = false,
  hintPanel,
  targetPreview,
  onSubmit,
  submitLabel,
  submitIcon,
  submitDisabled = false,
  isSubmitting = false,
  attemptTitle,
  attemptView,
}: PracticeStyleChallengeProps) {
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState(false);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const progressBarClass =
    wordProgressTone === 'error'
      ? 'bg-error'
      : wordProgressTone === 'warning'
        ? 'bg-warning'
        : 'bg-success';
  const progressTextClass =
    wordProgressTone === 'error'
      ? 'text-error'
      : wordProgressTone === 'warning'
        ? 'text-warning'
        : 'text-success';

  const fullScreenTargetPreview = useMemo(() => {
    if (!targetPreview) return null;
    if (!React.isValidElement(targetPreview)) return targetPreview;

    // HtmlPreview/CopyTargetPreview accept a numeric `height` prop.
    // Clone the element so the preview fills the screen in full-screen mode.
    const element = targetPreview as React.ReactElement<{ height?: number }>;
    // Full preview only: subtract just safe-area insets (no header height).
    const availableHeight = windowHeight - insets.top - insets.bottom;
    return React.cloneElement(element, {
      // Full-screen modal should map the preview to the whole screen height.
      height: Math.max(200, Math.floor(availableHeight)),
    });
  }, [targetPreview, windowHeight, insets.top, insets.bottom]);

  return (
    <View className="px-6 pt-4 pb-8">
      <View className="w-full max-w-[520px] self-center min-w-0">
        {targetPreview ? (
          <Animated.View entering={FadeInDown.duration(500).delay(100)} className="mb-5">
            <View className="rounded-[24px] border border-outline/15 bg-surfaceVariant/15 p-4 overflow-hidden shadow-lg shadow-black/10 relative">
              <TouchableOpacity
                onPress={() => setIsPreviewFullScreen(true)}
                className="absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 border border-outline/10 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Full screen preview"
              >
                <Ionicons name="expand-outline" size={18} color="#6B7280" />
              </TouchableOpacity>

              {targetPreview}
            </View>
          </Animated.View>
        ) : null}

        <Modal
          visible={isPreviewFullScreen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsPreviewFullScreen(false)}
        >
          <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
            <View className="flex-1 relative">
              {/* Close button overlays the preview content */}
              <TouchableOpacity
                onPress={() => setIsPreviewFullScreen(false)}
                className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-surfaceVariant/60 items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close full screen preview"
              >
                <Ionicons name="close" size={18} color="#6B7280" />
              </TouchableOpacity>

              {fullScreenTargetPreview}
            </View>
          </SafeAreaView>
        </Modal>

        {/* Instructions: some challenge types rely on `subtitle` when `sections` are intentionally empty */}
        {subtitle && sections.length === 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(200)} className="items-center mb-5">
            <Text className="text-onSurfaceVariant text-sm font-semibold text-center leading-5">
              {subtitle}
            </Text>
          </Animated.View>
        ) : null}

        {sections.length > 0 ? (
          <Animated.View entering={FadeInUp.duration(500).delay(300)} className="mb-5 min-w-0 rounded-[20px] border border-outline/10 bg-surfaceVariant/15 p-4">
            {sections.map((section, index) => {
              const tone = toneClasses[section.tone ?? 'neutral'];

              return (
                <View
                  key={`${section.title}-${index}`}
                  className={`mb-3 flex-row overflow-hidden rounded-2xl border min-w-0 last:mb-0 ${tone.container}`}
                >
                  <View className={`w-1 ${tone.stripe}`} />
                  <View className="min-w-0 flex-1 p-3">
                    <View className="mb-1.5 flex-row items-center justify-between gap-3">
                        <View className="min-w-0 flex-1 flex-row items-center">
                        {section.icon ? (
                          <Ionicons name={section.icon as never} size={13} color={tone.iconColor} />
                        ) : null}
                        <Text className={`min-w-0 flex-1 text-[10px] font-black uppercase tracking-[2px] ${tone.text} ${section.icon ? 'ml-1.5' : ''}`}>
                          {section.title}
                        </Text>
                      </View>
                      {section.badge ? (
                        <View className={`px-2.5 py-1 rounded-full ${tone.badge}`}>
                          <Text className={`text-[10px] font-bold ${tone.text}`}>{section.badge}</Text>
                        </View>
                      ) : null}
                    </View>

                    {section.body ? (
                      <Text className="text-onSurface text-[14px] leading-[20px]">
                        {section.body}
                      </Text>
                    ) : null}

                    {section.code ? (
                      <View className="min-w-0 bg-surface rounded-xl p-2.5 border border-outline/10 mt-2">
                        <Text className="min-w-0 text-onSurface text-[11px] font-mono leading-4" selectable>
                          {section.code}
                        </Text>
                      </View>
                    ) : null}

                    {section.items && section.items.length > 0 ? (
                      <View className="mt-1">{renderBulletItems(section.items)}</View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.duration(500).delay(400)} className="mb-5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-onSurfaceVariant text-[11px] font-black uppercase tracking-[2px]">
              Your Turn
            </Text>

            <TouchableOpacity
              onPress={onPressHint}
              disabled={hintActionDisabled}
              className={`px-3 py-2 rounded-full ${hintActionDisabled ? 'bg-surfaceVariant/40' : 'bg-primary/10'}`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  hintActionDisabled ? 'text-onSurfaceVariant/60' : 'text-primary'
                }`}
              >
                {hintActionLabel}
              </Text>
            </TouchableOpacity>
          </View>

          {hintPanel ? <View className="mb-4">{hintPanel}</View> : null}

          <View className="rounded-[20px] border border-outline/15 bg-surface p-4">
            <Input
              value={prompt}
              onChangeText={onChangePrompt}
              placeholder={promptPlaceholder}
              multiline
              className="mb-0"
              inputAccessoryViewID={inputAccessoryViewID}
            />

            {wordCountLabel ? (
              <View className="mb-3">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest">
                    Word Count
                  </Text>
                  <Text className={`text-[11px] font-bold ${progressTextClass}`}>{wordCountLabel}</Text>
                </View>
                <View className="h-1.5 bg-surfaceVariant rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${progressBarClass}`}
                    style={{ width: `${Math.max(0, Math.min(wordProgress ?? 0, 100))}%` }}
                  />
                </View>
              </View>
            ) : null}

            <View className="flex-row flex-wrap">
              <Badge label={`${charCount} chars`} variant="surface" className="bg-surfaceVariant mr-2 mb-2 border-0 px-2.5" />
              <Badge label={`${tokenCount} tokens`} variant="surface" className="bg-surfaceVariant mr-2 mb-2 border-0 px-2.5" />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(500)}>
          <Button
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={submitDisabled}
            variant="primary"
            size="lg"
            fullWidth
            className="rounded-full py-5"
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-onPrimary text-base font-bold">{submitLabel}</Text>
              {!isSubmitting ? (
                <Ionicons name={submitIcon as never} size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              ) : null}
            </View>
          </Button>
        </Animated.View>

        {attemptView ? (
          <Animated.View entering={FadeInUp.duration(400)} className="mt-6 min-w-0">
            {attemptTitle ? (
              <Text className="text-onSurfaceVariant text-[11px] font-black uppercase tracking-[2px] mb-2">
                {attemptTitle}
              </Text>
            ) : null}
            <Card className="w-full min-w-0 overflow-hidden rounded-[20px] border border-outline/10 p-0" variant="elevated">
              <View className="min-w-0 bg-surface">{attemptView}</View>
            </Card>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}
