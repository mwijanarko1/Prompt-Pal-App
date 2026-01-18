import { View, Text, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Button, Input, ResultModal } from '../../components/ui';
import { getLevelById, getNextLevel } from '../../features/levels/data';
import { geminiService } from '../../lib/gemini';
import { useGameStore } from '../../features/game/store';

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [score, setScore] = useState(0);

  const { lives, loseLife, startLevel, unlockLevel, completeLevel, endLevel } = useGameStore();

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
    return () => {
      endLevel();
    };
  }, [startLevel, endLevel, level.id]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await geminiService.generateImage(prompt);
      setGeneratedImage(imageUrl);

      // Compare images and get score
      const similarityScore = await geminiService.compareImages(
        level.targetImageUrl,
        imageUrl
      );
      
      setScore(similarityScore);
      setShowResultModal(true);

      // Handle level completion
      if (similarityScore >= level.passingScore) {
        completeLevel(level.id);
        
        // Unlock next level
        const nextLevel = getNextLevel(level.id);
        if (nextLevel) {
          unlockLevel(nextLevel.id);
        }
      } else {
        loseLife();
      }
    } catch (error) {
      console.error('Error generating image:', error);
      // You might want to show an error toast here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextLevel = () => {
    const nextLevel = getNextLevel(level.id);
    if (nextLevel) {
      setShowResultModal(false);
      setGeneratedImage(null);
      setPrompt('');
      router.replace(`/game/${nextLevel.id}`);
    } else {
      // No more levels - go back to home
      handleClose();
    }
  };

  const handleRetry = () => {
    setShowResultModal(false);
    setGeneratedImage(null);
    setPrompt('');
  };

  const handleClose = () => {
    setShowResultModal(false);
    router.back();
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top half: Target Image */}
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-onSurface text-lg font-semibold">
            Target Image
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-onSurface/70 text-sm">Lives:</Text>
            <View className="flex-row gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <View
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < lives ? 'bg-red-500' : 'bg-surface'
                  }`}
                />
              ))}
            </View>
          </View>
        </View>
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

        <View className="flex-row justify-end items-center mt-4">
          <Button
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim() || isGenerating}
          >
            Generate
          </Button>
        </View>

        {generatedImage && !showResultModal && (
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

      {/* Result Modal */}
      <ResultModal
        visible={showResultModal}
        onClose={handleClose}
        targetImageUrl={level.targetImageUrl}
        resultImageUrl={generatedImage || ''}
        score={score}
        passingScore={level.passingScore}
        onNextLevel={handleNextLevel}
        onRetry={handleRetry}
      />
    </View>
  );
}
