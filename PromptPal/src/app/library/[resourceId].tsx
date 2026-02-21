import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../../convex/_generated/api.js';
import { renderResourceContent } from '@/components/ui/ResourceModal';
import { Resource } from '@/components/ui/ResourceUtils';

export default function ResourceDetailScreen() {
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const resource = useQuery(
    api.queries.getLearningResourceById,
    isSignedIn && user?.id && resourceId
      ? {
          id: resourceId,
          appId: 'prompt-pal',
        }
      : 'skip'
  );

  if (!isLoaded || (isSignedIn && resource === undefined)) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-onSurface mt-4 font-black">Loading resource...</Text>
      </SafeAreaView>
    );
  }

  if (!isSignedIn || !resource) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="book-outline" size={64} color="#6B7280" />
        <Text className="text-onSurface text-xl font-black mt-4 mb-2">Resource unavailable</Text>
        <Text className="text-onSurfaceVariant text-center">Sign in to view this resource.</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-black">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Fixed Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-surfaceVariant/50 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={24} color="#6B7280" />
          </Pressable>
          <Text className="flex-1 text-center text-onSurface text-lg font-black uppercase tracking-[3px]">Resource</Text>
          <View className="w-10 h-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-6 pt-4">
          <Text className="text-onSurface text-3xl font-black mb-4">{resource.title}</Text>

          <Text className="text-onSurfaceVariant text-base mb-8 leading-6 italic">
            {resource.description}
          </Text>
        </View>

        <View className="px-6">
          {renderResourceContent(resource)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
