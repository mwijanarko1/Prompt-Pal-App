import { View, Text, Image, Alert, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Keyboard, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card, Badge, ProgressBar, RadarChart, ResultModal } from '@/components/ui';
import { getLevelById as getLocalLevelById } from '@/features/levels/data';
import { AIProxyClient } from '@/lib/aiProxy';
import { apiClient, Level } from '@/lib/api';
import { useGameStore, ChallengeType, Level as GameLevel } from '@/features/game/store';
import { logger } from '@/lib/logger';
import { NanoAssistant } from '@/lib/nanoAssistant';
import { PromptInputView } from '@/features/game/components/PromptInputView';

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
  const [promptError, setPromptError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [hints, setHints] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  const [hintCooldown, setHintCooldown] = useState(0);
  const [showHints, setShowHints] = useState(false);

  const { loseLife, startLevel, completeLevel, lives } = useGameStore();

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
          NanoAssistant.resetHintsForLevel(processedLevel.id);
          setHints([]);
        } else {
          throw new Error('Level not found');
        }
      } catch (err: unknown) {
        logger.error('GameScreen', err, { operation: 'loadLevel', id });
        let errorMessage = 'Failed to load level. Please try again.';
        const e = err as { status?: number; message?: string };
        if (e.status === 403) {
          errorMessage = 'This level is locked. Complete previous levels to unlock it.';
        } else if (e.status === 404) {
          errorMessage = 'Level not found.';
        } else if (e.status === 401) {
          errorMessage = 'Authentication required. Please sign in again.';
        } else if (e.message) {
          errorMessage = e.message;
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
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {}
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-onSurface mt-4 font-black">Loading Challenge…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text className="text-onSurface text-xl font-black mt-4 text-center">Unable to Load Level</Text>
          <Text className="text-onSurfaceVariant text-center mt-2 mb-6">{error}</Text>
          <Button
            onPress={() => {
              setError(null);
              setIsLoading(true);
              (async () => {
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
                    setError(null);
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
              })();
            }}
            className="mb-4"
          >
            Try Again
          </Button>
          <Button variant="outline" onPress={() => router.back()}>Go Back</Button>
        </View>
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setPromptError('Please enter a prompt');
      return;
    }

    // Clear any previous errors
    setPromptError(undefined);
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
    } catch (err: unknown) {
      logger.error('GameScreen', err, { operation: 'handleGenerate' });
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 429) {
        Alert.alert('Rate Limited', 'Too many requests. Please wait before trying again.');
      } else if (e.response?.status === 403) {
        Alert.alert('Content Policy', 'Your prompt may violate content policies. Please try a different prompt.');
      } else {
        setPromptError('Something went wrong. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear error when prompt changes
  const handlePromptChange = (text: string) => {
    setPrompt(text);
    if (promptError) {
      setPromptError(undefined);
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
    if (!level) return null;

    const moduleType = (level.type || 'image') as ChallengeType;

    return (
      <PromptInputView
        value={prompt}
        onChangeText={handlePromptChange}
        onGenerate={handleGenerate}
        placeholder={moduleType === 'image' ? "Describe the floating islands, the nebula sky..." : "Enter your prompt here..."}
        isLoading={isGenerating}
        disabled={isLoading}
        level={level as GameLevel}
        moduleType={moduleType}
        styleBadge={level.type === 'image' ? level.style : undefined}
        error={promptError}
      />
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
