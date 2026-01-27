import { View, Text, Image, Alert, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Keyboard, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Button, Card, Badge, ProgressBar, RadarChart, ResultModal } from '@/components/ui';
import { getLevelById as getLocalLevelById } from '@/features/levels/data';
import { AIProxyClient } from '@/lib/aiProxy';
import { ApiClient, Level as ApiLevel } from '@/lib/api';
import { useGameStore, ChallengeType, Level } from '@/features/game/store';
import { logger } from '@/lib/logger';
import { NanoAssistant } from '@/lib/nanoAssistant';
import { PromptInputView } from '@/features/game/components/PromptInputView';

const { width } = Dimensions.get('window');

export default function GameScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'target' | 'attempt'>('target');
  const [showResult, setShowResult] = useState(false);
  const [lastScore, setLastScore] = useState(0);
  const [level, setLevel] = useState<ApiLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promptError, setPromptError] = useState<string | undefined>();

  const { loseLife, startLevel, completeLevel } = useGameStore();

  useEffect(() => {
    const loadLevel = async () => {
      setIsLoading(true);
      try {
        // Try local first
        const localLevel = getLocalLevelById(id as string);
        if (localLevel) {
          setLevel(localLevel as any);
          startLevel(localLevel.id);
          // Reset hints for this level
          NanoAssistant.resetHintsForLevel(localLevel.id);
          setIsLoading(false);
          return;
        }

        // Try API
        console.log('[DEBUG] Level not found locally, fetching from API:', id);
        const apiLevel = await ApiClient.getLevelById(id as string);
        if (apiLevel) {
          setLevel(apiLevel);
          startLevel(apiLevel.id);
          // Reset hints for this level
          NanoAssistant.resetHintsForLevel(apiLevel.id);
        }
      } catch (error) {
        logger.error('GameScreen', error, { operation: 'loadLevel', id });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadLevel();
    }
  }, [id, startLevel]);


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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setPromptError('Please enter a prompt');
      return;
    }

    // Clear any previous errors
    setPromptError(undefined);
    setIsGenerating(true);
    try {
      let score = 0;
      
      if (level.type === 'image') {
        const result = await AIProxyClient.generateImage(prompt);
        setGeneratedImage(result.imageUrl!);
        setActiveTab('attempt');
        score = Math.floor(Math.random() * 30) + 70; // Mock score
      } else if (level.type === 'code') {
        // Mocking logic evaluation
        await new Promise(resolve => setTimeout(resolve, 1500));
        score = 100;
      } else if (level.type === 'copywriting') {
        // Mocking copywriting evaluation
        await new Promise(resolve => setTimeout(resolve, 1500));
        score = 85;
      }

      // Apply hint penalty to score (passing score ensures hints can't block a deserved pass)
      const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
      const finalScore = penaltyDetails.finalScore;
      
      setLastScore(finalScore);
      if (finalScore >= level.passingScore) {
        setShowResult(true);
        completeLevel(level.id);
      } else {
        loseLife();
        let message = `Your score: ${finalScore}%`;
        if (penaltyDetails.hintsUsed > 0) {
          message += ` (Base: ${score}%, -${penaltyDetails.penaltyPoints} from ${penaltyDetails.hintsUsed} hint${penaltyDetails.hintsUsed > 1 ? 's' : ''})`;
        }
        message += `. You need ${level.passingScore}% to pass.`;
        Alert.alert('Try Again', message);
      }
    } catch (error) {
      logger.error('GameScreen', error, { operation: 'handleGenerate' });
      setPromptError('Something went wrong. Please try again.');
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
    <View className="px-6 py-2">
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant">
          <Text className="text-onSurface text-xl font-bold">←</Text>
        </TouchableOpacity>
        
        <View className="items-center">
          <Text className="text-primary text-[10px] font-black uppercase tracking-widest mb-0.5">
            {level.type === 'image' ? 'CHALLENGE' : level.type === 'code' ? level.moduleTitle : 'COPYWRITING CHALLENGE'}
          </Text>
          <Text className="text-onSurface text-base font-black">
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
  );

  const renderImageChallenge = () => (
    <>
      <View className="px-6 pt-4 pb-6">
        <Card className="p-0 overflow-hidden rounded-[40px] border-0" variant="elevated">
          <View className="aspect-square relative">
            <Image
              source={{ uri: activeTab === 'target' ? level.targetImageUrl : (generatedImage || level.targetImageUrl) }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {activeTab === 'target' && (
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
    </>
  );

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
    const placeholder = moduleType === 'image' 
      ? "Describe the floating islands, the nebula sky..." 
      : "Enter your prompt here...";

    return (
      <PromptInputView
        value={prompt}
        onChangeText={handlePromptChange}
        onGenerate={handleGenerate}
        placeholder={placeholder}
        isLoading={isGenerating}
        disabled={isLoading}
        level={level as Level}
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
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {renderHeader()}

      <Pressable onPress={() => Keyboard.dismiss()} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {level.type === 'image' && renderImageChallenge()}
          {level.type === 'code' && renderCodeChallenge()}
          {level.type === 'copywriting' && renderCopywritingChallenge()}

          {renderPromptSection()}
          {renderFeedbackSection()}
        </ScrollView>
      </Pressable>

      <ResultModal
        visible={showResult}
        score={lastScore}
        xp={50}
        testCases={level.testCases}
        output={level.type === 'code' ? "[{'name': 'Alice', 'age': 32}, {'name': 'Bob', 'age': 25}]" : undefined}
        onNext={() => {
          setShowResult(false);
          router.back();
        }}
        onClose={() => setShowResult(false)}
      />
    </KeyboardAvoidingView>
  );
}
