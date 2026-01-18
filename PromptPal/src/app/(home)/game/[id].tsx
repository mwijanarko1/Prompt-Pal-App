import { View, Text, Image, Alert, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { getLevelById } from '@/features/levels/data';
import { AIProxyClient } from '@/lib/aiProxy';
import { UsageClient } from '@/lib/usage';
import { useGameStore } from '@/features/game/store';
import { logger } from '@/lib/logger';

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const { lives, loseLife, startLevel } = useGameStore();

  const level = getLevelById(id as string);

  if (!level) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Card className="w-full items-center p-8">
            <Text className="text-error text-xl font-bold mb-4">Level Not Found</Text>
            <Text className="text-onSurfaceVariant text-center mb-6">
              The level you're looking for doesn't exist or has been removed.
            </Text>
            <Button onPress={() => router.back()} variant="primary">
              Go Back
            </Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // Start the level when component mounts
  useEffect(() => {
    startLevel(level.id);
  }, [startLevel, level.id]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await AIProxyClient.generateImage(prompt);
      setGeneratedImage(result.imageUrl!);

      // For now, use a simple scoring mechanism (Phase 3 will implement real AI comparison)
      const score = Math.floor(Math.random() * 41) + 60; // Random score between 60-100

      Alert.alert(
        'Result',
        `Your prompt scored: ${score}% similarity!\n\n${score >= level.passingScore ? 'Level passed!' : 'Try again!'}`,
        [
          {
            text: score >= level.passingScore ? 'Next Level' : 'Try Again',
            onPress: () => {
              if (score >= level.passingScore) {
                router.back();
              } else {
                loseLife();
                setGeneratedImage(null);
                setPrompt('');
              }
            },
          },
        ]
      );
    } catch (error) {
      logger.error('GameScreen', error, { operation: 'handleGenerate', promptLength: prompt.length });
      if (error.response?.status === 429) {
        Alert.alert('Quota Exceeded', 'You\'ve reached your usage limit. Upgrade to Pro for more calls.');
      } else {
        Alert.alert('Error', 'Failed to generate image. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 py-4 border-b border-outline">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Text className="text-primary text-2xl mr-2">←</Text>
            <Text className="text-primary text-base font-medium">Back</Text>
          </TouchableOpacity>

          <View className="flex-row items-center bg-surfaceVariant px-3 py-2 rounded-full">
            <Text className="text-primary text-sm mr-2">❤️</Text>
            <Text className="text-onSurface font-bold">{lives}</Text>
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-onSurface text-xl font-bold mb-1">
            Level {level.id.split('_')[1]}
          </Text>
          <Text className="text-onSurfaceVariant text-sm capitalize">
            {level.difficulty} Challenge • {level.passingScore}% to pass
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Target Image Section */}
        <View className="px-6 py-6">
          <Card className="p-0 overflow-hidden">
            <View className="px-4 py-3 border-b border-outline bg-surfaceVariant">
              <Text className="text-onSurface text-lg font-semibold text-center">
                🎯 Target Image
              </Text>
            </View>
            <View className="aspect-square">
              <Image
                source={{ uri: level.targetImageUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </Card>
        </View>

        {/* Prompt Input Section */}
        <View className="px-6 pb-6">
          <Card>
            <Text className="text-onSurface text-lg font-semibold mb-4">
              ✏️ Your Prompt
            </Text>

            <Input
              value={prompt}
              onChangeText={setPrompt}
              placeholder="Describe what you see in the image above in detail..."
              multiline
              numberOfLines={6}
              className="mb-6"
            />

            <Button
              onPress={handleGenerate}
              loading={isGenerating}
              disabled={!prompt.trim()}
              variant="primary"
              size="lg"
              fullWidth
            >
              {isGenerating ? 'Generating...' : 'Generate Image'}
            </Button>
          </Card>
        </View>

        {/* Generated Image Section */}
        {generatedImage && (
          <View className="px-6 pb-8">
            <Card>
              <Text className="text-onSurface text-lg font-semibold mb-4">
                🖼️ Your Result
              </Text>

              <View className="items-center">
                <Image
                  source={{ uri: generatedImage }}
                  className="w-64 h-64 rounded-xl shadow-lg"
                  resizeMode="cover"
                />
              </View>

              <Text className="text-onSurfaceVariant text-sm text-center mt-4">
                AI will evaluate your prompt and provide feedback
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
