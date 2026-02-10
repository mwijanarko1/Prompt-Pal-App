import { View, Text, Image, Alert, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, InputAccessoryView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card, Badge, ProgressBar, RadarChart, ResultModal } from '@/components/ui';
import { getLevelById as getLocalLevelById, fetchLevelsFromApi, getLevelsByModuleId } from '@/features/levels/data';
import { useGameStore, Level, ChallengeType } from '@/features/game/store';
import { useUserProgressStore } from '@/features/user/store';
import { useConvexAI } from '@/hooks/useConvexAI';
import { convexHttpClient } from '@/lib/convex-client';
import { api } from '../../../convex/_generated/api.js';
import { logger } from '@/lib/logger';
import { NanoAssistant } from '@/lib/nanoAssistant';
import { useUser } from '@clerk/clerk-expo';
import { CodeExecutionView } from '@/features/game/components/CodeExecutionView';
import type { CodeExecutionResult } from '@/features/game/components/CodeExecutionView';
import { CopyAnalysisView } from '@/features/game/components/CopyAnalysisView';
import type { CopyScoringResult } from '@/lib/scoring/copyScoring';
// import { CodeScoringService } from '@/lib/scoring/codeScoring'; // Commented out - using AI evaluation instead
import { CopyScoringService } from '@/lib/scoring/copyScoring';

const { width, height: screenHeight } = Dimensions.get('window');

type UserLevelAttempt = {
  id: string;
  attemptNumber: number;
  score: number;
  feedback: string[];
  keywordsMatched: string[];
  imageUrl?: string;
  code?: string;
  copy?: string;
  testResults?: any[];
  createdAt: number;
};

// Helper function to map level type to moduleId for navigation
const getModuleIdFromLevelType = (levelType: string): string => {
  switch (levelType) {
    case 'image':
      return 'image-generation';
    case 'code':
      return 'coding-logic';
    case 'copywriting':
      return 'copywriting';
    default:
      return 'image-generation'; // fallback
  }
};

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { generateText, generateImage, evaluateImage } = useConvexAI();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
  const [codeExecutionResult, setCodeExecutionResult] = useState<CodeExecutionResult | null>(null);
  const [copyScoringResult, setCopyScoringResult] = useState<CopyScoringResult | null>(null);
  const [activeTab, setActiveTab] = useState<'target' | 'attempt'>('target');
  const [activeCodeTab, setActiveCodeTab] = useState<'instructions' | 'attempt'>('instructions');
  const [activeCopyTab, setActiveCopyTab] = useState<'brief' | 'attempt'>('brief');
  const [showResult, setShowResult] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [attemptHistory, setAttemptHistory] = useState<UserLevelAttempt[]>([]);
  const [level, setLevel] = useState<Level | null>(null);

  // Refs for keyboard scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<View>(null);
  const scrollYRef = useRef(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hint system state
  const [hints, setHints] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [showHints, setShowHints] = useState(false);
  const [moduleLevels, setModuleLevels] = useState<Level[]>([]);
  const inputAccessoryId = 'promptInputAccessory';

  const progressInfo = useMemo(() => {
    if (!level || moduleLevels.length === 0) return { current: 1, total: 1, percentage: 0 };

    // Find all levels for the current module/type
    const currentModuleId = level.moduleId || getModuleIdFromLevelType(level.type || 'image');
    const relevantLevels = moduleLevels.filter(l =>
      l.moduleId === currentModuleId ||
      l.type === level.type
    );

    // Sort by order
    const sortedLevels = [...relevantLevels].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Find index of current level
    const currentIndex = sortedLevels.findIndex(l => l.id === level.id);
    const current = currentIndex >= 0 ? currentIndex + 1 : 1;
    const total = sortedLevels.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

    return { current, total, percentage };
  }, [level, moduleLevels]);

  const { lives, loseLife, startLevel, completeLevel } = useGameStore();
  const { updateStreak, addXP } = useUserProgressStore();

  // Helper to determine XP reward for a level
  const getLevelXPReward = useCallback((lvl: Level): number => {
    // Use the level's points field if available, otherwise fallback by difficulty
    if (lvl.points && lvl.points > 0) return lvl.points;
    switch (lvl.difficulty) {
      case 'beginner': return 50;
      case 'intermediate': return 100;
      case 'advanced': return 200;
      default: return 50;
    }
  }, []);

  useEffect(() => {
    const loadLevel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get level data from Convex
        const apiLevel = await convexHttpClient.query(api.queries.getLevelById, { id: id as string });

        if (apiLevel) {
          // Process with local assets if available (for images only)
          const localLevel = getLocalLevelById(id as string);
          const processedLevel = {
            ...apiLevel,
            // Use local asset for display, API URL for evaluation
            targetImageUrl: localLevel?.targetImageUrl ?? apiLevel.targetImageUrl,
            // Use API-provided Convex storage URL for evaluation (ensure it's a string)
            targetImageUrlForEvaluation: typeof apiLevel.targetImageUrl === 'string' ? apiLevel.targetImageUrl : undefined,
            hiddenPromptKeywords: apiLevel.hiddenPromptKeywords || localLevel?.hiddenPromptKeywords || [],
          };

          setLevel(processedLevel);
          startLevel(processedLevel.id);
          // Reset hints for this level
          NanoAssistant.resetHintsForLevel(processedLevel.id);
          setHints([]);

          // Fetch all levels to calculate progress
          try {
            const apiLevels = await fetchLevelsFromApi();
            const currentModuleId = processedLevel.moduleId || getModuleIdFromLevelType(processedLevel.type || 'image');
            const sourceLevels = apiLevels.length > 0 ? apiLevels : getLevelsByModuleId(currentModuleId);

            if (sourceLevels && sourceLevels.length > 0) {
              setModuleLevels(sourceLevels);
            }
          } catch (levelsError) {
            logger.warn('GameScreen', 'Failed to load all levels for progress', { error: levelsError });
            const currentModuleId = processedLevel.moduleId || getModuleIdFromLevelType(processedLevel.type || 'image');
            setModuleLevels(getLevelsByModuleId(currentModuleId));
          }

          // Fetch attempt history for this level
          try {
            const attempts = user?.id
              ? await convexHttpClient.query(api.queries.getUserLevelAttempts, { userId: user.id, levelId: id as string })
              : [];
            setAttemptHistory(attempts);

            // Restore the latest attempt's data based on level type
            if (attempts.length > 0) {
              const latestAttempt = attempts[attempts.length - 1]; // Most recent attempt

              // Restore based on level type
              if (processedLevel.type === 'image') {
                if (latestAttempt.imageUrl) {
                  setGeneratedImage(latestAttempt.imageUrl);
                }
              } else if (processedLevel.type === 'code') {
                if (latestAttempt.code) {
                  setGeneratedCode(latestAttempt.code);
                }
                if (latestAttempt.testResults) {
                  setCodeExecutionResult({
                    code: latestAttempt.code || '',
                    testResults: latestAttempt.testResults,
                    output: latestAttempt.feedback?.join('\n') || '',
                    success: (latestAttempt.score || 0) >= processedLevel.passingScore,
                    error: latestAttempt.testResults.find((result: any) => !result.passed)?.error,
                    score: latestAttempt.score,
                    passingScore: processedLevel.passingScore,
                  });
                }
              } else if (processedLevel.type === 'copywriting') {
                if (latestAttempt.copy) {
                  setGeneratedCopy(latestAttempt.copy);
                }
              }

              if (latestAttempt.score) {
                setLastScore(latestAttempt.score);
              }
              if (latestAttempt.feedback && latestAttempt.feedback.length > 0) {
                setFeedback(latestAttempt.feedback);
              }
              if (latestAttempt.keywordsMatched && latestAttempt.keywordsMatched.length > 0) {
                setMatchedKeywords(latestAttempt.keywordsMatched);
              }
            }
          } catch (attemptsError) {
            // Don't fail level loading if attempt history fails
            logger.warn('GameScreen', 'Failed to load attempt history', { error: attemptsError });
            setAttemptHistory([]);
          }
        } else {
          throw new Error('Level not found');
        }
      } catch (error: any) {
        logger.error('GameScreen', error, { operation: 'loadLevel', id });

        // Determine error message based on error type
        let errorMessage = 'Failed to load level. Please try again.';

        if (error.status === 403) {
          errorMessage = 'This level is locked. Complete previous levels to unlock it.';
        } else if (error.status === 404) {
          errorMessage = 'Level not found.';
        } else if (error.status === 401) {
          errorMessage = 'Authentication required. Please sign in again.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadLevel();
    }
  }, [id, startLevel, user?.id]);

  // Hint cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const { isOnCooldown, remainingMs } = NanoAssistant.getCooldownStatus();
      setHintCooldown(isOnCooldown ? Math.ceil(remainingMs / 1000) : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard handling - keep input visible and avoid unexpected dismissals
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const nextKeyboardHeight = event?.endCoordinates?.height ?? 0;
        setKeyboardHeight(nextKeyboardHeight);

        requestAnimationFrame(() => {
          if (!inputRef.current || !scrollViewRef.current) return;

          inputRef.current.measureInWindow((_x, y, _width, height) => {
            const inputBottom = y + height;
            const keyboardTop = screenHeight - nextKeyboardHeight;
            const safePadding = 24;

            if (inputBottom > keyboardTop - safePadding) {
              const overlap = inputBottom - (keyboardTop - safePadding);
              scrollViewRef.current?.scrollTo({
                y: Math.max(0, scrollYRef.current + overlap),
                animated: true,
              });
            }
          });
        });
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Handle getting a hint
  const handleGetHint = useCallback(async () => {
    if (!level || isLoadingHint || hintCooldown > 0) return;

    setIsLoadingHint(true);
    try {
      const moduleType = (level.type || 'image') as ChallengeType;
      const hint = await NanoAssistant.getHint(prompt, moduleType, level as Parameters<typeof NanoAssistant.getHint>[2]);
      setHints(prev => [...prev, hint]);
      setShowHints(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not get hint. Please try again.';
      Alert.alert('Hint Unavailable', errorMessage);
    } finally {
      setIsLoadingHint(false);
    }
  }, [level, prompt, isLoadingHint, hintCooldown]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-onSurface mt-4 font-black">Loading Challenge…</Text>
      </SafeAreaView>
    );
  }

  if (!level) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Card className="w-full items-center p-8">
            <Text className="text-error text-xl font-bold mb-4">Level Not Found</Text>
            <Text className="text-onSurfaceVariant text-center mb-8">
              We couldn't find challenge "{id}". It may have been removed or moved.
            </Text>
            <Button onPress={() => router.back()} variant="primary">Go Back</Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const charCount = prompt.length;
  const tokenCount = Math.ceil(charCount / 4); // Rough estimation

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      Alert.alert('Error', 'Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    try {
      if (level.type === 'image') {
        // Step 1: Generate image
        const generateResult = await generateImage(prompt);
        const generatedImageUrl = generateResult.imageUrl;

        if (!generatedImageUrl) {
          throw new Error('Failed to generate image: no image URL returned');
        }

        setGeneratedImage(generatedImageUrl);
        setActiveTab('attempt');

        // Step 2: Evaluate the generated image
        if (!level.targetImageUrlForEvaluation) {
          throw new Error('No target image URL available for evaluation');
        }

        const evaluationResult = await evaluateImage({
          taskId: level.id,
          userImageUrl: generatedImageUrl,
          expectedImageUrl: level.targetImageUrlForEvaluation,
          hiddenPromptKeywords: level.hiddenPromptKeywords,
          style: level.style,
          userPrompt: prompt,
        });

        const evaluation = evaluationResult.evaluation;
        const score = evaluation.score;

        // Apply hint penalty to score
        const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
        const finalScore = penaltyDetails.finalScore;

        setLastScore(finalScore);
        setFeedback(evaluation.feedback || []);
        setMatchedKeywords(evaluation.keywordsMatched || []);

        // Save attempt to backend for history
        try {
          if (user?.id) {
            await convexHttpClient.mutation(api.mutations.saveUserLevelAttempt, {
              userId: user.id,
              levelId: level.id,
              score: finalScore,
              feedback: evaluation.feedback || [],
              keywordsMatched: evaluation.keywordsMatched || [],
              imageUrl: generatedImageUrl,
            });

            // Refresh attempt history to include the new attempt
            const attempts = await convexHttpClient.query(api.queries.getUserLevelAttempts, {
              userId: user.id,
              levelId: level.id,
            });
            setAttemptHistory(attempts || []);
          }
        } catch (saveError) {
          // Don't fail the evaluation if saving attempt fails
          logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
        }

        if (finalScore >= level.passingScore) {
          // Update progress - user passed
          if (user?.id) {
            const nextAttemptsCount = (attemptHistory?.length ?? 0) + 1;
            await convexHttpClient.mutation(api.mutations.updateLevelProgress, {
              userId: user.id,
              appId: "prompt-pal",
              levelId: level.id,
              isCompleted: true,
              bestScore: finalScore,
              attempts: nextAttemptsCount,
              completedAt: Date.now(),
            });
          }

          await updateStreak();
          // Award XP for completing the level
          await addXP(getLevelXPReward(level));
          setShowResult(true);
          await completeLevel(level.id);
        } else {
          // User didn't pass - lose a life
          await loseLife();

          // Evaluation results are already displayed inline below the button
        }
      } else if (level.type === 'code') {
        // Generate code and evaluate it using AI in a single call
        setGeneratedCode(null);
        setCodeExecutionResult(null);

        // Build comprehensive system prompt with instructions and test cases
        const testCasesText = (level.testCases || [])
          .map((testCase, index) =>
            `Test ${index + 1}: ${testCase.name}\n` +
            `Input: ${JSON.stringify(testCase.input)}\n` +
            `Expected Output: ${JSON.stringify(testCase.expectedOutput)}${testCase.description ? `\nDescription: ${testCase.description}` : ''}`
          )
          .join('\n\n');

        const codeSystemPrompt = [
          'You are a coding assistant that generates code based on user prompts and evaluates it against objective criteria.',
          '',
          'TASK:',
          '1. First, generate JavaScript code based on the user\'s prompt above',
          '2. Then, evaluate that generated code against the following instructions and test cases',
          '',
          'GENERATION INSTRUCTIONS:',
          `Write a ${level.language || 'JavaScript'} function that attempts to fulfill the user prompt.`,
          'Focus on what the user is asking for, but ensure it\'s a valid, executable function.',
          '',
          'EVALUATION CRITERIA:',
          `The function should be named "${level.functionName}" and meet these requirements:`,
          level.requirementBrief || 'Solve the given problem.',
          '',
          'TEST CASES TO EVALUATE AGAINST:',
          testCasesText,
          '',
          'RESPONSE FORMAT:',
          'Return your response as a JSON object with this exact structure:',
          '{',
          '  "code": "the complete function code as a string",',
          '  "evaluation": {',
          '    "score": 0-100,',
          '    "passed": true/false,',
          '    "testResults": [',
          '      {',
          '        "id": "test-case-id",',
          '        "name": "test case name",',
          '        "passed": true/false,',
          '        "error": "error message if failed",',
          '        "expectedOutput": "expected value",',
          '        "actualOutput": "actual value"',
          '      }',
          '      // ... more test results',
          '    ],',
          '    "feedback": ["feedback message 1", "feedback message 2"]',
          '  }',
          '}',
          '',
          'IMPORTANT:',
          '- Generate code that responds to the user prompt, then evaluate it against the test cases',
          '- Code must be valid JavaScript that can run in a browser',
          '- Function should attempt to do what the user asked, but will be graded on meeting the objective requirements',
          '- Return the result, do not console.log',
          '- Score should reflect how well the code meets the test case requirements (0-100)',
          '- passed should be true if score >= 70',
          '- Test results should show how the generated code performs against each test case',
          '- Feedback should be helpful and specific about what needs to be improved'
        ].join('\n');

        const generateResult = await generateText(prompt, codeSystemPrompt);
        const responseText = generateResult.result || '';

        if (!responseText) {
          throw new Error('Failed to generate and evaluate code: no response returned');
        }

        // Parse the AI response
        interface AIResponse {
          code: string;
          evaluation: {
            score: number;
            passed: boolean;
            testResults: Array<{
              id?: string;
              name?: string;
              passed?: boolean;
              error?: string;
              expectedOutput?: any;
              actualOutput?: any;
            }>;
            feedback: string[];
          };
        }

        let parsedResponse: AIResponse;
        try {
          // Try to extract JSON from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          const jsonText = jsonMatch ? jsonMatch[0] : responseText;
          parsedResponse = JSON.parse(jsonText);
        } catch (parseError) {
          logger.error('GameScreen', 'Failed to parse AI response as JSON', { responseText, parseError });
          throw new Error('AI response was not in the expected JSON format');
        }

        const { code: generatedCodeText, evaluation } = parsedResponse;

        if (!generatedCodeText) {
          throw new Error('No code was generated by the AI');
        }

        if (!evaluation) {
          throw new Error('No evaluation was provided by the AI');
        }

        setGeneratedCode(generatedCodeText);
        setActiveCodeTab('attempt');

        // Use AI evaluation results
        const aiScore = evaluation.score || 0;
        const aiPassed = evaluation.passed || false;
        const aiTestResults = evaluation.testResults || [];
        const aiFeedback = evaluation.feedback || [];

        // Apply hint penalty to score
        const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, aiScore, level.passingScore, level.difficulty);
        const finalScore = penaltyDetails.finalScore;

        // Determine if user passed based on final score and passing threshold
        const userPassed = finalScore >= level.passingScore;

        setLastScore(finalScore);
        setFeedback(aiFeedback);
        setCodeExecutionResult({
          code: generatedCodeText,
          testResults: aiTestResults.map((result: any, index: number) => ({
            id: result.id || `test-${index + 1}`,
            name: result.name || `Test ${index + 1}`,
            passed: result.passed || false,
            error: result.error,
            expectedOutput: result.expectedOutput,
            actualOutput: result.actualOutput,
            executionTime: 0, // AI evaluation doesn't provide timing
          })) as CodeTestResult[],
          output: aiFeedback.join('\n'),
          success: userPassed,
          error: aiTestResults.find((r: any) => !r.passed)?.error,
          score: finalScore,
          passingScore: level.passingScore,
        });

        // Save attempt to backend for history
        try {
          if (user?.id) {
            // Use test result names as keywords for now
            const passedTestNames = aiTestResults
              .filter((r: any) => r.passed && r.name)
              .map((r: any) => r.name)
              .filter((name: any): name is string => name !== undefined);

            // Sanitize test results: Convex v.optional(v.string()) rejects null,
            // so convert null fields to undefined before saving
            const sanitizedTestResults = aiTestResults.map((r: any) => ({
              ...r,
              id: r.id ?? undefined,
              name: r.name ?? undefined,
              error: r.error ?? undefined,
              output: r.output ?? undefined,
              expectedOutput: r.expectedOutput ?? undefined,
              actualOutput: r.actualOutput ?? undefined,
              executionTime: r.executionTime ?? undefined,
            }));

            await convexHttpClient.mutation(api.mutations.saveUserLevelAttempt, {
              userId: user.id,
              levelId: level.id,
              score: finalScore,
              feedback: aiFeedback,
              keywordsMatched: passedTestNames.length > 0 ? passedTestNames : [],
              code: generatedCodeText,
              testResults: sanitizedTestResults,
            });

            // Refresh attempt history to include the new attempt
            const attempts = await convexHttpClient.query(api.queries.getUserLevelAttempts, {
              userId: user.id,
              levelId: level.id,
            });
            setAttemptHistory(attempts || []);
          }
        } catch (saveError) {
          logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
        }

        if (userPassed) {
          if (user?.id) {
            const nextAttemptsCount = (attemptHistory?.length ?? 0) + 1;
            await convexHttpClient.mutation(api.mutations.updateLevelProgress, {
              userId: user.id,
              appId: "prompt-pal",
              levelId: level.id,
              isCompleted: true,
              bestScore: finalScore,
              attempts: nextAttemptsCount,
              completedAt: Date.now(),
            });
          }

          await updateStreak();
          // Award XP for completing the level
          await addXP(getLevelXPReward(level));
          setShowResult(true);
          await completeLevel(level.id);
        } else {
          await loseLife();
        }

        // COMMENTED OUT: Local sandbox execution and scoring
        // We will revisit this later - for now, AI handles both generation and evaluation

        /*
        // Step 2: Evaluate the generated code (LOCAL SANDBOX - COMMENTED OUT)
        const codeScoringResult = await CodeScoringService.scoreCode({
          code: generatedCodeText,
          language: level.language || 'javascript',
          testCases: level.testCases || [],
          functionName: level.functionName,
          passingScore: level.passingScore,
        });

        const score = codeScoringResult.score;

        // Apply hint penalty to score
        const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
        const finalScore = penaltyDetails.finalScore;

        setLastScore(finalScore);
        setFeedback(codeScoringResult.feedback || []);
        setCodeExecutionResult({
          code: generatedCodeText,
          testResults: codeScoringResult.testResults,
          output: codeScoringResult.feedback?.join('\n') || '',
          success: finalScore >= level.passingScore,
          error: codeScoringResult.testResults.find(r => !r.passed)?.error,
          score: finalScore,
          passingScore: level.passingScore,
        });

        // Save attempt to backend for history
        try {
          if (user?.id) {
            // Filter out undefined values from keywordsMatched
            const passedTestNames = codeScoringResult.testResults
              .filter(r => r.passed && r.name)
              .map(r => r.name)
              .filter((name): name is string => name !== undefined);

            await convexHttpClient.mutation(api.mutations.saveUserLevelAttempt, {
              userId: user.id,
              levelId: level.id,
              score: finalScore,
              feedback: codeScoringResult.feedback || [],
              keywordsMatched: passedTestNames.length > 0 ? passedTestNames : [],
              code: generatedCodeText,
              testResults: codeScoringResult.testResults,
            });

            // Refresh attempt history to include the new attempt
            const attempts = await convexHttpClient.query(api.queries.getUserLevelAttempts, {
              userId: user.id,
              levelId: level.id,
            });
            setAttemptHistory(attempts || []);
          }
        } catch (saveError) {
          logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
        }

        if (finalScore >= level.passingScore) {
          if (user?.id) {
            const nextAttemptsCount = (attemptHistory?.length ?? 0) + 1;
            await convexHttpClient.mutation(api.mutations.updateLevelProgress, {
              userId: user.id,
              appId: "prompt-pal",
              levelId: level.id,
              isCompleted: true,
              bestScore: finalScore,
              attempts: nextAttemptsCount,
              completedAt: Date.now(),
            });
          }

          await updateStreak();
          setShowResult(true);
          await completeLevel(level.id);
        } else {
          await loseLife();
        }
        */
      } else if (level.type === 'copywriting') {
        // Step 1: Generate copy using AI
        const copyGenerationPrompt = `Write marketing copy based on this instruction: ${prompt}\n\nProduct: ${level.briefProduct || 'Product'}\nTarget Audience: ${level.briefTarget || 'General audience'}\nTone: ${level.briefTone || 'Professional'}\nGoal: ${level.briefGoal || 'Persuade the audience'}\n\nReturn only the copy text, no explanations.`;

        const generateResult = await generateText(copyGenerationPrompt, 'copywriting-generation');
        const generatedCopyText = generateResult.result || '';

        if (!generatedCopyText) {
          throw new Error('Failed to generate copy: no copy returned');
        }

        setGeneratedCopy(generatedCopyText);
        setActiveCopyTab('attempt');

        // Step 2: Evaluate the generated copy
        const copyScoringResult = await CopyScoringService.scoreCopy({
          text: generatedCopyText,
          briefProduct: level.briefProduct,
          briefTarget: level.briefTarget,
          briefTone: level.briefTone,
          briefGoal: level.briefGoal,
          wordLimit: level.wordLimit,
          requiredElements: level.requiredElements,
          passingScore: level.passingScore,
        });

        const score = copyScoringResult.score;

        // Apply hint penalty to score
        const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
        const finalScore = penaltyDetails.finalScore;

        setLastScore(finalScore);
        setFeedback(copyScoringResult.feedback || []);
        setCopyScoringResult(copyScoringResult);

        // Save attempt to backend for history
        try {
          if (user?.id) {
            const highMetrics = copyScoringResult.metrics
              .filter(m => m.value >= 60 && m.label)
              .map(m => m.label)
              .filter((label): label is string => label !== undefined);

            await convexHttpClient.mutation(api.mutations.saveUserLevelAttempt, {
              userId: user.id,
              levelId: level.id,
              score: finalScore,
              feedback: copyScoringResult.feedback || [],
              keywordsMatched: highMetrics.length > 0 ? highMetrics : [],
              copy: generatedCopyText,
            });

            // Refresh attempt history to include the new attempt
            const attempts = await convexHttpClient.query(api.queries.getUserLevelAttempts, {
              userId: user.id,
              levelId: level.id,
            });
            setAttemptHistory(attempts || []);
          }
        } catch (saveError) {
          logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
        }

        if (finalScore >= level.passingScore) {
          if (user?.id) {
            const nextAttemptsCount = (attemptHistory?.length ?? 0) + 1;
            await convexHttpClient.mutation(api.mutations.updateLevelProgress, {
              userId: user.id,
              appId: "prompt-pal",
              levelId: level.id,
              isCompleted: true,
              bestScore: finalScore,
              attempts: nextAttemptsCount,
              completedAt: Date.now(),
            });
          }

          await updateStreak();
          // Award XP for completing the level
          await addXP(getLevelXPReward(level));
          setShowResult(true);
          await completeLevel(level.id);
        } else {
          await loseLife();
        }
      }
    } catch (error: any) {
      logger.error('GameScreen', error, { operation: 'handleGenerate' });

      // Handle specific error types
      if (error.response?.status === 429) {
        Alert.alert('Rate Limited', 'Too many requests. Please wait before trying again.');
      } else if (error.response?.status === 403) {
        Alert.alert('Content Policy', 'Your prompt may violate content policies. Please try a different prompt.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const renderHeader = () => (
    <SafeAreaView className="bg-background" edges={['top']}>
      <View className="px-6 py-2">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity onPress={() => {
            if (level) {
              const moduleId = getModuleIdFromLevelType(level.type || 'image');
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push(`/game/levels/${moduleId}`);
              }
            } else {
              router.back();
            }
          }} className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant">
            <Text className="text-onSurface text-xl font-bold">←</Text>
          </TouchableOpacity>

          <View className="items-center flex-1 mx-4">
            <Text className="text-primary text-[10px] font-black uppercase tracking-widest mb-0.5" numberOfLines={1}>
              {level.type === 'image' ? 'CHALLENGE' : level.type === 'code' ? level.moduleTitle : 'COPYWRITING CHALLENGE'}
            </Text>
            <Text className="text-onSurface text-base font-black text-center" numberOfLines={2}>
              {level.title}
            </Text>
          </View>

          <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant">
            <Text className="text-onSurface text-xl font-bold">?</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );

  const renderImageChallenge = () => {
    const imageUri = activeTab === 'target' ? level.targetImageUrl : (generatedImage || level.targetImageUrl);
    const isLocalAsset = activeTab === 'target' && typeof imageUri === 'number';

    return (
      <View className="px-6 pt-4 pb-6">
        {level.description && (
          <View className="mb-4">
            <Text className="text-onSurface text-base font-black leading-6 text-center">
              {level.description}
            </Text>
          </View>
        )}
        <Card className="p-0 overflow-hidden rounded-[40px] border-0" variant="elevated">
          <View className="aspect-square relative">
            {imageUri ? (
              <Image
                source={isLocalAsset ? imageUri : { uri: imageUri as string }}
                className="w-full h-full"
                resizeMode="cover"
                onError={(error) => {
                  console.log('Image load error:', error.nativeEvent);
                }}
              />
            ) : (
              <View className="w-full h-full bg-surfaceVariant items-center justify-center">
                <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                <Text className="text-onSurfaceVariant text-center mt-4 font-bold">
                  {activeTab === 'target' ? 'Target Image Not Available' : 'Your Attempt Will Appear Here'}
                </Text>
              </View>
            )}
            {activeTab === 'target' && imageUri && (
              <View className="absolute top-6 right-6">
                <Badge label="🎯 TARGET" variant="primary" className="bg-primary px-3 py-1.5 rounded-full border-0" />
              </View>
            )}
          </View>

          <View className="flex-row bg-surfaceVariant/50 p-2 m-4 rounded-full">
            <TouchableOpacity
              onPress={() => setActiveTab('target')}
              className={`flex-1 py-3 rounded-full items-center ${activeTab === 'target' ? 'bg-surface' : ''}`}
            >
              <Text className={`font-bold ${activeTab === 'target' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Target Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('attempt')}
              className={`flex-1 py-3 rounded-full items-center ${activeTab === 'attempt' ? 'bg-surface' : ''}`}
            >
              <Text className={`font-bold ${activeTab === 'attempt' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Your Attempt</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };

  const renderCodeChallenge = () => {
    const hasCode = generatedCode && generatedCode.trim().length > 0;
    const firstInput = level.testCases && level.testCases.length > 0 ? level.testCases[0].input : undefined;
    const argCount = Array.isArray(firstInput) ? firstInput.length : firstInput !== undefined ? 1 : 0;
    const signatureArgs = Array.from({ length: argCount }, (_, index) => `arg${index + 1}`).join(', ');

    return (
      <View className="px-6 pt-4 pb-6">
        {level.description && (
          <View className="mb-4">
            <Text className="text-onSurface text-base font-black leading-6 text-center">
              {level.description}
            </Text>
          </View>
        )}

        <Card className="p-0 overflow-hidden rounded-[40px] border-0" variant="elevated">
          {/* Tab Content */}
          <View className="min-h-[400px] bg-surface">
            {activeCodeTab === 'instructions' ? (
              <View className="p-6">
                <View className="flex-row items-center mb-4">
                  <Text className="text-primary text-lg mr-2">⌨</Text>
                  <Text className="text-primary text-[10px] font-black uppercase tracking-widest">ALGORITHM CHALLENGE</Text>
                  <View className="ml-auto">
                    <Badge label={level.language || 'javascript'} variant="primary" className="bg-primary/20 border-0 px-3 py-1 rounded-full" />
                  </View>
                </View>

                <Text className="text-onSurface text-2xl font-black mb-4">{level.title}</Text>

                <View className="bg-surfaceVariant/30 rounded-2xl p-4 mb-6">
                  <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2">Requirements</Text>
                  <Text className="text-onSurface text-base leading-6">
                    {level.requirementBrief || 'Write a function that meets the specified requirements.'}
                  </Text>
                </View>

                {level.functionName && (
                  <View className="bg-primary/10 rounded-2xl p-4 mb-6">
                    <Text className="text-primary text-[10px] font-black uppercase tracking-widest mb-2">Function Name</Text>
                    <Text className="text-onSurface text-lg font-mono font-bold">{level.functionName}</Text>
                  </View>
                )}

                {level.functionName && (
                  <View className="bg-surfaceVariant/30 rounded-2xl p-4 mb-6">
                    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2">Function Signature</Text>
                    <Text className="text-onSurface text-xs font-mono">{`function ${level.functionName}(${signatureArgs}) {`}</Text>
                    <Text className="text-onSurface text-xs font-mono">{`  // ...`}</Text>
                    <Text className="text-onSurface text-xs font-mono">{`}`}</Text>
                  </View>
                )}

                <View className="bg-surfaceVariant/20 rounded-2xl p-4 mb-6">
                  <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2">Code Format Hints</Text>
                  <Text className="text-onSurface text-xs mb-1">Use the exact function name shown above.</Text>
                  <Text className="text-onSurface text-xs mb-1">Return the result instead of printing it.</Text>
                  <Text className="text-onSurface text-xs mb-1">Do not use imports or external libraries.</Text>
                  <Text className="text-onSurface text-xs">Handle all test cases exactly as shown.</Text>
                </View>

                {level.testCases && level.testCases.length > 0 && (
                  <View>
                    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-3">Test Cases</Text>
                    {level.testCases.map((testCase: any, index: number) => (
                      <View key={`test-${testCase.id || index}-${index}`} className="bg-surfaceVariant/20 rounded-xl p-4 mb-3">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-primary text-sm font-bold mr-2">Test {index + 1}</Text>
                          <Text className="text-onSurfaceVariant text-xs">{testCase.name}</Text>
                        </View>
                        <View className="flex-row">
                          <View className="flex-1 mr-2">
                            <Text className="text-onSurfaceVariant text-[10px] uppercase mb-1">Input</Text>
                            <Text className="text-onSurface text-xs font-mono bg-surfaceVariant/50 rounded-lg p-2">
                              {JSON.stringify(testCase.input)}
                            </Text>
                          </View>
                          <View className="flex-1 ml-2">
                            <Text className="text-onSurfaceVariant text-[10px] uppercase mb-1">Expected</Text>
                            <Text className="text-onSurface text-xs font-mono bg-surfaceVariant/50 rounded-lg p-2">
                              {JSON.stringify(testCase.expectedOutput)}
                            </Text>
                          </View>
                        </View>
                        {testCase.description && (
                          <Text className="text-onSurfaceVariant text-xs mt-2 italic">
                            {testCase.description}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View className="p-6">
                <CodeExecutionView
                  code={generatedCode || ''}
                  executionResult={codeExecutionResult}
                  language={level.language || 'javascript'}
                />
              </View>
            )}
          </View>

          {/* Tab Switcher */}
          <View className="flex-row bg-surfaceVariant/50 p-2 m-4 rounded-full">
            <TouchableOpacity
              onPress={() => setActiveCodeTab('instructions')}
              className={`flex-1 py-3 rounded-full items-center ${activeCodeTab === 'instructions' ? 'bg-surface' : ''}`}
            >
              <Text className={`font-bold ${activeCodeTab === 'instructions' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Instructions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveCodeTab('attempt')}
              className={`flex-1 py-3 rounded-full items-center ${activeCodeTab === 'attempt' ? 'bg-surface' : ''}`}
              disabled={!hasCode}
            >
              <Text className={`font-bold ${activeCodeTab === 'attempt' ? 'text-onSurface' : !hasCode ? 'text-onSurfaceVariant/40' : 'text-onSurfaceVariant'}`}>Your Attempt</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };

  const renderCopywritingChallenge = () => {
    const hasCopy = generatedCopy && generatedCopy.trim().length > 0;

    return (
      <View className="px-6 pt-4 pb-6">
        {level.description && (
          <View className="mb-4">
            <Text className="text-onSurface text-base font-black leading-6 text-center">
              {level.description}
            </Text>
          </View>
        )}

        <Card className="p-0 overflow-hidden rounded-[40px] border-0" variant="elevated">
          {/* Tab Content */}
          <View className="min-h-[400px] bg-surface">
            {activeCopyTab === 'brief' ? (
              <View className="p-6">
                <View className="flex-row items-center mb-4">
                  <Text className="text-primary text-lg mr-2">📝</Text>
                  <Text className="text-primary text-[10px] font-black uppercase tracking-widest">COPYWRITING CHALLENGE</Text>
                </View>

                <Text className="text-onSurface text-2xl font-black mb-4">{level.title}</Text>

                <View className="bg-primary/10 rounded-2xl p-4 mb-6">
                  <Text className="text-primary text-[10px] font-black uppercase tracking-widest mb-2">Project</Text>
                  <Text className="text-onSurface text-xl font-black">{level.briefProduct || 'Product Campaign'}</Text>
                </View>

                <View className="flex-row mb-4">
                  <View className="flex-1 mr-2 bg-surfaceVariant/30 rounded-xl p-4">
                    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-1">Target Audience</Text>
                    <Text className="text-onSurface text-sm font-bold">{level.briefTarget || 'General audience'}</Text>
                  </View>
                  <View className="flex-1 ml-2 bg-surfaceVariant/30 rounded-xl p-4">
                    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-1">Tone</Text>
                    <Text className="text-onSurface text-sm font-bold">{level.briefTone || 'Professional'}</Text>
                  </View>
                </View>

                <View className="bg-surfaceVariant/30 rounded-2xl p-4">
                  <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2">Goal</Text>
                  <Text className="text-onSurface text-base leading-6">
                    {level.briefGoal || 'Create compelling copy that persuades the audience.'}
                  </Text>
                </View>

                {level.wordLimit && (
                  <View className="mt-4 flex-row items-center">
                    <Text className="text-onSurfaceVariant text-xs mr-2">Word Limit:</Text>
                    <Badge
                      label={`${level.wordLimit.min || 0}-${level.wordLimit.max || 500} words`}
                      variant="surface"
                      className="bg-surfaceVariant border-0"
                    />
                  </View>
                )}
              </View>
            ) : (
              <View className="p-6">
                <CopyAnalysisView
                  copy={generatedCopy || ''}
                  scoringResult={copyScoringResult}
                  requirements={level.requiredElements}
                />
              </View>
            )}
          </View>

          {/* Tab Switcher */}
          <View className="flex-row bg-surfaceVariant/50 p-2 m-4 rounded-full">
            <TouchableOpacity
              onPress={() => setActiveCopyTab('brief')}
              className={`flex-1 py-3 rounded-full items-center ${activeCopyTab === 'brief' ? 'bg-surface' : ''}`}
            >
              <Text className={`font-bold ${activeCopyTab === 'brief' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Brief</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveCopyTab('attempt')}
              className={`flex-1 py-3 rounded-full items-center ${activeCopyTab === 'attempt' ? 'bg-surface' : ''}`}
              disabled={!hasCopy}
            >
              <Text className={`font-bold ${activeCopyTab === 'attempt' ? 'text-onSurface' : !hasCopy ? 'text-onSurfaceVariant/40' : 'text-onSurfaceVariant'}`}>Your Attempt</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };

  const renderPromptSection = () => {
    const hintsUsed = level ? NanoAssistant.getHintsUsed(level.id) : 0;
    const hintsRemaining = level ? NanoAssistant.getHintsRemaining(level.id, level.difficulty) : 0;
    const maxHints = level ? NanoAssistant.getMaxHintsPerLevel(level.difficulty) : 4;
    const noHintsLeft = hintsRemaining === 0;

    return (
      <View className="px-6 pb-8">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-onSurfaceVariant text-xs font-black uppercase tracking-widest">
            {level.type === 'image' ? 'YOUR PROMPT' : level.type === 'code' ? 'YOUR PROMPT EDITOR' : 'CRAFT YOUR PROMPT'}
          </Text>
          <TouchableOpacity
            onPress={handleGetHint}
            disabled={isLoadingHint || hintCooldown > 0 || noHintsLeft}
            className={`flex-row items-center px-3 py-2 rounded-full ${noHintsLeft ? 'bg-surfaceVariant/30' : hintCooldown > 0 ? 'bg-surfaceVariant/50' : 'bg-secondary/20'
              }`}
          >
            {isLoadingHint ? (
              <ActivityIndicator size="small" color="#4151FF" />
            ) : (
              <>
                <Text className={`text-base mr-1 ${noHintsLeft ? 'opacity-50' : ''}`}>{hintCooldown > 0 ? '⏳' : '🪄'}</Text>
                <Text className={`text-xs font-bold ${noHintsLeft ? 'text-onSurfaceVariant/50' : hintCooldown > 0 ? 'text-onSurfaceVariant' : 'text-secondary'}`}>
                  {noHintsLeft ? 'No hints left' : hintCooldown > 0 ? `${hintCooldown}s` : hintsUsed === 0 ? 'Free Hint' : `Hint (${hintsRemaining}/${maxHints})`}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Hints Display */}
        {hints.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowHints(!showHints)}
            className="mb-4"
          >
            <Card className={`p-4 rounded-[24px] border border-secondary/30 bg-secondary/5 ${showHints ? '' : 'overflow-hidden'}`}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Text className="text-secondary text-sm mr-2">💡</Text>
                  <Text className="text-secondary text-xs font-black uppercase tracking-widest">
                    Hints ({hints.length})
                  </Text>
                </View>
                <Text className="text-onSurfaceVariant text-xs">
                  {showHints ? '▲ Hide' : '▼ Show'}
                </Text>
              </View>
              {showHints && (
                <View className="mt-2">
                  {hints.map((hint, index) => (
                    <View key={index} className="flex-row mb-2">
                      <Text className="text-secondary text-xs mr-2">{index + 1}.</Text>
                      <Text className="text-onSurface text-sm flex-1">{hint}</Text>
                    </View>
                  ))}
                  <Text className="text-onSurfaceVariant text-[10px] mt-2 italic">
                    {NanoAssistant.getNextHintPenaltyDescription(level.id, level.difficulty)}
                  </Text>
                </View>
              )}
            </Card>
          </TouchableOpacity>
        )}

        <View ref={inputRef}>
          <Card className="p-6 rounded-[32px] border-2 border-primary/30 bg-surfaceVariant/20 mb-4">
            <Input
              value={prompt}
              onChangeText={setPrompt}
              placeholder={level.type === 'image' ? "Describe the floating islands, the nebula sky..." : "Enter your prompt here..."}
              multiline
              className="text-lg text-onSurface min-h-[120px] bg-transparent border-0 p-0 mb-4"
              inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryId : undefined}
            />

            <View className="flex-row items-center">
              <View className="flex-row">
                <Badge label={`${charCount} chars`} variant="surface" className="bg-surfaceVariant mr-2 border-0 px-3" />
                <Badge label={`${tokenCount} tokens`} variant="surface" className="bg-surfaceVariant mr-2 border-0 px-3" />
                {level.type === 'image' && <Badge label={level.style || ''} variant="primary" className="bg-primary/20 border-0 px-3" />}
              </View>
            </View>
          </Card>
        </View>

        <View className="mt-6">
          <Button
            onPress={handleGenerate}
            loading={isGenerating}
            variant="primary"
            size="lg"
            fullWidth
            className="rounded-full py-5 shadow-glow"
          >
            {level.type === 'image' ? 'Generate & Compare' : 'Generate'}
          </Button>
        </View>

        {/* Evaluation Results */}
        {lastScore !== null && level.type === 'image' && (
          <View className="mt-4">
            <Card className="p-4 rounded-[24px] border border-primary/30 bg-primary/5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-onSurface text-sm font-black">Evaluation Score</Text>
                <View className="flex-row items-center">
                  <Text className="text-primary text-xl font-black mr-2">{lastScore}%</Text>
                  <View className={`w-3 h-3 rounded-full ${lastScore >= level.passingScore ? 'bg-success' : 'bg-error'}`} />
                </View>
              </View>

              {feedback && feedback.length > 0 && (
                <View className="mt-2">
                  <Text className="text-onSurface text-xs font-bold uppercase tracking-widest mb-2">Feedback</Text>
                  {feedback.map((feedbackItem, index) => (
                    <View key={index} className="flex-row mb-1">
                      <Text className="text-onSurfaceVariant text-xs mr-2">•</Text>
                      <Text className="text-onSurface text-sm flex-1">{feedbackItem}</Text>
                    </View>
                  ))}
                </View>
              )}

              {matchedKeywords && matchedKeywords.length > 0 && (
                <View className="mt-3">
                  <Text className="text-onSurface text-xs font-bold uppercase tracking-widest mb-2">Keywords Captured</Text>
                  <View className="flex-row flex-wrap">
                    {matchedKeywords.map((keyword, index) => (
                      <View key={index} className="bg-primary/20 px-2 py-1 rounded-full mr-2 mb-1">
                        <Text className="text-primary text-xs font-bold">{keyword}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Attempt History */}
        {attemptHistory.length > 0 && level.type === 'image' && (
          <View className="mt-4">
            <Card className="p-4 rounded-[24px] border border-outline/30 bg-surfaceVariant/20">
              <Text className="text-onSurface text-sm font-black mb-3">Attempt History</Text>

              <View className="space-y-3">
                {attemptHistory.map((attempt) => (
                  <View key={attempt.id} className="bg-surfaceVariant/30 rounded-lg p-3">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">
                        Attempt #{attempt.attemptNumber}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-onSurfaceVariant text-sm mr-2">{attempt.score}%</Text>
                        <View className={`w-2 h-2 rounded-full ${attempt.score >= (level?.passingScore || 75) ? 'bg-success' : 'bg-error'}`} />
                      </View>
                    </View>

                    {attempt.feedback && attempt.feedback.length > 0 && (
                      <View className="mt-2">
                        <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest mb-1">Feedback</Text>
                        {attempt.feedback.map((feedbackItem, index) => (
                          <View key={index} className="flex-row mb-1">
                            <Text className="text-onSurfaceVariant text-xs mr-2">•</Text>
                            <Text className="text-onSurfaceVariant text-xs flex-1">{feedbackItem}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {attempt.keywordsMatched && attempt.keywordsMatched.length > 0 && (
                      <View className="mt-2">
                        <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest mb-1">Keywords</Text>
                        <View className="flex-row flex-wrap">
                          {attempt.keywordsMatched.map((keyword, index) => (
                            <View key={index} className="bg-surfaceVariant/50 px-2 py-0.5 rounded mr-1 mb-1">
                              <Text className="text-onSurfaceVariant text-xs">{keyword}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    <Text className="text-onSurfaceVariant text-xs mt-2">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
        )}
      </View>
    );
  };

  const renderFeedbackSection = () => {
    if (level.type !== 'copywriting' || !level.metrics || level.metrics.length === 0) return null;

    return (
      <View className="px-6 pb-8">
        <Text className="text-onSurface text-xl font-black mb-4">AI Feedback & Output</Text>
        <Card className="p-6 rounded-[32px] items-center">
          <RadarChart metrics={level.metrics || []} size={width - 100} />

          <View className="flex-row w-full justify-around mt-6">
            {level.metrics?.map((m: { label: string; value: number }, i: number) => (
              <View key={i} className="items-center">
                <Text className="text-primary text-2xl font-black">{m.value / 10}</Text>
                <Text className="text-onSurfaceVariant text-[10px] font-black uppercase">{m.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        {renderHeader()}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="text-onSurface mt-4">Loading level...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 bg-background">
        {renderHeader()}
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text className="text-onSurface text-xl font-black mt-4 text-center">
            Unable to Load Level
          </Text>
          <Text className="text-onSurfaceVariant text-center mt-2 mb-6">
            {error}
          </Text>
          <Button
            onPress={() => {
              setError(null);
              setIsLoading(true);
              // Reload the level
              const loadLevel = async () => {
                try {
                  const apiLevel = await convexHttpClient.query(api.queries.getLevelById, { id: id as string });
                  if (apiLevel) {
                    const localLevel = getLocalLevelById(id as string);
                    const processedLevel = {
                      ...apiLevel,
                      // Use local asset for display, API URL for evaluation
                      targetImageUrl: localLevel?.targetImageUrl ?? apiLevel.targetImageUrl,
                      // Use API-provided Convex storage URL for evaluation (ensure it's a string)
                      targetImageUrlForEvaluation: typeof apiLevel.targetImageUrl === 'string' ? apiLevel.targetImageUrl : undefined,
                      hiddenPromptKeywords: apiLevel.hiddenPromptKeywords || localLevel?.hiddenPromptKeywords || [],
                    };
                    setLevel(processedLevel);
                    startLevel(processedLevel.id);
                    NanoAssistant.resetHintsForLevel(processedLevel.id);
                    setHints([]);
                  }
                } catch (err) {
                  logger.error('GameScreen', err, { operation: 'retryLoadLevel', id });
                  setError('Failed to load level. Please check your connection and try again.');
                } finally {
                  setIsLoading(false);
                }
              };
              loadLevel();
            }}
            className="mb-4"
          >
            Try Again
          </Button>
          <Button
            variant="outline"
            onPress={() => router.back()}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  // Show error if level not loaded
  if (!level) {
    return (
      <View className="flex-1 bg-background">
        {renderHeader()}
        <View className="flex-1 items-center justify-center">
          <Text className="text-onSurface">No level data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {renderHeader()}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          onScroll={(event) => {
            scrollYRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 + keyboardHeight }}
        >
          {level.type === 'image' && renderImageChallenge()}
          {level.type === 'code' && renderCodeChallenge()}
          {level.type === 'copywriting' && renderCopywritingChallenge()}

          {renderPromptSection()}
          {renderFeedbackSection()}
        </ScrollView>
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={inputAccessoryId}>
          <View className="px-4 py-2 bg-surface border-t border-outline flex-row justify-end">
            <TouchableOpacity
              onPress={Keyboard.dismiss}
              className="px-4 py-2 rounded-full bg-primary/15"
            >
              <Text className="text-primary text-xs font-black uppercase tracking-widest">Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {Platform.OS === 'android' && keyboardHeight > 0 && (
        <View
          className="absolute left-0 right-0 px-4 py-2 bg-surface border-t border-outline flex-row justify-end"
          style={{ bottom: keyboardHeight }}
        >
          <TouchableOpacity
            onPress={Keyboard.dismiss}
            className="px-4 py-2 rounded-full bg-primary/15"
          >
            <Text className="text-primary text-xs font-black uppercase tracking-widest">Done</Text>
          </TouchableOpacity>
        </View>
      )}

      <ResultModal
        visible={showResult}
        score={lastScore || 0}
        xp={50}
        moduleType={level.type}
        testCases={codeExecutionResult?.testResults}
        output={codeExecutionResult?.output}
        copyMetrics={copyScoringResult?.metrics}
        imageSimilarity={lastScore || undefined}
        imageFeedback={feedback}
        keywordsMatched={matchedKeywords}
        onNext={() => {
          setShowResult(false);
          if (level) {
            const moduleId = getModuleIdFromLevelType(level.type || 'image');
            router.push(`/game/levels/${moduleId}`);
          } else {
            router.push(`/game/levels/${getModuleIdFromLevelType('image')}`);
          }
        }}
        onClose={() => setShowResult(false)}
      />
    </View>
  );
}
