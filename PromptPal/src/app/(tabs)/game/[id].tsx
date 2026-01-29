import { View, Text, Image, Alert, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Keyboard, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card, Badge, ProgressBar, RadarChart, ResultModal } from '@/components/ui';
import { getLevelById as getLocalLevelById, processApiLevelsWithLocalAssets } from '@/features/levels/data';
import { AIProxyClient } from '@/lib/aiProxy';
import { apiClient, Level } from '@/lib/api';
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
  const [lastScore, setLastScore] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hint system state
  const [hints, setHints] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const { lives, loseLife, startLevel, completeLevel } = useGameStore();

  // ScrollView ref for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const loadLevel = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get level data from API only
        const apiLevel = await apiClient.getLevelById(id as string);

        if (apiLevel) {
          // Process with local assets if available (for images only)
          const localLevel = getLocalLevelById(id as string);
          const processedLevel = {
            ...apiLevel,
            targetImageUrl: localLevel?.targetImageUrl || apiLevel.targetImageUrl,
            hiddenPromptKeywords: apiLevel.hiddenPromptKeywords || localLevel?.hiddenPromptKeywords || [],
          };

          setLevel(processedLevel);
          startLevel(processedLevel.id);
          // Reset hints for this level
          NanoAssistant.resetHintsForLevel(processedLevel.id);
          setHints([]);
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

  // Keyboard handling - scroll to input when keyboard shows
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Small delay to ensure UI has updated
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Optional: scroll back to top when keyboard hides
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
        const generateResult = await apiClient.generateImage(prompt, Date.now());
        const generatedImageUrl = generateResult.imageUrl;
        setGeneratedImage(generatedImageUrl);
        setActiveTab('attempt');

        // Step 2: Evaluate the generated image
        const evaluationResult = await apiClient.evaluateImageAdvanced({
          taskId: level.id,
          userImageUrl: generatedImageUrl,
          expectedImageUrl: level.targetImageUrl!,
          hiddenPromptKeywords: level.hiddenPromptKeywords,
          style: level.style,
          userPrompt: prompt,
          // Note: targetPrompt would come from level data if we add it
        });

        const evaluation = evaluationResult.evaluation;
        const score = evaluation.score;

        // Apply hint penalty to score
        const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
        const finalScore = penaltyDetails.finalScore;

        setLastScore(finalScore);

        if (finalScore >= level.passingScore) {
          // Update progress - user passed
          await apiClient.updateProgress({
            levelId: level.id,
            score: finalScore,
            completed: true,
            bestScore: finalScore // In a real app, you'd track the best score
          });

          setShowResult(true);
          completeLevel(level.id);
        } else {
          // User didn't pass - lose a life
          const newLives = lives - 1;
          await apiClient.updateGameState({
            lives: newLives
          });

          loseLife();

          // Show detailed feedback
          let message = `Score: ${finalScore}%\n\n`;
          if (evaluation.feedback && evaluation.feedback.length > 0) {
            message += `Feedback:\n${evaluation.feedback.join('\n')}\n\n`;
          }
          if (evaluation.keywordsMatched && evaluation.keywordsMatched.length > 0) {
            message += `Keywords captured: ${evaluation.keywordsMatched.join(', ')}\n`;
          }
          message += `Need ${level.passingScore}% to pass.`;

          Alert.alert('Try Again', message);
        }
      } else if (level.type === 'code') {
        // Mocking logic evaluation for now
        await new Promise(resolve => setTimeout(resolve, 1500));
        const score = 100;

        const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
        const finalScore = penaltyDetails.finalScore;

        setLastScore(finalScore);
        if (finalScore >= level.passingScore) {
          setShowResult(true);
          completeLevel(level.id);
        } else {
          loseLife();
          Alert.alert('Try Again', `Score: ${finalScore}%. Need ${level.passingScore}% to pass.`);
        }
      } else if (level.type === 'copywriting') {
        // Mocking copywriting evaluation for now
        await new Promise(resolve => setTimeout(resolve, 1500));
        const score = 85;

        const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
        const finalScore = penaltyDetails.finalScore;

        setLastScore(finalScore);
        if (finalScore >= level.passingScore) {
          setShowResult(true);
          completeLevel(level.id);
        } else {
          loseLife();
          Alert.alert('Try Again', `Score: ${finalScore}%. Need ${level.passingScore}% to pass.`);
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

    console.log('[DEBUG] renderImageChallenge:', {
      activeTab,
      imageUri,
      isLocalAsset,
      levelId: level.id,
      targetImageUrl: level.targetImageUrl
    });

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
                source={isLocalAsset ? imageUri : { uri: imageUri }}
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
        <Image
          source={{ uri: level.targetImageUrl }}
          className="w-full h-48"
          resizeMode="cover"
        />
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
            className={`flex-row items-center px-3 py-2 rounded-full ${
              noHintsLeft ? 'bg-surfaceVariant/30' : hintCooldown > 0 ? 'bg-surfaceVariant/50' : 'bg-secondary/20'
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
                  const apiLevel = await apiClient.getLevelById(id as string);
                  if (apiLevel) {
                    const localLevel = getLocalLevelById(id as string);
                    const processedLevel = {
                      ...apiLevel,
                      targetImageUrl: localLevel?.targetImageUrl || apiLevel.targetImageUrl,
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
        score={lastScore}
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
