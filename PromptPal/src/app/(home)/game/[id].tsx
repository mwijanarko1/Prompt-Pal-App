import { View, Text, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Button, Input } from '../../components/ui';
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
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-error text-xl">Level not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </View>
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
    <View className="flex-1 bg-background">
      {/* Top half: Target Image */}
      <View className="flex-1 p-4">
        <Text className="text-onSurface text-lg font-semibold mb-2 text-center">
          Target Image
        </Text>
        <Image
          source={{ uri: level.targetImageUrl }}
          className="flex-1 rounded-lg"
          resizeMode="contain"
        />
      </View>

      {/* Bottom half: Input and Controls */}
      <View className="flex-1 p-4">
        <Text className="text-onSurface text-lg font-semibold mb-2">
          Your Prompt
        </Text>

        <Input
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Describe what you see in the image above..."
          multiline
          numberOfLines={4}
          className="flex-1"
        />

        <View className="flex-row justify-between items-center mt-4">
          <Text className="text-onSurface">
            Lives: {lives}
          </Text>
          <Button
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim()}
          >
            Generate
          </Button>
        </View>

        {generatedImage && (
          <View className="mt-4">
            <Text className="text-onSurface text-sm mb-2">Your Result:</Text>
            <Image
              source={{ uri: generatedImage }}
              className="w-24 h-24 rounded-lg"
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    </View>
  );
}
