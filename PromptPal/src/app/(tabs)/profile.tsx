import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@clerk/clerk-expo';
import { UsageClient, UsageStats } from '@/lib/usage';
import { useUserProgressStore } from '@/features/user/store';
import { useAchievementsStore } from '@/features/achievements/store';
import { getSharedClient, UserResultsResponse } from '@/lib/unified-api';
import { theme } from '@/lib/theme';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Circular progress component for usage quota
const CircularProgress = ({
  size = 100,
  strokeWidth = 8,
  percentage = 0,
  label = "",
  subLabel = "",
  color = "#FF6B00"
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255,255,255,0.1)"
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
          <Text className="text-white text-xl font-black">{Math.round(percentage)}%</Text>
        </View>
      </View>
      <Text className="text-white font-bold mt-3 text-sm">{label}</Text>
      <Text className="text-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest">{subLabel}</Text>
    </View>
  );
};

export default function ProfileScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { level, xp, learningModules } = useUserProgressStore();
  const { achievements } = useAchievementsStore();

  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [userResults, setUserResults] = useState<UserResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      const [usageData, resultsData] = await Promise.all([
        UsageClient.getUsage(),
        user?.id ? getSharedClient().getUserResults(user.id) : Promise.resolve(null)
      ]);

      // Debug logging
      console.log('[Profile] Usage data received:', usageData);
      console.log('[Profile] Image calls: used/limit =', usageData?.used?.imageCalls, '/', usageData?.limits?.imageCalls);

      setUsage(usageData);
      setUserResults(resultsData);
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FF6B00" size="large" />
        <Text className="text-onSurface mt-4 font-black">Scanning your trajectory…</Text>
      </View>
    );
  }

  // Get progress for circles from learning modules
  const imageModule = learningModules.find(m => m.category.includes('Visual') || m.title.includes('Image'));
  const codeModule = learningModules.find(m => m.category.includes('Development') || m.title.includes('Code') || m.title.includes('Python'));
  const copyModule = learningModules.find(m => m.category.includes('Marketing') || m.title.includes('Copy') || m.title.includes('Writing'));

  const totalPrompts = userResults?.taskResults?.length || 0;
  const avgAccuracy = userResults?.taskResults?.length
    ? (userResults.taskResults.reduce((acc, curr) => acc + (curr.score || 0), 0) / userResults.taskResults.length).toFixed(1)
    : "0";

  const planName = usage?.tier === 'pro' ? 'Premium Pro' : 'Explorer Free';
  const tierTitle = usage?.tier === 'pro' ? 'PROMPT MASTER' : 'PROMPT NOVICE';

  return (
    <ScrollView
      className="flex-1 bg-background"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
      }
    >
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-6 pt-14 mb-6">
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant/20">
          <Ionicons name="settings-sharp" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black uppercase tracking-[3px]">Profile</Text>
        <TouchableOpacity className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant/20">
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="items-center px-6">
        {/* Avatar Section */}
        <View className="mb-6 relative">
          <View className="w-32 h-32 rounded-full border-4 border-primary shadow-glow items-center justify-center p-1">
            <View className="w-full h-full rounded-full overflow-hidden bg-surfaceVariant">
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} className="w-full h-full" />
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
        <Text className="text-white text-3xl font-black mb-1">{user?.fullName || 'Architect'}</Text>
        <View className="flex-row items-center mb-1">
          <Ionicons name="checkmark-circle" size={16} color="#FF6B00" />
          <Text className="text-primary text-[10px] font-black uppercase tracking-widest ml-1">
            {tierTitle}
          </Text>
        </View>
        <Text className="text-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest opacity-60">
          Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </Text>

        {/* Premium Card */}
        <View className="w-full mt-10 mb-10 overflow-hidden rounded-[40px] border border-white/10 bg-primary/10">
          <View className="p-8 flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mr-2">
                  <Ionicons name="star" size={12} color="white" />
                </View>
                <Text className="text-white text-xl font-black">{planName}</Text>
              </View>
              <Text className="text-onSurfaceVariant text-xs mb-6">
                Your plan renews on {usage?.periodEnd ? new Date(usage.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next Cycle'}
              </Text>
              <TouchableOpacity className="bg-primary px-6 py-4 rounded-full self-start shadow-xl shadow-primary/20">
                <Text className="text-white text-xs font-black uppercase tracking-widest">
                  {usage?.tier === 'pro' ? 'Manage Subscription' : 'Upgrade to Pro'}
                </Text>
              </TouchableOpacity>
            </View>
            <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center">
              <Ionicons name="sparkles" size={40} color="#FF6B00" />
            </View>
          </View>
        </View>

        {/* Usage Quota Section */}
        <View className="w-full mb-10">
          <Text className="text-white text-2xl font-black mb-8 px-2">Usage Quota</Text>
          <View className="flex-row justify-between">
            <CircularProgress
              size={90}
              percentage={usage ? (usage.used.imageCalls / usage.limits.imageCalls) * 100 : 0}
              label="Images"
              subLabel={`${usage?.used.imageCalls || 0}/${usage?.limits.imageCalls || 0}`}
              color="#FF6B00"
            />
            <CircularProgress
              size={90}
              percentage={codeModule?.progress || 0}
              label="Code"
              subLabel={`${codeModule?.progress || 0}%`}
              color="#4151FF"
            />
            <CircularProgress
              size={90}
              percentage={copyModule?.progress || 0}
              label="Copy"
              subLabel={`${copyModule?.progress || 0}%`}
              color="#FF6B00"
            />
          </View>
        </View>

        {/* Achievements Section */}
        <View className="w-full mb-10">
          <View className="flex-row justify-between items-end mb-8 px-2">
            <Text className="text-white text-2xl font-black">Achievements</Text>
            <TouchableOpacity>
              <Text className="text-primary text-[10px] font-black uppercase tracking-widest">View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                icon={achievement.icon}
                label={achievement.title}
                color={achievement.unlocked ? "#FF6B00" : "#374151"}
                isLocked={!achievement.unlocked}
              />
            ))}
            {achievements.length === 0 && (
              <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">No achievements yet</Text>
            )}
          </ScrollView>
        </View>

        {/* Images Gallery Section */}
        <View className="w-full mb-10">
          <View className="flex-row justify-between items-end mb-8 px-2">
            <Text className="text-white text-2xl font-black">My Images</Text>
            <TouchableOpacity>
              <Text className="text-primary text-[10px] font-black uppercase tracking-widest">View All</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-4">
            {/* Placeholder for user images - in a real app, these would come from user data */}
            <View className="w-20 h-20 rounded-[20px] bg-surfaceVariant/20 items-center justify-center border border-white/5">
              <Ionicons name="images" size={24} color="#9CA3AF" />
            </View>
            <View className="w-20 h-20 rounded-[20px] bg-surfaceVariant/20 items-center justify-center border border-white/5">
              <Ionicons name="add" size={24} color="#9CA3AF" />
            </View>
          </View>
        </View>

        {/* Statistics Section */}
        <View className="w-full mb-32">
          <Text className="text-white text-2xl font-black mb-8 px-2">Statistics</Text>
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

const AchievementBadge = ({ icon, label, color, isLocked = false }) => (
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
      className={`text-[8px] font-black uppercase tracking-widest text-center ${isLocked ? 'text-gray-600' : 'text-white'}`}
      numberOfLines={1}
      style={{ width: 64 }}
    >
      {label}
    </Text>
  </View>
);

const StatCard = ({ label, value, trend, color, isSecondary = false }) => (
  <View
    className="flex-1 rounded-[30px] p-6 border border-white/5"
    style={{ backgroundColor: isSecondary ? 'rgba(65, 81, 255, 0.05)' : 'rgba(255, 107, 0, 0.05)' }}
  >
    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">{label}</Text>
    <Text className="text-white text-4xl font-black mb-3">{value}</Text>
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
