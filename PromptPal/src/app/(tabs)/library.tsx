import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Badge, Card, ProgressBar, ResourceModal } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { convexHttpClient } from '@/lib/convex-client';
import { api } from '../../../convex/_generated/api.js';
import { getModuleThumbnail } from '@/lib/thumbnails';
import { promptingTipsData } from '@/lib/promptingTips';

interface ModuleCardProps {
  module: any;
  categoryIdx: number;
  moduleIdx: number;
  onPress: (module: any) => void;
}

const ModuleCard = memo(function ModuleCard({ module, categoryIdx, moduleIdx, onPress }: ModuleCardProps) {
  const thumbnail = getModuleThumbnail(module.title, module.category, module.topic);
  const progress = module.userProgress || 0;

  const handlePress = useCallback(() => {
    onPress(module);
  }, [onPress, module]);

  return (
    <Pressable
      onPress={handlePress}
      className="mr-4 w-64"
    >
      <Card className="p-0 overflow-hidden rounded-[32px] border-0 bg-surface shadow-md">
        <View className="h-32 bg-primary/10 relative items-center justify-center">
          {thumbnail ? (
            <Image source={thumbnail} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Ionicons name={module.icon as any || 'school'} size={48} color="#FF6B00" />
          )}
          <View className="absolute top-3 right-3">
            <Badge
              label={module.format || 'interactive'}
              variant="primary"
              className="bg-primary px-2 py-0.5 rounded-full"
            />
          </View>
        </View>
        <View className="p-4">
          <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-1">
            {module.topic} • {module.estimatedTime || 10}m
          </Text>
          <Text className="text-onSurface text-base font-black mb-3" numberOfLines={1}>{module.title}</Text>
          <ProgressBar progress={progress / 100} height={4} className="mb-2" />
          <View className="flex-row justify-between items-center">
            <Text className="text-onSurfaceVariant text-[10px] font-bold">{progress}% Complete</Text>
            <Pressable className="flex-row items-center">
              <Text className="text-primary text-xs font-black mr-1">Start</Text>
              <Ionicons name="play" size={12} color="#FF6B00" />
            </Pressable>
          </View>
        </View>
      </Card>
    </Pressable>
  );
});

interface ResourceCardProps {
  resource: any;
  categoryIdx: number;
  resIdx: number;
  onPress: (resource: any) => void;
}

const ResourceCard = memo(function ResourceCard({ resource, categoryIdx, resIdx, onPress }: ResourceCardProps) {
  const getResourceIcon = useCallback((type: string) => {
    switch (type) {
      case 'guide': return 'book';
      case 'cheatsheet': return 'flash';
      case 'lexicon': return 'text';
      case 'case-study': return 'bulb';
      case 'prompting-tip': return 'chatbubble-ellipses';
      default: return 'document-text';
    }
  }, []);

  const handlePress = useCallback(() => {
    onPress(resource);
  }, [onPress, resource]);

  return (
    <Pressable
      onPress={handlePress}
      className="mb-4"
    >
      <Card className="flex-row items-center p-4 rounded-[24px] border-0 bg-surfaceVariant/30">
        <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mr-4">
          <Ionicons name={getResourceIcon(resource.type) as any} size={24} color="#FF6B00" />
        </View>
        <View className="flex-1">
          <Text className="text-onSurface text-base font-black">{resource.title}</Text>
          <Text className="text-onSurfaceVariant text-xs" numberOfLines={1}>{resource.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </Card>
    </Pressable>
  );
});

interface CategorySectionProps {
  category: any;
  index: number;
  onModulePress: (module: any) => void;
  onResourcePress: (resource: any) => void;
}

const CategorySection = memo(function CategorySection({ 
  category, 
  index, 
  onModulePress, 
  onResourcePress 
}: CategorySectionProps) {
  return (
    <View className="mb-10">
      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-primary text-[10px] font-black uppercase tracking-[2px] mb-1">Category</Text>
          <Text className="text-onSurface text-2xl font-black">{category.category}</Text>
        </View>
      </View>

      {/* Modules Horizontal Scroll */}
      {category.modules.length > 0 && (
        <View className="mb-6">
          <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-3">Training Path</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {category.modules.map((module: any, mIdx: number) => (
              <ModuleCard 
                key={`module-${index}-${module.id}-${mIdx}`}
                module={module}
                categoryIdx={index}
                moduleIdx={mIdx}
                onPress={onModulePress}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Resources List */}
      {category.resources.length > 0 && (
        <View>
          <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-3">Resources</Text>
          {category.resources.map((resource: any, rIdx: number) => (
            <ResourceCard
              key={`res-${index}-${resource.id}-${rIdx}`}
              resource={resource}
              categoryIdx={index}
              resIdx={rIdx}
              onPress={onResourcePress}
            />
          ))}
        </View>
      )}
    </View>
  );
});

interface UserSummaryProps {
  userSummary: {
    totalXp: number;
    currentLevel: number;
    streak: number;
    completedLevels: number;
  };
}

const UserSummary = memo(function UserSummary({ userSummary }: UserSummaryProps) {
  return (
    <View className="flex-row justify-between mb-8 bg-surfaceVariant/20 p-5 rounded-[32px] border border-outline/10">
      <View className="items-center flex-1 border-r border-outline/10">
        <Text className="text-primary font-black text-xl">{userSummary.totalXp}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">Total XP</Text>
      </View>
      <View className="items-center flex-1 border-r border-outline/10">
        <Text className="text-primary font-black text-xl">{userSummary.currentLevel}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">Level</Text>
      </View>
      <View className="items-center flex-1 border-r border-outline/10">
        <Text className="text-primary font-black text-xl">{userSummary.streak}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">Streak</Text>
      </View>
      <View className="items-center flex-1">
        <Text className="text-primary font-black text-xl">{userSummary.completedLevels}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">Done</Text>
      </View>
    </View>
  );
});

export default function LibraryScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [libraryData, setLibraryData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [isResourceModalVisible, setIsResourceModalVisible] = useState(false);

  // Fetch library data from API
  useEffect(() => {
    if (isLoaded && isSignedIn && user?.id) {
      fetchLibraryData();
    }
  }, [isLoaded, isSignedIn, user?.id]);

  const fetchLibraryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await convexHttpClient.query(api.queries.getLibraryData, {
        userId: user?.id || '',
        appId: "prompt-pal",
      });

      // Merge hardcoded prompting tips with fetched data
      const enhancedData = {
        ...data,
        categories: data.categories.map(category => ({
          ...category,
          resources: [
            ...category.resources,
            ...promptingTipsData.filter(tip => tip.category === category.category)
          ]
        }))
      };

      setLibraryData(enhancedData);
    } catch (err) {
      console.error('Failed to fetch library data:', err);
      setError('Failed to load library. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleResourcePress = useCallback((resource: any) => {
    setSelectedResource(resource);
    setIsResourceModalVisible(true);
  }, []);

  const handleModulePress = useCallback((module: any) => {
    if (module.format === 'video') {
      // Future: open video player
      console.log('Open video player for:', module.title);
    } else {
      router.push(`/game/levels/${module.id}`);
    }
  }, [router]);

  const handleRetry = useCallback(() => {
    fetchLibraryData();
  }, [fetchLibraryData]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-onSurface mt-4 font-black">Curating your library…</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons name="alert-circle" size={64} color="#F44336" />
        <Text className="text-onSurface text-xl font-black mt-4 mb-2">Oops!</Text>
        <Text className="text-onSurfaceVariant text-center mb-6">{error}</Text>
        <Pressable
          className="bg-primary px-8 py-4 rounded-full"
          onPress={handleRetry}
        >
          <Text className="text-white font-black uppercase tracking-widest">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-primary text-[10px] font-black uppercase tracking-[4px] mb-1">Academy</Text>
            <Text className="text-onSurface text-3xl font-black">Knowledge Base</Text>
          </View>
          <Pressable className="w-12 h-12 bg-surfaceVariant/50 rounded-full items-center justify-center">
            <Ionicons name="search" size={20} color="#6B7280" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {libraryData && <UserSummary userSummary={libraryData.userSummary} />}

        {libraryData?.categories.map((cat: any, idx: number) => (
          <CategorySection
            key={idx}
            category={cat}
            index={idx}
            onModulePress={handleModulePress}
            onResourcePress={handleResourcePress}
          />
        ))}
      </ScrollView>

      <ResourceModal
        isVisible={isResourceModalVisible}
        onClose={() => setIsResourceModalVisible(false)}
        resource={selectedResource}
      />
    </SafeAreaView>
  );
}
