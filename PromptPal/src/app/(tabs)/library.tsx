import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Badge, Card, ProgressBar, ResourceModal } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { ApiClient, LibraryData, LibraryCategory, LearningModule, Resource } from '@/lib/api';
import { getModuleThumbnail } from '@/lib/thumbnails';

const { width } = Dimensions.get('window');

export default function LibraryScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isResourceModalVisible, setIsResourceModalVisible] = useState(false);

  // Fetch library data from API
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchLibraryData();
    }
  }, [isLoaded, isSignedIn]);

  const fetchLibraryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ApiClient.getLibraryData();
      setLibraryData(data);
    } catch (err) {
      console.error('Failed to fetch library data:', err);
      setError('Failed to load library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResourcePress = (resource: Resource) => {
    setSelectedResource(resource);
    setIsResourceModalVisible(true);
  };

  const renderUserSummary = () => {
    if (!libraryData) return null;
    const { userSummary } = libraryData;

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
          <Text className="text-primary font-black text-xl">{userSummary.streak}d</Text>
          <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">Streak</Text>
        </View>
        <View className="items-center flex-1">
          <Text className="text-primary font-black text-xl">{userSummary.completedLevels}</Text>
          <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">Done</Text>
        </View>
      </View>
    );
  };

  const renderModuleCard = (module: LearningModule) => {
    const thumbnail = module.thumbnail || getModuleThumbnail(module.title, module.category, module.topic);
    
    return (
      <TouchableOpacity
        key={module.id}
        onPress={() => {
          if (module.format === 'video') {
            // Future: open video player
            console.log('Open video player for:', module.title);
          } else {
            router.push(`/(tabs)/game/levels/${module.id}`);
          }
        }}
        className="mr-4 w-64"
      >
        <Card className="p-0 overflow-hidden rounded-[32px] border-0 bg-surface shadow-md">
          <View className="h-32 bg-primary/10 relative items-center justify-center">
            {thumbnail ? (
              <Image source={thumbnail} className="w-full h-full" resizeMode="cover" />
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
            <ProgressBar progress={module.progress / 100} height={4} className="mb-2" />
            <View className="flex-row justify-between items-center">
              <Text className="text-onSurfaceVariant text-[10px] font-bold">{module.progress}% Complete</Text>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-primary text-xs font-black mr-1">Start</Text>
                <Ionicons name="play" size={12} color="#FF6B00" />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide': return 'book';
      case 'cheatsheet': return 'flash';
      case 'lexicon': return 'text';
      case 'case-study': return 'bulb';
      default: return 'document-text';
    }
  };

  const renderResourceCard = (resource: Resource) => (
    <TouchableOpacity
      key={resource.id}
      onPress={() => handleResourcePress(resource)}
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
    </TouchableOpacity>
  );

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
        <TouchableOpacity
          className="bg-primary px-8 py-4 rounded-full"
          onPress={fetchLibraryData}
        >
          <Text className="text-white font-black uppercase tracking-widest">Try Again</Text>
        </TouchableOpacity>
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
          <TouchableOpacity className="w-12 h-12 bg-surfaceVariant/50 rounded-full items-center justify-center">
            <Ionicons name="search" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {renderUserSummary()}

        {libraryData?.categories.map((cat, idx) => (
          <View key={idx} className="mb-10">
            <View className="flex-row justify-between items-end mb-4">
              <View>
                <Text className="text-primary text-[10px] font-black uppercase tracking-[2px] mb-1">Category</Text>
                <Text className="text-onSurface text-2xl font-black">{cat.category}</Text>
              </View>
            </View>

            {/* Modules Horizontal Scroll */}
            {cat.modules.length > 0 && (
              <View className="mb-6">
                <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-3">Training Path</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingRight: 20 }}
                >
                  {cat.modules.map(renderModuleCard)}
                </ScrollView>
              </View>
            )}

            {/* Resources List */}
            {cat.resources.length > 0 && (
              <View>
                <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-3">Resources</Text>
                {cat.resources.map(renderResourceCard)}
              </View>
            )}
          </View>
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
