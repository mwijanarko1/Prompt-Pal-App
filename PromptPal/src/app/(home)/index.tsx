import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { LEVELS, getUnlockedLevels } from '@/features/levels/data';
import { UsageDisplay } from '@/components/UsageDisplay';
import { UsageClient, UsageStats } from '@/lib/usage';
import { useGameStore } from '@/features/game/store';
import { logger } from '@/lib/logger';
import { SignOutButton } from '@/components/SignOutButton'

export default function HomeScreen() {
  const { user } = useUser()
  const router = useRouter();
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { unlockedLevels } = useGameStore();

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

    router.push(`/(home)/game/${levelId}`);
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
      <SignedIn>
        {/* Header */}
        <View className="pt-12 pb-6 px-6">
          <View className="flex-row justify-center items-center mb-2">
            <Text className="text-primary text-4xl font-bold">Prompt</Text>
            <Text className="text-secondary text-4xl font-bold">Pal</Text>
          </View>
          <Text className="text-onSurface text-center text-lg mb-4">
            Welcome back, {user?.emailAddresses[0].emailAddress}!
          </Text>
          <SignOutButton />
        </View>

        {/* Usage Display */}
        {usage && (
          <View className="px-6 mb-4">
            <UsageDisplay usage={usage} compact />
          </View>
        )}

        {/* Level Selection */}
        <ScrollView className="flex-1 px-6">
          <Text className="text-onSurface text-xl font-semibold mb-4">Select Level</Text>

          {LEVELS.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const isCompleted = useGameStore.getState().completedLevels.includes(level.id);

            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => handleLevelPress(level.id)}
                disabled={!isUnlocked}
                className={`p-4 rounded-lg mb-3 border-2 ${
                  isUnlocked
                    ? 'border-primary bg-surfaceVariant'
                    : 'border-outline bg-surfaceVariant opacity-50'
                }`}
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className={`text-lg font-semibold ${
                      isUnlocked ? 'text-onSurface' : 'text-outline'
                    }`}>
                      Level {level.id.split('_')[1]}
                    </Text>
                    <Text className={`text-sm capitalize ${
                      isUnlocked ? 'text-onSurfaceVariant' : 'text-outline'
                    }`}>
                      {level.difficulty}
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
                      style={{ backgroundColor: getDifficultyColor(level.difficulty) }}
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
        </ScrollView>
      </SignedIn>
      <SignedOut>
        <View className="flex-1 bg-background p-6 justify-center">
          <View className="flex-row justify-center items-center mb-8">
            <Text className="text-primary text-4xl font-bold">Prompt</Text>
            <Text className="text-secondary text-4xl font-bold">Pal</Text>
          </View>
          <Text className="text-onSurface text-center text-lg mb-8">
            Master AI prompt engineering through creative challenges
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity className="bg-primary p-4 rounded-lg mb-4">
              <Text className="text-onPrimary text-center font-semibold">Sign in</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity className="bg-secondary p-4 rounded-lg">
              <Text className="text-onSecondary text-center font-semibold">Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SignedOut>
    </View>
  );
}
