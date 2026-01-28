import React from 'react';
import { View, Text, Modal, TouchableOpacity, Share } from 'react-native';
import { Button, Card, RadarChart } from './index';

type ModuleType = 'image' | 'code' | 'copywriting';

interface TestCaseResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface ResultModalProps {
  visible: boolean;
  score: number;
  xp: number;
  /** Optional module type so we can tailor labels/layout */
  moduleType?: ModuleType;
  /** Detailed test results for code challenges */
  testCases?: TestCaseResult[];
  /** Optional copywriting metrics (for radar chart) */
  copyMetrics?: { label: string; value: number }[];
  output?: string;
  /** Optional custom label for primary action button */
  primaryLabel?: string;
  onNext: () => void;
  onClose: () => void;
  /** Optional share callback, falls back to native Share if not provided */
  onShare?: () => void;
}

export function ResultModal({
  visible,
  score,
  xp,
  moduleType,
  testCases,
  copyMetrics,
  output,
  primaryLabel,
  onNext,
  onClose,
  onShare,
}: ResultModalProps) {
  const subtitleLabel =
    moduleType === 'image'
      ? 'SIMILARITY SCORE'
      : moduleType === 'copywriting'
        ? 'COPY SCORE'
        : 'LOGIC VALIDATION';

  const primaryButtonLabel = primaryLabel || 'Next Challenge →';

  const handleShare = async () => {
    try {
      if (onShare) {
        onShare();
        return;
      }
      const defaultMessage =
        moduleType === 'image'
          ? `I just scored ${score}% similarity on an image challenge in PromptPal!`
          : moduleType === 'code'
            ? `I just passed a code challenge in PromptPal with a score of ${score}%!`
            : `I just completed a PromptPal challenge with a score of ${score}%!`;

      await Share.share({
        message: defaultMessage,
      });
    } catch {
      // Silently ignore share errors for now
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={onClose} 
          className="flex-1"
        />
        <View className="bg-background rounded-t-[32px] p-6 border-t border-outline">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 bg-outline rounded-full mb-6" />
            
            <View className="flex-row items-center justify-between w-full mb-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-success/20 rounded-2xl items-center justify-center mr-3 shadow-lg shadow-success/20">
                  <Text className="text-success text-2xl font-black">✓</Text>
                </View>
                <View>
                  <Text className="text-onSurface text-2xl font-black tracking-tight">Challenge Passed!</Text>
                  <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[3px] font-black">
                    {subtitleLabel}: {score}%
                  </Text>
                </View>
              </View>
              <Text className="text-success text-3xl font-black tracking-tighter">+{xp} XP</Text>
            </View>

            {/* Code challenge test results (and any scenario providing testCases) */}
            {testCases && testCases.length > 0 && (
              <Card className="w-full bg-surfaceVariant/50 border-0 p-6 mb-6 rounded-[32px]">
                {testCases.map((tc, i) => {
                  const passed = tc.passed;
                  return (
                    <View key={i} className="mb-3">
                      <View className="flex-row items-center">
                        <View
                          className={`w-5 h-5 rounded-full items-center justify-center mr-3 ${
                            passed ? 'bg-success/20' : 'bg-error/20'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-black ${
                              passed ? 'text-success' : 'text-error'
                            }`}
                          >
                            {passed ? '✓' : '✕'}
                          </Text>
                        </View>
                        <Text className="text-onSurface text-xs font-black uppercase tracking-widest flex-1">
                          {tc.name}
                        </Text>
                        <Text
                          className={`text-[10px] font-black uppercase tracking-widest ${
                            passed ? 'text-success' : 'text-error'
                          }`}
                        >
                          {passed ? 'PASSED' : 'FAILED'}
                        </Text>
                      </View>
                      {tc.error && !passed && (
                        <Text className="text-error text-[10px] mt-1">
                          {tc.error}
                        </Text>
                      )}
                    </View>
                  );
                })}

                {output && (
                  <>
                    <View className="h-[1px] bg-outline/20 my-4" />
                    <Text className="text-primary text-[10px] font-black uppercase tracking-[2px] mb-2">
                      System Output
                    </Text>
                    <Text className="text-primary text-xs font-mono bg-primary/5 p-3 rounded-xl border border-primary/10">
                      {output}
                    </Text>
                  </>
                )}
              </Card>
            )}

            {/* Copywriting radar metrics */}
            {moduleType === 'copywriting' && copyMetrics && copyMetrics.length > 0 && (
              <Card className="w-full bg-surfaceVariant/50 border-0 p-6 mb-6 rounded-[32px] items-center">
                <Text className="text-onSurface text-xs font-black uppercase tracking-[2px] mb-3">
                  Score breakdown
                </Text>
                <RadarChart metrics={copyMetrics} size={220} />
              </Card>
            )}
          </View>

          <Button 
            onPress={onNext} 
            variant="primary" 
            size="lg" 
            fullWidth
            className="rounded-full py-6 shadow-glow"
          >
            <Text className="text-onPrimary text-lg font-black uppercase tracking-widest">
              {primaryButtonLabel}
            </Text>
          </Button>

          {/* Optional share score action */}
          <TouchableOpacity
            onPress={handleShare}
            className="mt-4 self-center"
            activeOpacity={0.8}
          >
            <Text className="text-primary text-xs font-black uppercase tracking-widest">
              Share your score
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
