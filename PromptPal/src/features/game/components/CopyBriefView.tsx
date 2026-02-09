import { View, Text, ScrollView, Image } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Ionicons } from '@expo/vector-icons';
import { Level } from '../store';

interface CopyBriefViewProps {
  level: Level;
}

export function CopyBriefView({ level }: CopyBriefViewProps) {
  if (level.type !== 'copywriting') {
    return null;
  }

  // Determine word limit based on difficulty
  const getWordLimit = () => {
    switch (level.difficulty) {
      case 'beginner':
        return '20-30 words';
      case 'intermediate':
        return '50-75 words';
      case 'advanced':
        return '100-150 words';
      default:
        return '20-30 words';
    }
  };

  // Get difficulty color
  const getDifficultyColor = () => {
    switch (level.difficulty) {
      case 'beginner':
        return '#03DAC6'; // secondary (teal)
      case 'intermediate':
        return '#BB86FC'; // primary (purple)
      case 'advanced':
        return '#CF6679'; // error (red)
      default:
        return '#FFFFFF';
    }
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="p-4 space-y-4">
        {/* Header with Title and Difficulty Badge */}
        <View className="flex-row items-center justify-between mb-2">
          {level.moduleTitle && (
            <Text className="text-onSurfaceVariant text-sm font-semibold">
              {level.moduleTitle}
            </Text>
          )}
          <Badge 
            label={level.difficulty.toUpperCase()} 
            variant="primary"
            className="px-3 py-1.5"
          />
        </View>

        {/* Brief Title Card */}
        {level.briefTitle && (
          <Card variant="elevated" padding="lg">
            <View className="flex-row items-center mb-3">
              <Ionicons name="document-text-outline" size={24} color="#BB86FC" />
              <Text className="text-onSurface text-xl font-bold ml-3">
                {level.briefTitle}
              </Text>
            </View>
          </Card>
        )}

        {/* Marketing Brief Card */}
        <Card title="Marketing Brief" variant="elevated" padding="lg">
          <View className="space-y-4">
            {/* Product */}
            {level.briefProduct && (
              <View className="bg-surfaceVariant/50 rounded-xl p-3 border border-outline/20">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="cube-outline" size={18} color="#03DAC6" />
                  <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-wider ml-2">
                    Product
                  </Text>
                </View>
                <Text className="text-onSurface text-base font-semibold ml-6">
                  {level.briefProduct}
                </Text>
              </View>
            )}

            {/* Target Audience */}
            {level.briefTarget && (
              <View className="bg-surfaceVariant/50 rounded-xl p-3 border border-outline/20">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="people-outline" size={18} color="#03DAC6" />
                  <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-wider ml-2">
                    Target Audience
                  </Text>
                </View>
                <Text className="text-onSurface text-base font-semibold ml-6">
                  {level.briefTarget}
                </Text>
              </View>
            )}

            {/* Tone */}
            {level.briefTone && (
              <View className="bg-surfaceVariant/50 rounded-xl p-3 border border-outline/20">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="color-palette-outline" size={18} color="#03DAC6" />
                  <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-wider ml-2">
                    Tone
                  </Text>
                </View>
                <Text className="text-onSurface text-base font-semibold ml-6">
                  {level.briefTone}
                </Text>
              </View>
            )}

            {/* Goal */}
            {level.briefGoal && (
              <View className="bg-primary/10 rounded-xl p-3 border border-primary/30">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="flag-outline" size={18} color="#BB86FC" />
                  <Text className="text-primary text-xs font-bold uppercase tracking-wider ml-2">
                    Goal
                  </Text>
                </View>
                <Text className="text-onSurface text-base leading-6 ml-6">
                  {level.briefGoal}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Word Limit Indicator */}
        <Card variant="outlined" padding="md">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="text-outline" size={20} color={getDifficultyColor()} />
              <Text className="text-onSurface font-semibold ml-2">
                Word Limit:
              </Text>
            </View>
            <View 
              className="px-3 py-1.5 rounded-full"
              style={{ backgroundColor: getDifficultyColor() + '20' }}
            >
              <Text 
                className="font-bold text-sm"
                style={{ color: getDifficultyColor() }}
              >
                {getWordLimit()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Target Image */}
        {level.targetImageUrl && (
          <Card title="Reference Image" variant="outlined" padding="md">
            <Text className="text-onSurfaceVariant text-sm mb-3">
              Use this image as context for your copy:
            </Text>
            <View className="rounded-xl overflow-hidden bg-surfaceVariant">
              <Image
                source={{ uri: level.targetImageUrl }}
                className="w-full h-48"
                resizeMode="cover"
              />
            </View>
          </Card>
        )}

        {/* Metrics Preview (if available) */}
        {level.metrics && level.metrics.length > 0 && (
          <Card title="Evaluation Metrics" variant="outlined" padding="md">
            <Text className="text-onSurfaceVariant text-sm mb-3">
              Your copy will be evaluated on:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {level.metrics.map((metric, index) => (
                <View
                  key={index}
                  className="bg-surfaceVariant/50 px-3 py-2 rounded-lg border border-outline/20"
                >
                  <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-wider">
                    {metric.label}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}