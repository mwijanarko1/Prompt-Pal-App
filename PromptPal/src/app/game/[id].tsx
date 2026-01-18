import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLevelById } from '@/features/levels/data';
import { useGameStore, Level } from '@/features/game/store';
import { logger } from '@/lib/logger';

// Import module-specific game views
import { ImageGameView } from '@/features/game/components/ImageGameView';
import { CodeGameView } from '@/features/game/components/CodeGameView';
import { CopyGameView } from '@/features/game/components/CopyGameView';

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { updateLevelProgress, completeLevel, loseLife, currentLives } = useGameStore();

  const [level, setLevel] = useState<Level | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());

  useEffect(() => {
    const foundLevel = getLevelById(id as string);
    if (!foundLevel) {
      Alert.alert('Error', 'Level not found', [
        { text: 'OK', onPress: () => router.back() }
      ]);
      return;
    }

    setLevel(foundLevel);
    setStartTime(new Date());

    // Mark level as attempted
    updateLevelProgress(foundLevel.id, {
      attempts: (foundLevel.progress?.attempts || 0) + 1,
    });
  }, [id]);

  const handleLevelComplete = (score: number, feedback: string[]) => {
    if (!level) return;

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);

    // Update progress
    updateLevelProgress(level.id, {
      timeSpent: (level.progress?.timeSpent || 0) + timeSpent,
    });

    // Complete level
    completeLevel(level.id, score, level.points);

    // Show results
    Alert.alert(
      score >= level.passingScore ? 'Level Complete!' : 'Try Again',
      `Score: ${score}%\n\n${feedback.join('\n')}`,
      [
        {
          text: score >= level.passingScore ? 'Continue' : 'Retry',
          onPress: () => {
            if (score >= level.passingScore) {
              router.back();
            } else if (currentLives > 0) {
              // Reset for retry
              setStartTime(new Date());
            } else {
              router.back();
            }
          }
        }
      ]
    );
  };

  const handleLevelFailed = () => {
    loseLife();

    if (currentLives > 1) {
      Alert.alert(
        'Level Failed',
        `You have ${currentLives - 1} lives remaining.`,
        [
          { text: 'Retry', onPress: () => setStartTime(new Date()) },
          { text: 'Quit', onPress: () => router.back(), style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Game Over',
        'You\'ve run out of lives. Better luck next time!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  };

  if (!level) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading level...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderGameView = () => {
    switch (level.module) {
      case 'image':
        return (
          <ImageGameView
            level={level}
            onComplete={handleLevelComplete}
            onFail={handleLevelFailed}
          />
        );
      case 'code':
        return (
          <CodeGameView
            level={level}
            onComplete={handleLevelComplete}
            onFail={handleLevelFailed}
          />
        );
      case 'copy':
        return (
          <CopyGameView
            level={level}
            onComplete={handleLevelComplete}
            onFail={handleLevelFailed}
          />
        );
      default:
        return (
          <View style={styles.error}>
            <Text style={styles.errorText}>Unsupported module type</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderGameView()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
  },
});
