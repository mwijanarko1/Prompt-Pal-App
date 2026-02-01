import { View, Text, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { RadarChart } from '@/components/ui/RadarChart';
import type { CopyScoringResult } from '@/lib/scoring/copyScoring';
import { getMatchedRequirements } from '@/features/game/utils/copyUtils';

export interface CopyAnalysisViewProps {
  copy: string;
  copyResult: CopyScoringResult | null;
  requiredElements?: string[];
}

const { width } = Dimensions.get('window');
const CHART_SIZE = Math.min(width - 80, 240);

export function CopyAnalysisView({ copy, copyResult, requiredElements = [] }: CopyAnalysisViewProps) {
  const hasCopy = copy.trim().length > 0;
  const hasResult = copyResult != null;
  const hasRequirements = requiredElements.length > 0;
  const matchedRequirements = hasRequirements ? getMatchedRequirements(copy, requiredElements) : [];

  if (!hasCopy && !hasResult) return null;

  return (
    <View className="pb-6 px-6">
      {hasCopy && (
        <Card className="mb-4" padding="md" variant="outlined">
          <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-2">
            Generated copy
          </Text>
          <View className="bg-surfaceVariant/50 rounded-xl p-3 border border-outline/50">
            <Text className="text-onSurface text-sm leading-5" selectable>
              {copy}
            </Text>
          </View>
        </Card>
      )}

      {hasResult && (
        <>
          <Card className="mb-4" padding="md" variant="outlined">
            <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-3">
              Word count
            </Text>
            <View className="flex-row items-center">
              <Text className="text-onSurface text-lg font-bold mr-2">{copyResult.wordCount}</Text>
              <Text className="text-onSurfaceVariant text-sm">words</Text>
              {copyResult.withinLimit ? (
                <View className="flex-row items-center ml-3">
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text className="text-success text-sm font-medium ml-1">Within limit</Text>
                </View>
              ) : (
                <View className="flex-row items-center ml-3">
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text className="text-error text-sm font-medium ml-1">Outside limit</Text>
                </View>
              )}
            </View>
          </Card>

          {copyResult.metrics != null && copyResult.metrics.length > 0 && (
            <Card className="mb-4" padding="md" variant="outlined">
              <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-3">
                Metrics
              </Text>
              <View className="items-center">
                <RadarChart metrics={copyResult.metrics} size={CHART_SIZE} color="#6366f1" />
              </View>
            </Card>
          )}

          {hasRequirements && matchedRequirements.length > 0 && (
            <Card className="mb-4" padding="md" variant="outlined">
              <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-3">
                Requirements
              </Text>
              {matchedRequirements.map(({ label, matched }) => (
                <View
                  key={label}
                  className="flex-row items-center py-2 border-b border-outline/20 last:border-b-0"
                >
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                      matched ? 'bg-success/20' : 'bg-error/20'
                    }`}
                  >
                    <Ionicons
                      name={matched ? 'checkmark' : 'close'}
                      size={14}
                      color={matched ? '#10B981' : '#EF4444'}
                    />
                  </View>
                  <Text className="text-onSurface text-sm flex-1 font-medium">{label}</Text>
                  <Text
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      matched ? 'text-success' : 'text-error'
                    }`}
                  >
                    {matched ? 'Matched' : 'Missing'}
                  </Text>
                </View>
              ))}
            </Card>
          )}

          {copyResult.feedback != null && copyResult.feedback.length > 0 && (
            <Card className="mb-4 bg-surfaceVariant/30" padding="md" variant="outlined">
              <Text className="text-onSurfaceVariant text-[10px] uppercase tracking-[2px] font-bold mb-2">
                Feedback
              </Text>
              <View className="gap-2">
                {copyResult.feedback.map((line, i) => (
                  <Text key={i} className="text-onSurface text-sm">
                    • {line}
                  </Text>
                ))}
              </View>
            </Card>
          )}
        </>
      )}
    </View>
  );
}
