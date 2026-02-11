import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';

interface CompletedQuest {
  id: string;
  questId: string;
  title: string;
  description: string;
  xpReward: number;
  questType: 'image' | 'code' | 'copywriting';
  completedAt?: number;
  score: number;
}

export default function QuestsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const completedQuests = useQuery(api.queries.getUserCompletedQuests, {
    appId: "prompt-pal"
  });

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Unknown date';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getQuestTypeIcon = (questType: string) => {
    switch (questType) {
      case 'code':
        return 'code-slash';
      case 'copywriting':
        return 'create';
      case 'image':
        return 'image';
      default:
        return 'trophy';
    }
  };

  const getQuestTypeColor = (questType: string) => {
    switch (questType) {
      case 'code':
        return '#4151FF';
      case 'copywriting':
        return '#F59E0B';
      case 'image':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  if (completedQuests === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-onSurfaceVariant mt-4">Loading quest history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-onSurface text-2xl font-black tracking-tight">
            Quest History
          </Text>
          <Text className="text-onSurfaceVariant text-sm mt-1">
            Your completed daily quests and rewards
          </Text>
        </View>

        {/* Quest List */}
        <View className="px-6 pb-20">
          {completedQuests.length === 0 ? (
            /* Empty State */
            <View className="items-center justify-center py-16">
              <View className="w-20 h-20 bg-surfaceVariant rounded-full items-center justify-center mb-4">
                <Ionicons name="trophy-outline" size={32} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </View>
              <Text className="text-onSurface text-xl font-black text-center mb-2">
                No Completed Quests Yet
              </Text>
              <Text className="text-onSurfaceVariant text-sm text-center max-w-xs">
                Complete your daily quests to see your achievements here. Keep learning and earning XP!
              </Text>
            </View>
          ) : (
            /* Quest Items */
            <View className="space-y-4">
              {completedQuests.map((quest: CompletedQuest) => (
                <View
                  key={quest.id}
                  className="bg-surface border border-outline/30 rounded-[20px] p-6"
                >
                  {/* Quest Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: getQuestTypeColor(quest.questType) + '20' }}
                      >
                        <Ionicons
                          name={getQuestTypeIcon(quest.questType)}
                          size={16}
                          color={getQuestTypeColor(quest.questType)}
                        />
                      </View>
                      <Text className="text-onSurface font-black text-sm uppercase tracking-widest">
                        {quest.questType}
                      </Text>
                    </View>
                    <View className="bg-success/20 px-3 py-1 rounded-full">
                      <Text className="text-success text-xs font-black uppercase tracking-widest">
                        Completed
                      </Text>
                    </View>
                  </View>

                  {/* Quest Title */}
                  <Text className="text-onSurface text-lg font-black mb-2">
                    {quest.title}
                  </Text>

                  {/* Quest Description */}
                  <Text className="text-onSurfaceVariant text-sm mb-4 leading-5">
                    {quest.description}
                  </Text>

                  {/* Quest Footer */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="star" size={16} color="#F59E0B" />
                      <Text className="text-onSurface font-black text-base ml-1">
                        +{quest.xpReward} XP
                      </Text>
                    </View>
                    <Text className="text-onSurfaceVariant text-xs font-medium">
                      {formatDate(quest.completedAt)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}