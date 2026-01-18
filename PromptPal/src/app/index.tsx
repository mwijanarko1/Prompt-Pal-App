import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LEVELS } from '../features/levels/data';
import { useGameStore } from '../features/game/store';

export default function HomeScreen() {
  const router = useRouter();
  const { unlockedLevels, completedLevels } = useGameStore();

  const isLevelUnlocked = (levelId: string) => {
    return unlockedLevels.includes(levelId);
  };

  const isLevelCompleted = (levelId: string) => {
    return completedLevels.includes(levelId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-400';
      case 'intermediate':
        return 'text-yellow-400';
      case 'advanced':
        return 'text-red-400';
      default:
        return 'text-onSurface';
    }
  };

  const handleLevelPress = (levelId: string) => {
    if (isLevelUnlocked(levelId)) {
      router.push(`/game/${levelId}`);
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="pt-12 pb-6 px-6 items-center">
        <View className="flex-row">
          <Text className="text-[#FF770F] text-5xl font-bold">Prompt</Text>
          <Text className="text-[#553EFF] text-5xl font-bold">Pal</Text>
        </View>
        <Text className="text-onSurface/70 text-sm mt-2">
          Master prompt engineering through gameplay
        </Text>
      </View>

      {/* Level List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-onSurface text-xl font-semibold mb-4 px-2">
          Levels
        </Text>
        
        {LEVELS.map((level, index) => {
          const unlocked = isLevelUnlocked(level.id);
          const completed = isLevelCompleted(level.id);

          return (
            <TouchableOpacity
              key={level.id}
              onPress={() => handleLevelPress(level.id)}
              disabled={!unlocked}
              className={`mb-4 rounded-xl overflow-hidden ${
                unlocked ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <View className="bg-surface border border-accent/20 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                      <Text className="text-primary font-bold text-lg">
                        {index + 1}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-onSurface font-semibold text-lg">
                        Level {index + 1}
                      </Text>
                      <Text className={`text-sm capitalize ${getDifficultyColor(level.difficulty)}`}>
                        {level.difficulty}
                      </Text>
                    </View>
                  </View>
                  
                  {completed && (
                    <View className="bg-green-500/20 px-3 py-1 rounded-full">
                      <Text className="text-green-400 text-xs font-semibold">
                        ✓ Completed
                      </Text>
                    </View>
                  )}
                  
                  {!unlocked && (
                    <View className="bg-surface/50 px-3 py-1 rounded-full">
                      <Text className="text-onSurface/50 text-xs font-semibold">
                        🔒 Locked
                      </Text>
                    </View>
                  )}
                </View>

                {unlocked && (
                  <View className="mt-2">
                    <Image
                      source={{ uri: level.targetImageUrl }}
                      className="w-full h-32 rounded-lg"
                      resizeMode="cover"
                    />
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-onSurface/70 text-xs">
                        Passing Score: {level.passingScore}%
                      </Text>
                      <Text className="text-onSurface/70 text-xs">
                        {level.hiddenPromptKeywords.length} keywords
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
