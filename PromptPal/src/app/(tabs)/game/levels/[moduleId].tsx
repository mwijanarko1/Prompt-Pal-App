import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { processApiLevelsWithLocalAssets } from '@/features/levels/data';
import { Card, Badge, ProgressBar } from '@/components/ui';
import { useGameStore } from '@/features/game/store';
import { useUserProgressStore } from '@/features/user/store';
import { apiClient, Level } from '@/lib/api';
import { logger } from '@/lib/logger';

export default function LevelsScreen() {
  const { moduleId } = useLocalSearchParams();
  const router = useRouter();
  const { completedLevels, unlockedLevels } = useGameStore();
  const { learningModules } = useUserProgressStore();
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const module = useMemo(() =>
    learningModules.find(m => m.id === moduleId),
    [learningModules, moduleId]
  );

  // Calculate actual progress based on completed levels
  const actualProgress = useMemo(() => {
    if (levels.length === 0) return 0;

    // Count completed levels for this module
    const completedInModule = levels.filter(level => completedLevels.includes(level.id)).length;
    const progress = (completedInModule / levels.length) * 100;

    return Math.round(progress);
  }, [levels, completedLevels]);

  // Update module progress in user store when it changes significantly
  useEffect(() => {
    if (moduleId && actualProgress !== module?.progress && levels.length > 0 && Math.abs(actualProgress - (module?.progress || 0)) >= 1) {
      useUserProgressStore.getState().updateModuleProgress(moduleId as string, actualProgress);
    }
  }, [actualProgress, moduleId, module?.progress, levels.length]);

  useEffect(() => {
    const loadLevels = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let type: any = moduleId;
        if (moduleId === 'image-generation') type = 'image';
        // Fetch all levels from API only
        const rawApiLevels = await apiClient.getLevels();

        if (rawApiLevels && rawApiLevels.length > 0) {
          // Filter levels by module type - try moduleId first, fallback to type mapping
          let moduleLevels = rawApiLevels.filter(level => level.moduleId === moduleId);

          // If no levels found by moduleId, try filtering by type
          if (moduleLevels.length === 0) {
            const expectedType = moduleId === 'image-generation' ? 'image' :
                                moduleId === 'code-logic' ? 'code' :
                                moduleId === 'copywriting' ? 'copywriting' : moduleId;
            moduleLevels = rawApiLevels.filter(level => level.type === expectedType);
          }

          if (moduleLevels.length === 0) {
            setError('No levels found for this module');
            return;
          }

          const processedLevels = processApiLevelsWithLocalAssets(moduleLevels as any);
          setLevels(processedLevels as any);
        } else {
          setError('No levels available from the server');
        }
      } catch (error) {
        logger.error('LevelsScreen', error, { operation: 'loadLevels', moduleId });
        setError('Failed to load levels. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (moduleId) {
      loadLevels();
    }
  }, [moduleId]);

  const renderLevelCard = (level: any, index: number) => {
    const isCompleted = completedLevels.includes(level.id);
    const isUnlocked = unlockedLevels.includes(level.id) || level.unlocked;
    
    return (
      <TouchableOpacity
        key={level.id}
        onPress={() => isUnlocked && router.push(`/(tabs)/game/${level.id}`)}
        disabled={!isUnlocked}
        className="mb-4"
      >
        <Card className={`p-5 rounded-[24px] border-0 flex-row items-center ${isUnlocked ? 'bg-surface' : 'bg-surfaceVariant/20 opacity-60'}`}>
          <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isCompleted ? 'bg-success/20' : isUnlocked ? 'bg-primary/10' : 'bg-surfaceVariant'}`}>
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            ) : isUnlocked ? (
              <Text className="text-primary font-black text-lg">{index + 1}</Text>
            ) : (
              <Ionicons name="lock-closed" size={20} color="#6B7280" />
            )}
          </View>
          
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text className="text-onSurface text-base font-black mr-2">{level.title}</Text>
              <Badge 
                label={level.difficulty} 
                variant={level.difficulty === 'beginner' ? 'success' : level.difficulty === 'intermediate' ? 'primary' : 'error'}
                className="px-2 py-0.5"
              />
            </View>
            <Text className="text-onSurfaceVariant text-xs uppercase tracking-widest font-bold">
              {level.type} Challenge • {level.passingScore}% to pass
            </Text>
          </View>
          
          {isUnlocked && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
        </Card>
      </TouchableOpacity>
    );
  };

  if (!module) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-onSurface text-xl font-black mb-4">Module not found</Text>
        <TouchableOpacity 
          className="bg-primary px-8 py-4 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-black">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant/50 mb-4"
        >
          <Ionicons name="arrow-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        
        <View className="flex-row items-center mb-6">
          <View className={`w-14 h-14 rounded-2xl items-center justify-center mr-4 ${module.accentColor}`}>
            <Text className="text-2xl">{module.icon}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-primary text-[10px] font-black uppercase tracking-[4px] mb-1">{module.category}</Text>
            <Text className="text-onSurface text-2xl font-black">{module.title}</Text>
          </View>
        </View>

        <View className="bg-surfaceVariant/20 p-5 rounded-[32px] mb-8 border border-outline/10">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">Module Progress</Text>
            <Text className="text-primary font-black">{actualProgress}%</Text>
          </View>
          <ProgressBar progress={actualProgress / 100} height={8} />
        </View>

        <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-4">Learning Path</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-onSurface mt-4 font-black">Loading Levels…</Text>
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={64} color="#9CA3AF" />
          <Text className="text-onSurface text-xl font-black mt-4 mb-2">Unable to Load Levels</Text>
          <Text className="text-onSurfaceVariant text-center font-medium leading-5 mb-6">
            {error}
          </Text>
          <TouchableOpacity
            className="bg-primary px-8 py-4 rounded-full"
            onPress={() => {
              // Trigger reload by updating moduleId dependency
              const currentModuleId = moduleId;
              setError(null);
              // Force re-run of useEffect
              if (currentModuleId) {
                // This will trigger the useEffect again
                setLevels([]);
              }
            }}
          >
            <Text className="text-white font-black">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {levels.map(renderLevelCard)}

          {levels.length === 0 && (
            <View className="items-center py-20">
              <Ionicons name="construct-outline" size={64} color="#9CA3AF" />
              <Text className="text-onSurfaceVariant text-center mt-4 font-bold">
                No levels available for this module.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
