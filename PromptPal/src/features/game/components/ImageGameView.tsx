import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Input } from '@/components/ui';
import { AIProxyClient } from '@/lib/aiProxy';
import { useGameStore, ImageLevel } from '@/features/game/store';
import { logger } from '@/lib/logger';

interface ImageGameViewProps {
  level: ImageLevel;
  onComplete: (score: number, feedback: string[]) => void;
  onFail: () => void;
}

export function ImageGameView({ level, onComplete, onFail }: ImageGameViewProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { currentLives } = useGameStore();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt to generate an image');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await AIProxyClient.generateImage(prompt);
      setGeneratedImage(result.imageUrl!);
    } catch (error) {
      logger.error('ImageGameView', error, { operation: 'generateImage' });

      if (error.response?.status === 429) {
        Alert.alert('Quota Exceeded', 'You\'ve reached your usage limit. Upgrade to Pro for more calls.');
      } else {
        Alert.alert('Error', 'Failed to generate image. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEvaluate = async () => {
    if (!generatedImage) return;

    setIsEvaluating(true);
    try {
      // For now, simulate AI evaluation (Phase 3 will implement real AI comparison)
      // In production, this would compare the generated image with the target
      const score = Math.floor(Math.random() * 41) + 60; // Random score between 60-100

      const feedback = generateFeedback(score, level);

      if (score >= level.passingScore) {
        onComplete(score, feedback);
      } else {
        if (currentLives <= 1) {
          onFail();
        } else {
          Alert.alert(
            'Try Again',
            `Score: ${score}%\n\n${feedback.join('\n')}\n\nYou have ${currentLives - 1} lives remaining.`,
            [
              { text: 'Retry', onPress: () => resetAttempt() },
              { text: 'Quit', onPress: onFail, style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      logger.error('ImageGameView', error, { operation: 'evaluateImage' });
      Alert.alert('Error', 'Failed to evaluate your image. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetAttempt = () => {
    setGeneratedImage(null);
    setPrompt('');
  };

  const generateFeedback = (score: number, level: ImageLevel): string[] => {
    const feedback: string[] = [];

    if (score >= 90) {
      feedback.push('🎉 Excellent work! Your prompt perfectly captured the essence of the target image.');
    } else if (score >= 80) {
      feedback.push('👍 Great job! Your image is very close to the target.');
    } else if (score >= 70) {
      feedback.push('🙂 Good effort! You\'re on the right track.');
    } else {
      feedback.push('🤔 Keep trying! Focus on describing specific visual elements.');
      feedback.push(`Try including keywords like: ${level.hiddenPromptKeywords.slice(0, 3).join(', ')}`);
    }

    if (score < level.passingScore) {
      feedback.push(`\nNeed ${level.passingScore}% to pass. Current score: ${score}%`);
    }

    return feedback;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{level.title}</Text>
        <Text style={styles.description}>{level.description}</Text>
        <View style={styles.livesContainer}>
          <Text style={styles.livesText}>Lives: {currentLives}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Target Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Image</Text>
          <Image
            source={{ uri: level.targetImageUrl }}
            style={styles.targetImage}
            resizeMode="contain"
          />
          {level.targetPrompt && (
            <Text style={styles.hint}>
              💡 Hint: The target prompt includes: {level.hiddenPromptKeywords.join(', ')}
            </Text>
          )}
        </View>

        {/* Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Prompt</Text>
          <Input
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Describe what you see in the target image above..."
            multiline
            numberOfLines={4}
            style={styles.promptInput}
          />

          <Button
            onPress={handleGenerate}
            loading={isGenerating}
            disabled={!prompt.trim() || isGenerating}
            style={styles.generateButton}
          >
            Generate Image
          </Button>
        </View>

        {/* Generated Image Section */}
        {generatedImage && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Result</Text>
            <Image
              source={{ uri: generatedImage }}
              style={styles.generatedImage}
              resizeMode="cover"
            />

            <Button
              onPress={handleEvaluate}
              loading={isEvaluating}
              disabled={isEvaluating}
              style={styles.evaluateButton}
            >
              Evaluate Result
            </Button>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  livesContainer: {
    alignSelf: 'flex-start',
  },
  livesText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  targetImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  hint: {
    color: '#BB86FC',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 20,
  },
  promptInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  generateButton: {
    marginTop: 12,
  },
  generatedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#333',
    marginBottom: 12,
  },
  evaluateButton: {
    backgroundColor: '#4CAF50',
  },
});