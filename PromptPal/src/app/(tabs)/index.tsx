import { useUser, useAuth } from '@clerk/clerk-expo'
import { Link } from 'expo-router'
import { Text, View, ScrollView, Pressable, Alert, ActivityIndicator, useColorScheme } from 'react-native'
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, memo } from 'react';
import { FlashList } from "@shopify/flash-list";
import { getUnlockedLevels } from '@/features/levels/data';
import { UsageDisplay } from '@/components/UsageDisplay';
import { useUsage, UsageStats } from '@/lib/usage';
import { useGameStore } from '@/features/game/store';
import { useUserProgressStore, getOverallProgress } from '@/features/user/store';
import { logger } from '@/lib/logger';
import { logDailyQuestStart } from '@/lib/analytics';
import { SignOutButton } from '@/components/SignOutButton';
import { Button, Card, Modal } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

// Local type definitions for UI components
export interface LearningModule {
  id: string;
  category: string;
  title: string;
  level: string;
  topic: string;
  progress: number;
  icon: string;
  thumbnail?: any;
  accentColor: string;
  buttonText: string;
  type?: 'module' | 'course';
  format?: 'interactive' | 'video' | 'text';
  estimatedTime?: number;
  isLocked?: boolean;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  timeRemaining: number;
  completed: boolean;
  expiresAt: number;
  questType?: 'image' | 'code' | 'copywriting';
  type?: string;
}

// --- Sub-components ---

// Helper to map emoji icons to Ionicons names
const getIconName = (icon: string): any => {
  const mapping: Record<string, string> = {
    "🎨": "color-palette",
    "💻": "laptop",
    "✍️": "create",
    "🧠": "hardware-chip",
    "✨": "sparkles",
    "🔥": "flame",
    "🏆": "trophy",
    "📅": "calendar",
  };
  // If it's already a valid ionicon name or doesn't have a mapping, return as is
  return mapping[icon] || icon || "book";
};

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
}

const StatCard = memo(function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const onSurfaceVariant = isDark ? '#A1A1AA' : '#71717A';

  return (
    <View className="bg-surface/50 border border-outline/30 p-4 rounded-3xl flex-1 mx-1 items-center">
      <Text className="text-onSurface text-2xl font-black mb-1">{value}</Text>
      <View className="flex-row items-center">
        <Ionicons name={getIconName(icon)} size={14} color={onSurfaceVariant} />
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase ml-1 tracking-widest">{label}</Text>
      </View>
    </View>
  );
});

interface QuestCardProps {
  quest: DailyQuest;
  onQuestStart?: (quest: DailyQuest) => void;
}

const QuestCard = memo(function QuestCard({ quest, onQuestStart }: QuestCardProps) {
  const formatTimeRemaining = useCallback((hours: number) => {
    if (hours < 1) {
      return `${Math.floor(hours * 60)}m`;
    }
    return `${Math.floor(hours)}h`;
  }, []);

  const handlePress = useCallback(() => {
    onQuestStart?.(quest);
  }, [quest, onQuestStart]);

  return (
    <View className="bg-info p-6 rounded-[32px] mb-10 overflow-hidden shadow-lg shadow-info/30">
      <View className="flex-row justify-between items-center mb-6">
        <View className="bg-white/20 px-3 py-1.5 rounded-full">
          <Text className="text-white text-[10px] font-black uppercase tracking-[2px]">Daily Quest</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={16} color="black" />
          <Text className="text-white text-xs font-black ml-1.5 uppercase tracking-tighter">
            {formatTimeRemaining(quest.timeRemaining)} left
          </Text>
        </View>
      </View>

      <Text className="text-white text-2xl font-black mb-2">{quest.title}</Text>
      <Text className="text-white/80 text-sm mb-8 font-medium leading-5">{quest.description}</Text>

      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <View className="bg-white/20 rounded-full p-2 mr-2">
            <Ionicons name="star" size={14} color="black" />
          </View>
          <Text className="text-white font-black text-lg">+{quest.xpReward} XP</Text>
        </View>
        <Pressable className="bg-white px-8 py-4 rounded-full shadow-sm" onPress={handlePress}>
          <Text className="text-info font-black text-sm uppercase tracking-widest">Start Quest</Text>
        </Pressable>
      </View>
    </View>
  );
});

interface ModuleCardProps {
  id: string;
  title: string;
  category: string;
  level: string;
  topic: string;
  progress: number;
  icon: string;
  thumbnail?: any;
  accentColor: string;
  format?: 'interactive' | 'video' | 'text';
  buttonText?: string;
  isLocked?: boolean;
}

const ModuleCard = memo(function ModuleCard({
  id,
  title,
  category,
  level,
  topic,
  progress,
  icon,
  thumbnail,
  accentColor,
  format,
  buttonText = "Continue Learning",
  isLocked = false
}: ModuleCardProps) {
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (isLocked) return; // Don't navigate if locked
    const href = `/game/levels/${id}`;
    console.log('[DEBUG] ModuleCard navigating to:', href);
    router.push(href);
    router.push('/game/levels/coding-logic');
    router.push('/game/levels/copywriting');
  }, [id, router, isLocked]);

  return (
    <View className={`bg-surface border border-outline/30 rounded-[32px] mb-8 overflow-hidden shadow-sm ${isLocked ? 'opacity-60' : ''}`}>
      {/* Header Pattern Area */}
      <View className="h-44 bg-surfaceVariant relative justify-center items-center">
        {thumbnail ? (
          <Image source={thumbnail} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center opacity-20">
            <Ionicons name={getIconName(icon)} size={80} color="black" />
          </View>
        )}
        {isLocked && (
          <View className="absolute inset-0 bg-black/40 items-center justify-center">
            <View className="bg-gray-800 px-6 py-3 rounded-full">
              <Text className="text-white text-sm font-black uppercase tracking-widest">Coming Soon</Text>
            </View>
          </View>
        )}
        {format && !isLocked && (
          <View className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full">
            <Text className="text-white text-[8px] font-black uppercase tracking-widest">{format}</Text>
          </View>
        )}
      </View>

      <View className="p-6">
        <Text className={`text-[10px] font-black uppercase mb-2 tracking-[3px] ${isLocked ? 'text-gray-500' : accentColor.replace('bg-', 'text-')}`}>
          {category}
        </Text>
        <Text className={`text-2xl font-black mb-4 ${isLocked ? 'text-onSurfaceVariant' : 'text-onSurface'}`}>{title}</Text>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest">{level}: {topic}</Text>
          {!isLocked && (
            <Text className={`text-xs font-black ${accentColor.replace('bg-', 'text-')}`}>{progress}%</Text>
          )}
        </View>

        {/* Progress Bar - hidden for locked modules */}
        {!isLocked && (
          <View className="h-2 bg-surfaceVariant rounded-full mb-8 overflow-hidden">
            <View className={`h-full ${accentColor} rounded-full`} style={{ width: `${progress}%` }} />
          </View>
        )}

        <Pressable
          onPress={handlePress}
          disabled={isLocked}
          className={`py-4 rounded-2xl items-center flex-row justify-center border border-outline/10 ${isLocked ? 'bg-gray-700/30' : 'bg-surfaceVariant/50'}`}
        >
          {isLocked ? (
            <>
              <Ionicons name="lock-closed" size={16} color="#6B7280" style={{ marginRight: 8 }} />
              <Text className="text-gray-500 font-black text-sm uppercase tracking-widest">Coming Soon</Text>
            </>
          ) : (
            <>
              <Text className="text-primary font-black text-sm uppercase tracking-widest mr-2">{buttonText}</Text>
              {buttonText === "Continue Learning" && <Ionicons name="arrow-forward" size={18} color="#FF6B00" />}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
});


export default function HomeScreen() {
  const { user } = useUser()
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter();
  const usage = useUsage();
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const { unlockedLevels } = useGameStore();
  const { level, xp, currentStreak, learningModules, currentQuest, loadFromBackend } = useUserProgressStore();
  const overallProgress = getOverallProgress(xp);

  useEffect(() => {
    console.log('[DEBUG] HomeScreen useEffect triggered', { isLoaded, isSignedIn });
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/22f04838-2b12-4048-9371-93341d7db626', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'index.tsx:209', message: 'HomeScreen useEffect triggered', data: { isLoaded, isSignedIn }, timestamp: Date.now(), sessionId: 'debug-session' }) }).catch(() => { });
    // #endregion

    if (isLoaded && isSignedIn && user?.id) {
      loadFromBackend(user.id);
    }
  }, [isLoaded, isSignedIn, loadFromBackend, user?.id]);

  // Log learning modules data when it changes
  useEffect(() => {
    console.log('[DEBUG] Learning modules data updated', {
      count: learningModules?.length,
      modules: learningModules?.map(m => ({ id: m.id, title: m.title, buttonText: m.buttonText }))
    });
    // #region agent log
    fetch('http://127.0.0.1:7250/ingest/22f04838-2b12-4048-9371-93341d7db626', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'index.tsx:217', message: 'Learning modules data', data: { learningModulesCount: learningModules?.length, learningModules: learningModules?.map(m => ({ id: m.id, title: m.title, buttonText: m.buttonText })) }, timestamp: Date.now(), sessionId: 'debug-session' }) }).catch(() => { });
    // #endregion
  }, [learningModules]);

  const renderModuleItem = useCallback(({ item }: { item: LearningModule }) => (
    <ModuleCard {...item} />
  ), []);

  const handleNotificationsPress = useCallback(() => {
    Alert.alert('Notifications', 'No new notifications');
  }, []);

  const handleSettingsPress = useCallback(() => {
    setSettingsModalVisible(true);
  }, []);

  const handleQuestStart = useCallback((quest: DailyQuest) => {
    const questType = quest.questType ?? (quest as { type?: string }).type ?? 'unknown';
    logDailyQuestStart(quest.id, questType);
    if (questType === 'code') {
      router.push('/game/levels/coding-logic');
    } else if (questType === 'copywriting') {
      router.push('/game/levels/copywriting');
    }
    // Image quests: skip (not in MVP)
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Top Profile Header */}
        <View className="px-6 pt-4 pb-6 flex-row justify-between items-center">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/50 items-center justify-center overflow-hidden mr-3">
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={24} color="#FF6B00" />
              )}
            </View>
            <View>
              <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-[3px] mb-0.5">Good Morning</Text>
              <Text className="text-onSurface text-xl font-black">
                {user?.firstName || "Alex"} {user?.lastName || "Prompt"}
              </Text>
            </View>
          </View>
          <View className="flex-row">
            <Pressable
              className="w-10 h-10 rounded-full bg-surfaceVariant/50 items-center justify-center mr-2"
              onPress={handleNotificationsPress}
            >
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              <View className="absolute top-2.5 right-3 w-2 h-2 bg-error rounded-full border border-background" />
            </Pressable>
            <Pressable
              className="w-10 h-10 rounded-full bg-surfaceVariant/50 items-center justify-center"
              onPress={handleSettingsPress}
            >
              <Ionicons name="settings-outline" size={20} color="#6B7280" />
            </Pressable>
          </View>
        </View>

        {/* Stats Bar */}
        <View className="px-5 flex-row mb-8">
          <StatCard label="Level" value={level.toString()} icon="trophy-outline" color="#FF6B00" />
          <StatCard label="XP" value={xp.toLocaleString()} icon="flash-outline" color="#4151FF" />
          <StatCard label="Streak" value={currentStreak.toString()} icon="flame-outline" color="#F59E0B" />
        </View>

        {/* Overall Mastery */}
        <View className="px-6 mb-10">
          <View className="flex-row justify-between items-center mb-2.5">
            <Text className="text-onSurface text-[10px] font-black uppercase tracking-[2px]">Overall Mastery</Text>
            <Text className="text-onSurfaceVariant text-xs font-black">
              {overallProgress.current} / {overallProgress.total} XP
            </Text>
          </View>
          <View className="h-2 bg-surfaceVariant rounded-full overflow-hidden">
            <View className="h-full bg-info rounded-full" style={{ width: `${overallProgress.percentage}%` }} />
          </View>
        </View>

        {/* Daily Quest */}
        {currentQuest && (
          <View className="px-6">
            <QuestCard quest={currentQuest} onQuestStart={handleQuestStart} />
          </View>
        )}

        {/* Learning Modules Section */}
        <View className="px-6 pb-20">
          <View className="mb-6">
            <Text className="text-onSurface text-2xl font-black tracking-tight">Learning Modules</Text>
          </View>



          {/* Module Cards with FlashList */}
          {learningModules && learningModules.length > 0 && (
            <FlashList
              data={learningModules}
              renderItem={renderModuleItem}
              keyExtractor={(item) => item.id}
              estimatedItemSize={450}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        title="Settings"
        size="sm"
      >
        <View className="space-y-4">
          <View className="flex-row items-center p-4 bg-surfaceVariant/50 rounded-xl">
            <Ionicons name="person-circle-outline" size={24} color="#6B7280" />
            <View className="ml-3 flex-1">
              <Text className="text-onSurface font-semibold">{user?.firstName || "User"} {user?.lastName || ""}</Text>
              <Text className="text-onSurfaceVariant text-sm">{user?.primaryEmailAddress?.emailAddress}</Text>
            </View>
          </View>

          <View className="space-y-2">
            <Pressable className="flex-row items-center p-4 bg-surfaceVariant/50 rounded-xl">
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
              <Text className="text-onSurface ml-3 flex-1">Notifications</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>

            <Pressable className="flex-row items-center p-4 bg-surfaceVariant/50 rounded-xl">
              <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
              <Text className="text-onSurface ml-3 flex-1">Help & Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>

            <Pressable className="flex-row items-center p-4 bg-surfaceVariant/50 rounded-xl">
              <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
              <Text className="text-onSurface ml-3 flex-1">About</Text>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </Pressable>
          </View>

          <View className="pt-4 border-t border-outline/20">
            <SignOutButton />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
