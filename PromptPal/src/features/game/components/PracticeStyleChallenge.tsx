import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
    <View key={`${item}-${index}`} className="flex-row items-start mb-2.5 last:mb-0">
      <View className="w-1.5 h-1.5 rounded-full bg-onSurfaceVariant/40 mt-1.5 mr-3" />
      <Text className="text-onSurface text-[13px] leading-5 flex-1">{item}</Text>
    </View>
  ));
}

export function PracticeStyleChallenge({
  title,
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

  return (
    <View className="px-6 pt-4 pb-8">
      <View className="w-full max-w-[520px] self-center min-w-0">
        <View className="items-center mb-6">
          <Text className="text-onSurface text-[28px] font-black text-center mb-2 leading-9">{title}</Text>
          {subtitle ? (
            <Text className="text-onSurfaceVariant text-base font-semibold text-center leading-6">
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View className="mb-5">
          <View className="mb-2 flex-row items-center justify-between gap-3">
            <Text className="min-w-0 flex-1 text-onSurfaceVariant text-[12px] font-black uppercase tracking-[3px]">
              {previewLabel}
            </Text>
            <TouchableOpacity
              onPress={onPressHint}
              disabled={hintActionDisabled}
              className={`px-3 py-2 rounded-full ${hintActionDisabled ? 'bg-surfaceVariant/40' : 'bg-primary/10'}`}
            >
              <Text className={`text-[12px] font-bold ${hintActionDisabled ? 'text-onSurfaceVariant/60' : 'text-primary'}`}>
                {hintActionLabel}
              </Text>
            </TouchableOpacity>
          </View>

          {targetPreview ? (
            <View className="rounded-[20px] border border-outline/15 bg-surfaceVariant/20 p-4 mb-4 overflow-hidden">
              {targetPreview}
            </View>
          ) : null}

          {sections.length > 0 ? (
          <View className="min-w-0 rounded-[20px] border border-outline/15 bg-surfaceVariant/20 p-5">
            {sections.map((section, index) => {
              const tone = toneClasses[section.tone ?? 'neutral'];

              return (
                <View
                  key={`${section.title}-${index}`}
                  className={`mb-4 flex-row overflow-hidden rounded-2xl border min-w-0 last:mb-0 ${tone.container}`}
                >
                  <View className={`w-1 ${tone.stripe}`} />
                  <View className="min-w-0 flex-1 p-4">
                    <View className="mb-2 flex-row items-center justify-between gap-3">
                        <View className="min-w-0 flex-1 flex-row items-center">
                        {section.icon ? (
                          <Ionicons name={section.icon as never} size={14} color={tone.iconColor} />
                        ) : null}
                        <Text className={`min-w-0 flex-1 text-[10px] font-black uppercase tracking-[3px] ${tone.text} ${section.icon ? 'ml-1.5' : ''}`}>
                          {section.title}
                        </Text>
                      </View>
                      {section.badge ? (
                        <View className={`px-3 py-1 rounded-full ${tone.badge}`}>
                          <Text className={`text-[11px] font-black ${tone.text}`}>{section.badge}</Text>
                        </View>
                      ) : null}
                    </View>

                    {section.body ? (
                      <Text className="text-onSurface text-[15px] leading-[22px]">
                        {section.body}
                      </Text>
                    ) : null}

                    {section.code ? (
                      <View className="min-w-0 bg-surface rounded-xl p-3 border border-outline/10">
                        <Text className="min-w-0 text-onSurface text-[12px] font-mono leading-5" selectable>
                          {section.code}
                        </Text>
                      </View>
                    ) : null}

                    {section.items && section.items.length > 0 ? (
                      <View>{renderBulletItems(section.items)}</View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
          ) : null}
        </View>

        {hintPanel ? <View className="mb-5">{hintPanel}</View> : null}

        <View className="mb-5">
          <Text className="text-onSurfaceVariant text-[12px] font-black uppercase tracking-[3px] mb-2">
            {promptLabel}
          </Text>

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
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">
                    Word Count
                  </Text>
                  <Text className={`text-xs font-bold ${progressTextClass}`}>{wordCountLabel}</Text>
                </View>
                <View className="h-2 bg-surfaceVariant rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${progressBarClass}`}
                    style={{ width: `${Math.max(0, Math.min(wordProgress ?? 0, 100))}%` }}
                  />
                </View>
              </View>
            ) : null}

            <View className="flex-row flex-wrap">
              <Badge label={`${charCount} chars`} variant="surface" className="bg-surfaceVariant mr-2 mb-2 border-0 px-3" />
              <Badge label={`${tokenCount} tokens`} variant="surface" className="bg-surfaceVariant mr-2 mb-2 border-0 px-3" />
            </View>
          </View>
        </View>

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
            <Text className="text-onPrimary text-lg font-semibold">{submitLabel}</Text>
            {!isSubmitting ? (
              <Ionicons name={submitIcon as never} size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            ) : null}
          </View>
        </Button>

        {attemptView ? (
          <View className="mt-6 min-w-0">
            {attemptTitle ? (
              <Text className="text-onSurfaceVariant text-[12px] font-black uppercase tracking-[3px] mb-2">
                {attemptTitle}
              </Text>
            ) : null}
            <Card className="w-full min-w-0 overflow-hidden rounded-[24px] border border-outline/15 p-0" variant="elevated">
              <View className="min-w-0 bg-surface">{attemptView}</View>
            </Card>
          </View>
        ) : null}
      </View>
    </View>
  );
}
