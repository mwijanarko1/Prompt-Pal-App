import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Input } from '@/components/ui';
import { useGameStore, CodeLevel } from '@/features/game/store';
import { logger } from '@/lib/logger';

interface CodeGameViewProps {
  level: CodeLevel;
  onComplete: (score: number, feedback: string[]) => void;
  onFail: () => void;
}

export function CodeGameView({ level, onComplete, onFail }: CodeGameViewProps) {
  const [code, setCode] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  const { currentLives } = useGameStore();

  const handleEvaluate = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please write some code to evaluate');
      return;
    }

    setIsEvaluating(true);
    try {
      const score = evaluateCode(code, level);
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
              { text: 'Retry', onPress: () => setCode('') },
              { text: 'Quit', onPress: onFail, style: 'cancel' }
            ]
          );
        }
      }
    } catch (error) {
      logger.error('CodeGameView', error, { operation: 'evaluateCode' });
      Alert.alert('Error', 'Failed to evaluate your code. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluateCode = (userCode: string, level: CodeLevel): number => {
    try {
      // Basic syntax check
      if (level.language === 'javascript') {
        // Simple validation - in production, this would use a proper code evaluator
        const trimmedCode = userCode.trim();

        // Check for basic function structure
        if (!trimmedCode.includes('function')) {
          return 30; // Poor - no function
        }

        if (!trimmedCode.includes(level.targetCode.split('(')[0])) {
          return 40; // Poor - wrong function name
        }

        // Check for basic structure
        if (trimmedCode.includes('return')) {
          // Run test cases (simplified)
          let passedTests = 0;
          level.testCases?.forEach(testCase => {
            try {
              // This is a simplified evaluation - in production, use a safe code execution environment
              const result = evaluateSimpleJS(trimmedCode, testCase.input);
              if (result === testCase.expectedOutput) {
                passedTests++;
              }
            } catch (e) {
              // Test failed
            }
          });

          const testScore = level.testCases ?
            (passedTests / level.testCases.length) * 60 : 40;

          return Math.min(100, 40 + testScore); // Base 40% + test performance
        }

        return 50; // Basic structure but no return
      }

      return 60; // Default for unsupported languages
    } catch (error) {
      return 20; // Syntax errors
    }
  };

  const evaluateSimpleJS = (code: string, input: any): any => {
    // This is a very simplified evaluator for demo purposes
    // In production, use a proper sandboxed code execution environment
    try {
      // Extract function name and create a simple test
      const funcMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!funcMatch) return null;

      const funcName = funcMatch[1];
      const testCode = `${code}\n${funcName}(${JSON.stringify(input)});`;

      // This is unsafe - DO NOT use in production
      // Use a proper code execution sandbox instead
      return eval(testCode);
    } catch (e) {
      throw e;
    }
  };

  const generateFeedback = (score: number, level: CodeLevel): string[] => {
    const feedback: string[] = [];

    if (score >= 90) {
      feedback.push('🎉 Perfect! Your code passes all tests and follows best practices.');
    } else if (score >= 80) {
      feedback.push('👍 Excellent! Your code works correctly.');
    } else if (score >= 70) {
      feedback.push('🙂 Good job! Your code runs but could be improved.');
    } else if (score >= 50) {
      feedback.push('🤔 Getting there! Check your function structure and logic.');
    } else {
      feedback.push('📚 Keep learning! Review the basic syntax and try again.');
      feedback.push('💡 Remember to include a function declaration and return statement.');
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
        <View style={styles.languageTag}>
          <Text style={styles.languageText}>{level.language.toUpperCase()}</Text>
        </View>
        <View style={styles.livesContainer}>
          <Text style={styles.livesText}>Lives: {currentLives}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.instructions}>{level.instructions}</Text>

          {level.testCases && level.testCases.length > 0 && (
            <View style={styles.testCases}>
              <Text style={styles.testTitle}>Test Cases:</Text>
              {level.testCases.map((testCase, index) => (
                <View key={index} style={styles.testCase}>
                  <Text style={styles.testInput}>
                    Input: {JSON.stringify(testCase.input)}
                  </Text>
                  <Text style={styles.testOutput}>
                    Expected: {JSON.stringify(testCase.expectedOutput)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Code Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Code</Text>
          <Input
            value={code}
            onChangeText={setCode}
            placeholder={`Write your ${level.language} code here...`}
            multiline
            numberOfLines={8}
            style={styles.codeInput}
          />

          <Button
            onPress={handleEvaluate}
            loading={isEvaluating}
            disabled={!code.trim() || isEvaluating}
            style={styles.evaluateButton}
          >
            Run Tests
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
  languageTag: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  instructions: {
    color: '#CCCCCC',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  testCases: {
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
  },
  testTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  testCase: {
    backgroundColor: '#2A2A2A',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  testInput: {
    color: '#4CAF50',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  testOutput: {
    color: '#2196F3',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  codeInput: {
    minHeight: 200,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    backgroundColor: '#1E1E1E',
  },
  evaluateButton: {
    marginTop: 12,
    backgroundColor: '#FF9800',
  },
});