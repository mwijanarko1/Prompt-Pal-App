/**
 * PromptInputView - Standalone prompt input component with hint system integration
 * 
 * Features:
 * - Character and token counting
 * - Hint button with NanoAssistant integration
 * - Collapsible hint display area
 * - Loading state during generation
 * - Validation feedback
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Input, Card, Badge, Button } from '@/components/ui';
import { NanoAssistant } from '@/lib/nanoAssistant';
import type { Level as StoreLevel, ChallengeType } from '@/features/game/store';

// Use store Level type directly
export type Level = StoreLevel;

export interface PromptInputViewProps {
  /** Current prompt value */
  value: string;
  /** Callback when prompt text changes */
  onChangeText: (text: string) => void;
  /** Callback when generate button is pressed */
  onGenerate: () => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Whether generation is in progress */
  isLoading?: boolean;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Level data for hint system */
  level: Level;
  /** Module type for hint context */
  moduleType: ChallengeType;
  /** Optional style badge to display (for image challenges) */
  styleBadge?: string;
  /** Maximum character limit (default: 500) */
  maxLength?: number;
  /** Custom validation error message */
  error?: string;
}

/**
 * Calculate approximate token count from character count
 * Rough estimation: ~4 characters per token
 */
function calculateTokenCount(charCount: number): number {
  return Math.ceil(charCount / 4);
}

export function PromptInputView({
  value,
  onChangeText,
  onGenerate,
  placeholder = 'Enter your prompt here...',
  isLoading = false,
  disabled = false,
  level,
  moduleType,
  styleBadge,
  maxLength = 500,
  error,
}: PromptInputViewProps) {
  // Handle text change with character limit enforcement
  const handleTextChange = (text: string) => {
    if (text.length <= maxLength) {
      onChangeText(text);
    }
    // If text exceeds limit, don't update (prevents typing beyond limit)
  };
  const [hints, setHints] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [showHints, setShowHints] = useState(false);

  // Update hint cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const { isOnCooldown, remainingMs } = NanoAssistant.getCooldownStatus();
      setHintCooldown(isOnCooldown ? Math.ceil(remainingMs / 1000) : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset hints when level changes
  useEffect(() => {
    if (level?.id) {
      NanoAssistant.resetHintsForLevel(level.id);
      setHints([]);
      setShowHints(false);
    }
  }, [level?.id]);

  // Handle getting a hint
  const handleGetHint = useCallback(async () => {
    if (!level || isLoadingHint || hintCooldown > 0) return;

    const hintsRemaining = NanoAssistant.getHintsRemaining(level.id, level.difficulty);
    const maxHints = NanoAssistant.getMaxHintsPerLevel(level.difficulty);
    const noHintsLeft = hintsRemaining === 0;

    if (noHintsLeft) {
      Alert.alert(
        'No Hints Remaining',
        `You've used all ${maxHints} hints for this level. Try your best with what you have!`
      );
      return;
    }

    setIsLoadingHint(true);
    try {
      const hint = await NanoAssistant.getHint(value, moduleType, level as unknown as StoreLevel);
      setHints(prev => [...prev, hint]);
      setShowHints(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not get hint. Please try again.';
      Alert.alert('Hint Unavailable', errorMessage);
    } finally {
      setIsLoadingHint(false);
    }
  }, [level, value, moduleType, isLoadingHint, hintCooldown]);

  const charCount = value.length;
  const tokenCount = calculateTokenCount(charCount);
  const hintsUsed = level ? NanoAssistant.getHintsUsed(level.id) : 0;
  const hintsRemaining = level ? NanoAssistant.getHintsRemaining(level.id, level.difficulty) : 0;
  const maxHints = level ? NanoAssistant.getMaxHintsPerLevel(level.difficulty) : 4;
  const noHintsLeft = hintsRemaining === 0;
  const isHintDisabled = isLoadingHint || hintCooldown > 0 || noHintsLeft || disabled;

  return (
    <View className="px-6 pb-8">
      {/* Header with hint button */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-onSurfaceVariant text-xs font-black uppercase tracking-widest">
          {moduleType === 'image' ? 'YOUR PROMPT' : moduleType === 'code' ? 'YOUR PROMPT EDITOR' : 'CRAFT YOUR PROMPT'}
        </Text>
        <TouchableOpacity 
          onPress={handleGetHint}
          disabled={isHintDisabled}
          className={`flex-row items-center px-3 py-2 rounded-full ${
            noHintsLeft ? 'bg-surfaceVariant/30' : hintCooldown > 0 ? 'bg-surfaceVariant/50' : 'bg-secondary/20'
          }`}
        >
          {isLoadingHint ? (
            <ActivityIndicator size="small" color="#4151FF" />
          ) : (
            <>
              <Text className={`text-base mr-1 ${noHintsLeft ? 'opacity-50' : ''}`}>
                {hintCooldown > 0 ? '⏳' : '🪄'}
              </Text>
              <Text className={`text-xs font-bold ${
                noHintsLeft ? 'text-onSurfaceVariant/50' : 
                hintCooldown > 0 ? 'text-onSurfaceVariant' : 
                'text-secondary'
              }`}>
                {noHintsLeft 
                  ? 'No hints left' 
                  : hintCooldown > 0 
                    ? `${hintCooldown}s` 
                    : hintsUsed === 0 
                      ? 'Free Hint' 
                      : `Hint (${hintsRemaining}/${maxHints})`
                }
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Hints Display - Collapsible */}
      {hints.length > 0 && (
        <TouchableOpacity 
          onPress={() => setShowHints(!showHints)}
          className="mb-4"
          disabled={disabled}
        >
          <Card className={`p-4 rounded-[24px] border border-secondary/30 bg-secondary/5 ${
            showHints ? '' : 'overflow-hidden'
          }`}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Text className="text-secondary text-sm mr-2">💡</Text>
                <Text className="text-secondary text-xs font-black uppercase tracking-widest">
                  Hints ({hints.length})
                </Text>
              </View>
              <Text className="text-onSurfaceVariant text-xs">
                {showHints ? '▲ Hide' : '▼ Show'}
              </Text>
            </View>
            {showHints && (
              <View className="mt-2">
                {hints.map((hint, index) => (
                  <View key={index} className="flex-row mb-2">
                    <Text className="text-secondary text-xs mr-2">{index + 1}.</Text>
                    <Text className="text-onSurface text-sm flex-1">{hint}</Text>
                  </View>
                ))}
                {level && (
                  <Text className="text-onSurfaceVariant text-[10px] mt-2 italic">
                    {NanoAssistant.getNextHintPenaltyDescription(level.id, level.difficulty)}
                  </Text>
                )}
              </View>
            )}
          </Card>
        </TouchableOpacity>
      )}

      {/* Prompt Input Card */}
      <Card className="p-6 rounded-[32px] border-2 border-primary/30 bg-surfaceVariant/20">
        <Input
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          multiline
          className="text-lg text-onSurface min-h-[120px] bg-transparent border-0 p-0 mb-4"
          error={error}
        />

        {/* Character/Token Count and Style Badge */}
        <View className="flex-row items-center">
          <View className="flex-row">
            <Badge 
              label={`${charCount} chars`} 
              variant="surface" 
              className="bg-surfaceVariant mr-2 border-0 px-3" 
            />
            <Badge 
              label={`${tokenCount} tokens`} 
              variant="surface" 
              className="bg-surfaceVariant mr-2 border-0 px-3" 
            />
            {styleBadge && (
              <Badge 
                label={styleBadge} 
                variant="primary" 
                className="bg-primary/20 border-0 px-3" 
              />
            )}
          </View>
        </View>

        {/* Character limit warning */}
        {charCount >= maxLength * 0.9 && (
          <Text className="text-warning text-xs mt-2">
            {charCount >= maxLength 
              ? 'Character limit reached' 
              : `Approaching limit: ${maxLength - charCount} characters remaining`
            }
          </Text>
        )}
      </Card>

      {/* Generate Button */}
      <Button
        onPress={onGenerate}
        disabled={disabled || isLoading || !value.trim()}
        loading={isLoading}
        variant="primary"
        size="lg"
        fullWidth
        className="mt-8 rounded-full py-5 shadow-glow"
      >
        <View className="flex-row items-center">
          <Text className="text-onPrimary text-lg font-black mr-2">🚀</Text>
          <Text className="text-onPrimary text-lg font-black">
            {moduleType === 'image' ? 'Generate & Compare' : 'Generate'}
          </Text>
        </View>
      </Button>

      {/* Validation Error */}
      {error && (
        <View className="mt-4 px-4 py-3 rounded-xl bg-error/10 border border-error/30">
          <Text className="text-error text-sm">{error}</Text>
        </View>
      )}
    </View>
  );
}
