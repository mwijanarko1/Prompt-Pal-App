import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { LEVELS } from '@/features/levels/data';
import { UsageDisplay } from '@/components/UsageDisplay';
import { UsageClient, UsageStats } from '@/lib/usage';
import { useGameStore, ModuleType } from '@/features/game/store';
import { logger } from '@/lib/logger';

export default function HomeScreen() {
  const router = useRouter();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { unlockedLevels, completedLevels } = useGameStore();

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const usageData = await UsageClient.getUsage();
      setUsage(usageData);
    } catch (error) {
      logger.error('HomeScreen', error, { operation: 'loadUsage' });
      // Don't show error to user, just use default state
    } finally {
      setLoading(false);
    }
  };

  const handleLevelPress = (levelId: string) => {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level) {
      Alert.alert('Error', 'Level not found');
      return;
    }

    if (!unlockedLevels.includes(levelId)) {
      Alert.alert('Level Locked', 'Complete previous levels to unlock this one!');
      return;
    }

    router.push(`/game/${levelId}`);
  };

  const getLevelsByModule = (module: ModuleType) => {
    return LEVELS.filter(level => level.module === module);
  };

  const getModuleDisplayName = (module: ModuleType) => {
    switch (module) {
      case 'image': return '🎨 Image Generation';
      case 'code': return '💻 Code Writing';
      case 'copy': return '📝 Copywriting';
      default: return module;
    }
  };

  const getModuleColor = (module: ModuleType) => {
    switch (module) {
      case 'image': return '#2196F3';
      case 'code': return '#4CAF50';
      case 'copy': return '#FF9800';
      default: return '#666';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-12 pb-6 px-6">
        <View className="flex-row justify-center items-center mb-4">
          <Text className="text-primary text-4xl font-bold">Prompt</Text>
          <Text className="text-secondary text-4xl font-bold">Pal</Text>
        </View>
        <Text className="text-onSurface text-center text-lg">
          Master AI prompt engineering through creative challenges
        </Text>
      </View>

      {/* Usage Display */}
      {usage && (
        <View className="px-6 mb-4">
          <UsageDisplay usage={usage} compact />
        </View>
      )}

      {/* Level Selection */}
      <ScrollView className="flex-1 px-6">
        <Text className="text-onSurface text-xl font-semibold mb-4">Select Module</Text>

        {(['image', 'code', 'copy'] as ModuleType[]).map((module) => {
          const moduleLevels = getLevelsByModule(module);
          const unlockedCount = moduleLevels.filter(level => unlockedLevels.includes(level.id)).length;
          const completedCount = moduleLevels.filter(level => completedLevels.includes(level.id)).length;

          return (
            <View key={module} className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-onSurface text-lg font-semibold">
                  {getModuleDisplayName(module)}
                </Text>
                <Text className="text-outline text-sm">
                  {completedCount}/{moduleLevels.length} completed
                </Text>
              </View>

              {moduleLevels.map((level) => {
                const isUnlocked = unlockedLevels.includes(level.id);
                const isCompleted = completedLevels.includes(level.id);

                return (
                  <TouchableOpacity
                    key={level.id}
                    onPress={() => handleLevelPress(level.id)}
                    disabled={!isUnlocked}
                    className={`p-4 rounded-lg mb-2 border-2 ${
                      isUnlocked
                        ? 'border-primary bg-surfaceVariant'
                        : 'border-outline bg-surfaceVariant opacity-50'
                    }`}
                  >
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className={`text-base font-semibold ${
                          isUnlocked ? 'text-onSurface' : 'text-outline'
                        }`}>
                          {level.title}
                        </Text>
                        <Text className={`text-sm capitalize ${
                          isUnlocked ? 'text-onSurfaceVariant' : 'text-outline'
                        }`}>
                          {level.difficulty} • {level.points} pts
                        </Text>
                      </View>

                      <View className="items-end">
                        {isCompleted && (
                          <Text className="text-success text-sm font-semibold mb-1">
                            ✓ Completed
                          </Text>
                        )}
                        <View
                          className="px-2 py-1 rounded"
                          style={{ backgroundColor: getModuleColor(level.module) }}
                        >
                          <Text className="text-white text-xs font-medium">
                            {level.passingScore}% to pass
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
