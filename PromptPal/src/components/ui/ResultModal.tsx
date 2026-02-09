import React from 'react';
import { View, Text, Modal, TouchableOpacity, Share } from 'react-native';
import { Button, Card, RadarChart } from './index';

export type ModuleType = 'image' | 'code' | 'copywriting';

/** S3: Returns subtitle label for ResultModal by module type (for unit tests). */
export function getResultModalSubtitleLabel(moduleType?: ModuleType): string {
  return moduleType === 'image'
    ? 'SIMILARITY SCORE'
    : moduleType === 'copywriting'
      ? 'COPY SCORE'
      : 'LOGIC VALIDATION';
}

interface TestCaseResult {
  name: string;
  passed: boolean;
  error?: string;
}

interface ResultModalProps {
  visible: boolean;
  score: number;
  xp: number;
  /** Whether the user passed the challenge (default true). When false, shows "Challenge Failed" and Try Again styling. */
  passed?: boolean;
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
  /** Image challenge: similarity score 0–100 from scoring service */
  imageSimilarity?: number;
  /** Image challenge: feedback strings from scoring service */
  imageFeedback?: string[];
  /** Image challenge: keywords matched from scoring service */
  keywordsMatched?: string[];
}

export function ResultModal({
  visible,
  score,
  xp,
  passed = true,
  moduleType,
  testCases,
  copyMetrics,
  output,
  primaryLabel,
  onNext,
  onClose,
  onShare,
  imageSimilarity,
  imageFeedback,
  keywordsMatched,
}: ResultModalProps) {
  const subtitleLabel = getResultModalSubtitleLabel(moduleType);

  const primaryButtonLabel =
    primaryLabel || (passed ? 'Next Challenge →' : 'Try Again');

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
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 shadow-lg ${
                    passed ? 'bg-success/20 shadow-success/20' : 'bg-error/20 shadow-error/20'
                  }`}
                >
                  <Text
                    className={`text-2xl font-black ${passed ? 'text-success' : 'text-error'}`}
                  >
                    {passed ? '✓' : '✕'}
                  </Text>
                </View>
                <View>
                  <Text className="text-onSurface text-2xl font-black tracking-tight">
                    {passed ? 'Challenge Passed!' : 'Challenge Failed'}
                  </Text>
                  <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[3px] font-black">
                    {subtitleLabel}: {score}%
                  </Text>
                </View>
              </View>
              {passed && (
                <Text className="text-success text-3xl font-black tracking-tighter">
                  +{xp} XP
                </Text>
              )}
            </View>

            {/* Image challenge: similarity, feedback, keywords */}
            {moduleType === 'image' && (imageFeedback?.length || keywordsMatched?.length) && (
              <Card className="w-full bg-surfaceVariant/50 border-0 p-6 mb-6 rounded-[32px]">
                <Text className="text-onSurface text-xs font-black uppercase tracking-[2px] mb-3">
                  Score breakdown
                </Text>
                {imageSimilarity != null && (
                  <Text className="text-onSurfaceVariant text-sm mb-2">
                    Visual similarity: <Text className="text-onSurface font-bold">{imageSimilarity}%</Text>
                  </Text>
                )}
                {keywordsMatched && keywordsMatched.length > 0 && (
                  <View className="mb-2">
                    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-1">
                      Keywords captured
                    </Text>
                    <Text className="text-onSurface text-sm">{keywordsMatched.join(', ')}</Text>
                  </View>
                )}
                {imageFeedback && imageFeedback.length > 0 && (
                  <View>
                    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-1">
                      Feedback
                    </Text>
                    {imageFeedback.map((line, i) => (
                      <Text key={i} className="text-onSurface text-sm mb-0.5">
                        • {line}
                      </Text>
                    ))}
                  </View>
                )}
              </Card>
            )}

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
