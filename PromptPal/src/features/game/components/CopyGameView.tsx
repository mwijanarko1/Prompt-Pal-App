import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Input } from '@/components/ui';
import { useGameStore, CopyLevel } from '@/features/game/store';
import { logger } from '@/lib/logger';

interface CopyGameViewProps {
  level: CopyLevel;
  onComplete: (score: number, feedback: string[]) => void;
  onFail: () => void;
}

export function CopyGameView({ level, onComplete, onFail }: CopyGameViewProps) {
  const [copy, setCopy] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { currentLives } = useGameStore();

  const handleEvaluate = async () => {
    if (!copy.trim()) {
      Alert.alert('Error', 'Please write some copy to evaluate');
      return;
    }

    setIsEvaluating(true);
    try {
      const score = evaluateCopy(copy, level);
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
              { text: 'Retry', onPress: () => setCopy('') },
              { text: 'Quit', onPress: onFail, style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      logger.error('CopyGameView', error, { operation: 'evaluateCopy' });
      Alert.alert('Error', 'Failed to evaluate your copy. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluateCopy = (userCopy: string, level: CopyLevel): number => {
    const trimmedCopy = userCopy.trim();
    const targetCopy = level.targetCopy;

    let score = 50; // Base score

    // Length check
    const wordCount = trimmedCopy.split(/\s+/).length;
    const targetWordCount = level.wordCount;
    const lengthDiff = Math.abs(wordCount - targetWordCount);

    if (lengthDiff === 0) {
      score += 15; // Perfect length
    } else if (lengthDiff <= 5) {
      score += 10; // Close to target
    } else if (lengthDiff <= 15) {
      score += 5; // Reasonable length
    }

    // Content analysis (simplified)
    const userWords = trimmedCopy.toLowerCase().split(/\s+/);
    const targetWords = targetCopy.toLowerCase().split(/\s+/);

    // Check for key phrases
    const keyPhrases = level.context.toLowerCase().split(' ');
    let matchingPhrases = 0;

    keyPhrases.forEach(phrase => {
      if (trimmedCopy.toLowerCase().includes(phrase)) {
        matchingPhrases++;
      }
    });

    score += (matchingPhrases / keyPhrases.length) * 20;

    // Tone analysis (basic keyword matching)
    const toneKeywords = getToneKeywords(level.tone);
    let toneMatches = 0;

    toneKeywords.forEach(keyword => {
      if (trimmedCopy.toLowerCase().includes(keyword)) {
        toneMatches++;
      }
    });

    score += (toneMatches / toneKeywords.length) * 15;

    return Math.min(100, Math.max(0, score));
  };

  const getToneKeywords = (tone: string): string[] => {
    const toneMap: Record<string, string[]> = {
      'motivational': ['transform', 'achieve', 'goals', 'start', 'today', 'now'],
      'elegant': ['indulge', 'symphony', 'exquisite', 'refined', 'sophisticated'],
      'professional': ['comprehensive', 'reliable', 'expert', 'trusted', 'quality'],
      'casual': ['awesome', 'great', 'fun', 'easy', 'simple'],
    };

    return toneMap[tone.toLowerCase()] || ['effective', 'compelling', 'engaging'];
  };

  const generateFeedback = (score: number, level: CopyLevel): string[] => {
    const feedback: string[] = [];
    const wordCount = copy.trim().split(/\s+/).length;

    if (score >= 90) {
      feedback.push('🎉 Outstanding! Your copy perfectly captures the essence and tone.');
    } else if (score >= 80) {
      feedback.push('👍 Excellent work! Your copy is compelling and well-targeted.');
    } else if (score >= 70) {
      feedback.push('🙂 Good job! Your copy is solid with room for refinement.');
    } else if (score >= 60) {
      feedback.push('🤔 Decent effort! Focus on the target audience and key messages.');
    } else {
      feedback.push('📝 Keep practicing! Study successful copy in this category.');
      feedback.push(`💡 Aim for ${level.tone} tone and around ${level.wordCount} words.`);
    }

    // Specific feedback
    if (Math.abs(wordCount - level.wordCount) > 10) {
      feedback.push(`📏 Word count: ${wordCount}/${level.wordCount}. Try to match the target length.`);
    }

    if (score < 70) {
      feedback.push(`🎯 Focus on: ${level.context}`);
      feedback.push(`🎭 Tone should be: ${level.tone}`);
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
        <View style={styles.contextTag}>
          <Text style={styles.contextText}>{level.context}</Text>
        </View>
        <View style={styles.livesContainer}>
          <Text style={styles.livesText}>Lives: {currentLives}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Context Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Context & Requirements</Text>
          <View style={styles.requirements}>
            <Text style={styles.requirement}>
              <Text style={styles.requirementLabel}>Context:</Text> {level.context}
            </Text>
            <Text style={styles.requirement}>
              <Text style={styles.requirementLabel}>Tone:</Text> {level.tone}
            </Text>
            <Text style={styles.requirement}>
              <Text style={styles.requirementLabel}>Target Length:</Text> ~{level.wordCount} words
            </Text>
          </View>
        </View>

        {/* Copy Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Copy</Text>
          <Input
            value={copy}
            onChangeText={setCopy}
            placeholder="Write compelling copy that matches the requirements above..."
            multiline
            numberOfLines={6}
            style={styles.copyInput}
          />

          <View style={styles.wordCount}>
            <Text style={styles.wordCountText}>
              Words: {copy.trim().split(/\s+/).filter(word => word.length > 0).length}
            </Text>
          </View>

          <Button
            onPress={handleEvaluate}
            loading={isEvaluating}
            disabled={!copy.trim() || isEvaluating}
            style={styles.evaluateButton}
          >
            Evaluate Copy
          </Button>
        </View>
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
  contextTag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  contextText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  requirements: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
  },
  requirement: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  requirementLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  copyInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  wordCount: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 12,
  },
  wordCountText: {
    color: '#888',
    fontSize: 12,
  },
  evaluateButton: {
    backgroundColor: '#9C27B0',
  },
});