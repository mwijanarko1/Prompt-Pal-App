import React, { useCallback, memo, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';

import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { useUsage } from '@/lib/usage';
import { useUserProgressStore } from '@/features/user/store';
import { api } from '../../../convex/_generated/api.js';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Circular progress component for usage quota
interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  percentage?: number;
  label?: string;
  subLabel?: string;
  color?: string;
  isDark?: boolean;
}

const CircularProgress = memo(function CircularProgress({
  size = 100,
  strokeWidth = 8,
  percentage = 0,
  label = "",
  subLabel = "",
  color = "#FF6B00",
  isDark = true
}: CircularProgressProps) {
  // Guard against invalid percentage
  const safePercentage = isNaN(percentage) || !isFinite(percentage) ? 0 : Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
  const bgStroke = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgStroke}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <View style={{ position: 'absolute' }}>
          <Text className="text-onSurface text-xl font-black">{Math.round(percentage)}%</Text>
        </View>
      </View>
      <Text className="text-onSurface font-bold mt-3 text-sm">{label}</Text>
      <Text className="text-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest">{subLabel}</Text>
    </View>
  );
});

interface AchievementBadgeProps {
  icon: string;
  label: string;
  color: string;
  isLocked?: boolean;
}

const AchievementBadge = memo(function AchievementBadge({ icon, label, color, isLocked = false }: AchievementBadgeProps) {
  return (
    <View className="items-center mr-6">
      <View
        className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${isLocked ? 'bg-surfaceVariant/10' : ''}`}
        style={{
          borderWidth: 1,
          borderColor: isLocked ? 'rgba(255,255,255,0.1)' : color,
          backgroundColor: isLocked ? 'transparent' : `${color}15`
        }}
      >
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text
        className={`text-[8px] font-black uppercase tracking-widest text-center ${isLocked ? 'text-gray-600' : 'text-onSurface'}`}
        numberOfLines={1}
        style={{ width: 64 }}
      >
        {label}
      </Text>
    </View>
  );
});

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  color: string;
  isSecondary?: boolean;
}

const StatCard = memo(function StatCard({ label, value, trend, color, isSecondary = false }: StatCardProps) {
  return (
    <View
      className="flex-1 rounded-[30px] p-6 border border-white/5"
      style={{ backgroundColor: isSecondary ? 'rgba(65, 81, 255, 0.05)' : 'rgba(255, 107, 0, 0.05)' }}
    >
      <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">{label}</Text>
      <Text className="text-onSurface text-4xl font-black mb-3">{value}</Text>
      <View className="flex-row items-center">
        <Ionicons
          name={isSecondary ? "star" : "trending-up"}
          size={12}
          color={color}
        />
        <Text className="text-xs font-bold ml-1" style={{ color }}>{trend}</Text>
      </View>
    </View>
  );
});

export default function ProfileScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { level } = useUserProgressStore();

  // Convex Queries
  const achievements = useQuery(api.queries.getUserAchievements, user?.id ? { userId: user.id } : "skip");
  const userResults = useQuery(api.queries.getUserResults, user?.id ? { userId: user.id, appId: "prompt-pal" } : "skip");
  const usage = useUsage();

  const isLoading = achievements === undefined || userResults === undefined || usage === null;

  const totalPrompts = userResults?.taskResults?.length || 0;
  const avgAccuracy = useMemo(() => {
    if (!userResults?.taskResults?.length) return "0";
    const sum = userResults.taskResults.reduce((acc, curr) => acc + (curr.score || 0), 0);
    return (sum / userResults.taskResults.length).toFixed(1);
  }, [userResults]);

  // Usage progress calculations
  const textUsagePercent = usage ? (usage.used.textCalls / usage.limits.textCalls) * 100 : 0;
  const imageUsagePercent = usage ? (usage.used.imageCalls / usage.limits.imageCalls) * 100 : 0;


  const planName = usage?.tier === 'pro' ? 'Premium Pro' : 'Explorer Free';
  const tierTitle = usage?.tier === 'pro' ? 'PROMPT MASTER' : 'PROMPT NOVICE';

  const renderAchievementItem = useCallback(({ item }: { item: any }) => (
    <AchievementBadge
      icon={item.icon}
      label={item.title}
      color="#FF6B00"
      isLocked={false}
    />
  ), []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FF6B00" size="large" />
        <Text className="text-onSurface mt-4 font-black">Scanning your trajectory…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-6 pt-14 mb-6">
        <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant/50">
          <Ionicons name="settings-sharp" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
        </Pressable>
        <Text className="text-onSurface text-lg font-black uppercase tracking-[3px]">Profile</Text>
        <Pressable className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant/50">
          <Ionicons name="notifications" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
        </Pressable>
      </View>

      <View className="items-center px-6">
        {/* Avatar Section */}
        <View className="mb-6 relative">
          <View className="w-32 h-32 rounded-full border-4 border-primary shadow-glow items-center justify-center p-1">
            <View className="w-full h-full rounded-full overflow-hidden bg-surfaceVariant">
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Ionicons name="person" size={60} color="#9CA3AF" />
                </View>
              )}
            </View>
          </View>
          <View className="absolute bottom-0 right-0 bg-primary px-3 py-1 rounded-full border-2 border-background">
            <Text className="text-white text-xs font-black">Lv. {level}</Text>
          </View>
        </View>

        {/* User Info */}
        <Text className="text-onSurface text-3xl font-black mb-1">{user?.fullName || 'Architect'}</Text>
        <View className="flex-row items-center mb-1">
          <Ionicons name="checkmark-circle" size={16} color="#FF6B00" />
          <Text className="text-primary text-[10px] font-black uppercase tracking-widest ml-1">
            {tierTitle}
          </Text>
        </View>
        <Text className="text-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest opacity-60">
          Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </Text>

        {/* Premium Card - Hidden for free plan */}

        {/* Usage Quota Section */}
        <View className="w-full mb-10 mt-10">
          <Text className="text-onSurface text-2xl font-black mb-8 px-2">Usage Quota</Text>
          <View className="flex-row justify-center w-full">
            <CircularProgress
              size={width * 0.28}
              percentage={textUsagePercent}
              label="Text"
              subLabel={`${usage?.used.textCalls || 0}/${usage?.limits.textCalls || 0}`}
              color="#FF6B00"
              isDark={isDark}
            />
            {/* Image quota hidden - will be implemented once image generation module is ready */}
          </View>
        </View>



        {/* Achievements Section */}
        <View className="w-full mb-10">
          <View className="flex-row justify-between items-end mb-8 px-2">
            <Text className="text-onSurface text-2xl font-black">Achievements</Text>
            <Pressable>
              <Text className="text-primary text-[10px] font-black uppercase tracking-widest">View All</Text>
            </Pressable>
          </View>

          {achievements && achievements.length > 0 ? (
            <FlashList
              data={achievements}
              renderItem={renderAchievementItem}
              keyExtractor={(item) => item.id}
              estimatedItemSize={96}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
            />
          ) : (
            <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">No achievements yet</Text>
          )}
        </View>

        {/* Images Gallery Section - Hidden until image generation module is implemented */}

        {/* Statistics Section */}
        <View className="w-full mb-32">
          <Text className="text-onSurface text-2xl font-black mb-8 px-2">Statistics</Text>
          <View className="flex-row gap-4">
            <StatCard
              label="Total Prompts"
              value={totalPrompts.toLocaleString()}
              trend="Global Usage"
              color="#FF6B00"
            />
            <StatCard
              label="Avg. Accuracy"
              value={`${avgAccuracy}%`}
              trend="Performance"
              color="#4151FF"
              isSecondary
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

