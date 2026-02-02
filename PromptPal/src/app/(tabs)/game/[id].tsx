import { View, Text, Image, Alert, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Keyboard, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card, Badge, ProgressBar, RadarChart, ResultModal } from '@/components/ui';
import { getLevelById as getLocalLevelById, processApiLevelsWithLocalAssets } from '@/features/levels/data';
import { getSharedClient, Level, UserLevelAttempt } from '@/lib/unified-api';
import { useGameStore, ChallengeType } from '@/features/game/store';
import { logger } from '@/lib/logger';
import { NanoAssistant } from '@/lib/nanoAssistant';

const { width } = Dimensions.get('window');

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
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'target' | 'attempt'>('target');
  const [showResult, setShowResult] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [attemptHistory, setAttemptHistory] = useState<UserLevelAttempt[]>([]);
  const [level, setLevel] = useState<Level | null>(null);

  // Refs for keyboard scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<View>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hint system state
  const [hints, setHints] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const { lives, loseLife, startLevel, completeLevel } = useGameStore();

  useEffect(() => {
    const loadLevel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get level data from API only
        const apiLevel = await getSharedClient().getLevelById(id as string);

        if (apiLevel) {
          // Process with local assets if available (for images only)
          const localLevel = getLocalLevelById(id as string);
          const processedLevel = {
            ...apiLevel,
            // Use local asset for display, API URL for evaluation
            targetImageUrl: localLevel?.targetImageUrl,
            // Use API-provided Convex storage URL for evaluation (ensure it's a string)
            targetImageUrlForEvaluation: typeof apiLevel.targetImageUrl === 'string' ? apiLevel.targetImageUrl : undefined,
            hiddenPromptKeywords: apiLevel.hiddenPromptKeywords || localLevel?.hiddenPromptKeywords || [],
          };

          setLevel(processedLevel);
          startLevel(processedLevel.id);
          // Reset hints for this level
          NanoAssistant.resetHintsForLevel(processedLevel.id);
          setHints([]);

          // Fetch attempt history for this level
          try {
            const attemptsResponse = await getSharedClient().getLevelAttempts(id as string);
            const attempts = attemptsResponse.attempts || [];
            setAttemptHistory(attempts);

            // Restore the latest attempt's image and evaluation data if available
            if (attempts.length > 0) {
              const latestAttempt = attempts[attempts.length - 1]; // Most recent attempt
              if (latestAttempt.imageUrl) {
                setGeneratedImage(latestAttempt.imageUrl);
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
  }, [id, startLevel]);

  // Hint cooldown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const { isOnCooldown, remainingMs } = NanoAssistant.getCooldownStatus();
      setHintCooldown(isOnCooldown ? Math.ceil(remainingMs / 1000) : 0);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Keyboard handling - no scrolling when keyboard shows
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Keyboard shown - no scrolling behavior
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Keyboard hidden - no scrolling behavior
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
        const client = getSharedClient();
        const generateResult = await client.generateImage(prompt);
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

        const evaluationResult = await client.evaluateImage({
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
          await client.saveLevelAttempt(level.id, {
            score: finalScore,
            feedback: evaluation.feedback || [],
            keywordsMatched: evaluation.keywordsMatched || [],
            imageUrl: generatedImageUrl,
          });

          // Refresh attempt history to include the new attempt
          const attemptsResponse = await client.getLevelAttempts(level.id);
          setAttemptHistory(attemptsResponse.attempts || []);
        } catch (saveError) {
          // Don't fail the evaluation if saving attempt fails
          logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
        }

        if (finalScore >= level.passingScore) {
          // Update progress - user passed
          await client.updateProgress({
            levelId: level.id,
            score: finalScore,
            completed: true,
            bestScore: finalScore // In a real app, you'd track the best score
          });

          setShowResult(true);
          await completeLevel(level.id);
        } else {
          // User didn't pass - lose a life
          await loseLife();

          // Evaluation results are already displayed inline below the button
        }
      } else if (level.type === 'code') {
        // Code evaluation not yet implemented
        Alert.alert(
          'Coming Soon',
          'Code challenges are being implemented. Please try image generation challenges instead!',
          [{ text: 'OK' }]
        );
      } else if (level.type === 'copywriting') {
        // Copywriting evaluation not yet implemented
        Alert.alert(
          'Coming Soon',
          'Copywriting challenges are being implemented. Please try image generation challenges instead!',
          [{ text: 'OK' }]
        );
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
              router.push(`/(tabs)/game/levels/${moduleId}`);
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

        {level.type !== 'image' && (
          <View className="flex-row items-center mb-2">
            <ProgressBar progress={level.type === 'code' ? 0.33 : 0.6} className="flex-1 mr-4" />
            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
              {level.type === 'code' ? '4/12' : '60% COMPLETE'}
            </Text>
          </View>
        )}
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

  const renderCodeChallenge = () => (
    <View className="px-6 py-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-onSurface text-xl font-black">Requirement Brief</Text>
        <Badge label={level.language || ''} variant="primary" className="bg-primary/20 border-0 px-3 py-1 rounded-full" />
      </View>

      <Card className="p-0 overflow-hidden rounded-[32px] mb-6 border-0" variant="elevated">
        <Image
          source={{ uri: level.requirementImage }}
          className="w-full h-48"
          resizeMode="cover"
        />
        <View className="p-6 bg-surface">
          <View className="flex-row items-center mb-3">
            <Text className="text-primary text-lg mr-2">⌨</Text>
            <Text className="text-primary text-[10px] font-black uppercase tracking-widest">ALGORITHM CHALLENGE</Text>
          </View>
          <Text className="text-onSurface text-2xl font-black mb-3">{level.title}</Text>
          <Text className="text-onSurfaceVariant text-base leading-6">
            {level.requirementBrief}
          </Text>
        </View>
      </Card>
    </View>
  );

  const renderCopywritingChallenge = () => (
    <View className="px-6 py-4">
      <Text className="text-onSurface text-xl font-black mb-4">{level.briefTitle}</Text>

      <Card className="p-0 overflow-hidden rounded-[32px] mb-6 border-0" variant="elevated">
        {level.targetImageUrl && (
          <Image
            source={typeof level.targetImageUrl === 'number' ? level.targetImageUrl : { uri: level.targetImageUrl }}
            className="w-full h-48"
            resizeMode="cover"
          />
        )}
        <View className="p-6 bg-surface">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Badge label="PROJECT" variant="primary" className="bg-primary/20 border-0 mb-1 self-start" />
              <Text className="text-onSurface text-xl font-black">{level.briefProduct}</Text>
            </View>
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1">
              <Text className="text-onSurfaceVariant text-xs font-bold uppercase mb-1">Target</Text>
              <Text className="text-onSurface text-sm font-bold">{level.briefTarget}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-onSurfaceVariant text-xs font-bold uppercase mb-1">Tone</Text>
              <Text className="text-onSurface text-sm font-bold">{level.briefTone}</Text>
            </View>
          </View>

          <Text className="text-onSurfaceVariant text-sm leading-5">
            <Text className="text-onSurface font-bold">Goal:</Text> {level.briefGoal}
          </Text>
        </View>
      </Card>
    </View>
  );

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
            <View className="flex-row items-center">
              <Text className="text-onPrimary text-lg font-black">
                {level.type === 'image' ? 'Generate & Compare' : 'Generate'}
              </Text>
            </View>
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
    if (level.type !== 'copywriting') return null;

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
                  const apiLevel = await getSharedClient().getLevelById(id as string);
                  if (apiLevel) {
                    const localLevel = getLocalLevelById(id as string);
                    const processedLevel = {
                      ...apiLevel,
                      // Use local asset for display, API URL for evaluation
                      targetImageUrl: localLevel?.targetImageUrl,
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
        >
          {level.type === 'image' && renderImageChallenge()}
          {level.type === 'code' && renderCodeChallenge()}
          {level.type === 'copywriting' && renderCopywritingChallenge()}

          {renderPromptSection()}
          {renderFeedbackSection()}
        </ScrollView>
      </KeyboardAvoidingView>

      <ResultModal
        visible={showResult}
        score={lastScore || 0}
        xp={50}
        testCases={level.testCases}
        output={level.type === 'code' ? "[{'name': 'Alice', 'age': 32}, {'name': 'Bob', 'age': 25}]" : undefined}
        onNext={() => {
          setShowResult(false);
          if (level) {
            const moduleId = getModuleIdFromLevelType(level.type || 'image');
            router.push(`/(tabs)/game/levels/${moduleId}`);
          } else {
            router.back();
          }
        }}
        onClose={() => setShowResult(false)}
      />
    </View>
  );
}
