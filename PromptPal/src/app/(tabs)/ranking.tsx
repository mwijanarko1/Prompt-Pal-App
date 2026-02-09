import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { convexHttpClient } from '@/lib/convex-client';
import { api } from '../../../convex/_generated/api';

const { width } = Dimensions.get('window');

// TypeScript interfaces for friends system
interface LeaderboardUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  avatar?: string;
  totalXp: number;
  currentLevel: number;
  globalRank: number;
  currentStreak?: number;
  points?: number;
  rank?: number;
  isCurrentUser?: boolean;
}

interface FriendsLeaderboardResponse {
  leaderboard: LeaderboardUser[];
  currentUser: LeaderboardUser | null;
  totalFriends: number;
}

interface WinnerProps {
  user: LeaderboardUser;
  type: 'gold' | 'silver' | 'bronze';
}

const WinnerCard = memo(function WinnerCard({ user, type }: WinnerProps) {
  const isGold = type === 'gold';
  const size = isGold ? 120 : type === 'silver' ? 100 : 90;
  const color = isGold ? '#FFD700' : type === 'silver' ? '#C0C0C0' : '#CD7F32';
  const label = type.toUpperCase();
  const rank = user.globalRank || user.rank;

  return (
    <View className={`items-center ${isGold ? '-mt-8' : 'mt-4'}`} style={{ width: width * 0.3 }}>
      <View className="relative mb-2">
        {isGold && (
          <View className="absolute -top-6 self-center z-10">
            <Ionicons name="trophy" size={24} color={color} />
          </View>
        )}
        <View
          className="rounded-full overflow-hidden border-4"
          style={{
            width: size,
            height: size,
            borderColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 10,
          }}
        >
          <Image source={{ uri: user.avatarUrl || user.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
        <View
          className="absolute -bottom-2 self-center px-4 py-1.5 rounded-full border border-outline shadow-lg shadow-black/20"
          style={{ backgroundColor: color }}
        >
          <Text className="text-[8px] font-black text-black uppercase tracking-widest">{label}</Text>
        </View>
      </View>
      <Text className="text-onSurface text-base font-black">#{rank} {user.name}</Text>
      <Text className="text-primary text-[10px] font-black uppercase tracking-[2px] mt-1">{user.totalXp || user.points}</Text>
    </View>
  );
});

interface RankItemProps {
  user: LeaderboardUser;
  showFriendRank?: boolean;
}

const RankItem = memo(function RankItem({ user, showFriendRank }: RankItemProps) {
  const rank = showFriendRank && user.rank ? user.rank : user.globalRank;
  
  return (
    <Card className="mb-3 flex-row items-center p-5 rounded-[32px] border-0 bg-surfaceVariant/20">
      <Text className="text-onSurfaceVariant text-lg font-black w-10">{rank}</Text>
      <View className="w-12 h-12 rounded-full overflow-hidden mr-4 border border-outline/30">
        <Image source={{ uri: user.avatarUrl || user.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      </View>
      <View className="flex-1">
        <Text className="text-onSurface text-base font-black">{user.name}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-[2px]">
          Lv. {user.currentLevel}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-primary text-lg font-black">{user.totalXp}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">PTS</Text>
      </View>
    </Card>
  );
});

interface CurrentUserCardProps {
  currentUser: LeaderboardUser;
  showFriendRank?: boolean;
}

const CurrentUserCard = memo(function CurrentUserCard({ currentUser, showFriendRank }: CurrentUserCardProps) {
  const rank = showFriendRank && currentUser.rank 
    ? currentUser.rank 
    : currentUser.globalRank || currentUser.rank || 0;
  const rankLabel = showFriendRank ? 'FRIENDS RANK' : 'GLOBAL RANK';
  
  return (
    <View className="absolute bottom-10 left-6 right-6">
      <Card className="bg-secondary p-6 rounded-full flex-row items-center border-0 shadow-2xl shadow-secondary/50">
        <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
          <Text className="text-secondary font-black text-base">{rank}</Text>
        </View>
        <View className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-white/30">
          <Image source={{ uri: currentUser.avatarUrl || currentUser.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>
        <View className="flex-1">
          <Text className="text-white text-lg font-black">{currentUser.name}</Text>
          <Text className="text-white/70 text-[8px] font-black uppercase tracking-[2px]">{rankLabel}</Text>
        </View>
        <View className="items-end">
          <Text className="text-white text-xl font-black">{currentUser.totalXp || currentUser.points || 0}</Text>
          <Text className="text-white/70 text-[8px] font-black uppercase tracking-widest">POINTS</Text>
        </View>
      </Card>
    </View>
  );
});

export default function RankingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  
  // Global leaderboard state
  const [globalTopWinners, setGlobalTopWinners] = useState<LeaderboardUser[]>([]);
  const [globalRankList, setGlobalRankList] = useState<LeaderboardUser[]>([]);
  const [globalCurrentUser, setGlobalCurrentUser] = useState<LeaderboardUser | null>(null);
  
  // Friends leaderboard state
  const [friendsTopWinners, setFriendsTopWinners] = useState<LeaderboardUser[]>([]);
  const [friendsRankList, setFriendsRankList] = useState<LeaderboardUser[]>([]);
  const [friendsCurrentUser, setFriendsCurrentUser] = useState<LeaderboardUser | null>(null);
  const [totalFriends, setTotalFriends] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Derived state based on active tab
  const topWinners = activeTab === 'global' ? globalTopWinners : friendsTopWinners;
  const rankList = activeTab === 'global' ? globalRankList : friendsRankList;
  const currentUser = activeTab === 'global' ? globalCurrentUser : friendsCurrentUser;

  // Fetch global leaderboard data
  useEffect(() => {
    const fetchGlobalLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch global leaderboard data
        const leaderboardData = await convexHttpClient.query(api.queries.getLeaderboard, {
          limit: 50,
        });

        // Fetch user rank data
        let userRankData = null;
        if (user?.id) {
          const stats = await convexHttpClient.query(api.queries.getUserStatistics, {
            userId: user.id,
          });
          userRankData = {
            userId: user.id,
            clerkId: user.id,
            globalRank: stats.globalRank,
            name: user.fullName || 'User',
            avatar: user.imageUrl,
            totalXp: stats.totalXp,
            currentLevel: stats.currentLevel,
            isCurrentUser: true,
          };
        }

        // Split into top 3 and rest
        const top3 = leaderboardData.leaderboard.slice(0, 3);
        const rest = leaderboardData.leaderboard.slice(3);

        setGlobalTopWinners(top3);
        setGlobalRankList(rest);
        setGlobalCurrentUser(userRankData);

        // If user is in top 3, replace their entry
        if (userRankData && userRankData.globalRank <= 3) {
          const userIndex = top3.findIndex((u: any) => u.globalRank === userRankData.globalRank);
          if (userIndex >= 0) {
            const updatedTop3 = [...top3];
            updatedTop3[userIndex] = userRankData;
            setGlobalTopWinners(updatedTop3);
          }
        }

      } catch (err) {
        console.error('Failed to fetch global leaderboard data:', err);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchGlobalLeaderboard();
    }
  }, [isLoaded, isSignedIn, user?.id, user?.fullName, user?.imageUrl]);

  // Fetch friends leaderboard data
  useEffect(() => {
    const fetchFriendsLeaderboard = async () => {
      try {
        if (activeTab !== 'friends') return;
        
        setLoading(true);
        setError(null);

        const friendsData: FriendsLeaderboardResponse = await convexHttpClient.query(api.queries.getFriendsLeaderboard, {
          limit: 50,
        });

        setTotalFriends(friendsData.totalFriends);

        // Split into top 3 and rest
        const top3 = friendsData.leaderboard.slice(0, 3);
        const rest = friendsData.leaderboard.slice(3);

        // Add rank property to each friend
        const rankedTop3 = top3.map((friend, index) => ({...friend, rank: index + 1}));
        const rankedRest = rest.map((friend, index) => ({...friend, rank: index + 4}));

        setFriendsTopWinners(rankedTop3);
        setFriendsRankList(rankedRest);
        setFriendsCurrentUser(friendsData.currentUser);

      } catch (err) {
        console.error('Failed to fetch friends leaderboard data:', err);
        setError('Failed to load friends leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn && activeTab === 'friends') {
      fetchFriendsLeaderboard();
    }
  }, [isLoaded, isSignedIn, activeTab]);

  const handleRetry = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (activeTab === 'global') {
        // Retry fetching global data
        const leaderboardData = await convexHttpClient.query(api.queries.getLeaderboard, {
          limit: 50,
        });

        let userRankData = null;
        if (user?.id) {
          const stats = await convexHttpClient.query(api.queries.getUserStatistics, {
            userId: user.id,
          });
          userRankData = {
            userId: user.id,
            clerkId: user.id,
            globalRank: stats.globalRank,
            name: user.fullName || 'User',
            avatar: user.imageUrl,
            totalXp: stats.totalXp,
            currentLevel: stats.currentLevel,
            isCurrentUser: true,
          };
        }

        const top3 = leaderboardData.leaderboard.slice(0, 3);
        const rest = leaderboardData.leaderboard.slice(3);
        setGlobalTopWinners(top3);
        setGlobalRankList(rest);
        setGlobalCurrentUser(userRankData);
      } else {
        // Retry fetching friends data
        const friendsData: FriendsLeaderboardResponse = await convexHttpClient.query(api.queries.getFriendsLeaderboard, {
          limit: 50,
        });

        setTotalFriends(friendsData.totalFriends);

        const top3 = friendsData.leaderboard.slice(0, 3);
        const rest = friendsData.leaderboard.slice(3);

        const rankedTop3 = top3.map((friend, index) => ({...friend, rank: index + 1}));
        const rankedRest = rest.map((friend, index) => ({...friend, rank: index + 4}));

        setFriendsTopWinners(rankedTop3);
        setFriendsRankList(rankedRest);
        setFriendsCurrentUser(friendsData.currentUser);
      }
    } catch (err) {
      console.error('Failed to retry fetching leaderboard:', err);
      setError('Failed to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user?.id, user?.fullName, user?.imageUrl]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handleSharePress = useCallback(() => {
    // Handle share action
  }, []);

  const handleTabChange = useCallback((tab: 'global' | 'friends') => {
    setActiveTab(tab);
  }, []);

  const renderRankItem = useCallback(({ item }: { item: LeaderboardUser }) => (
    <RankItem user={item} showFriendRank={activeTab === 'friends'} />
  ), [activeTab]);

  // Friends empty state component
  const FriendsEmptyState = memo(function FriendsEmptyState() {
    return (
      <View className="items-center py-16 px-8">
        <View className="w-24 h-24 rounded-full bg-surfaceVariant/30 items-center justify-center mb-6">
          <Ionicons name="people-outline" size={48} color="#6B7280" />
        </View>
        <Text className="text-onSurface text-xl font-black mb-2">No Friends Yet</Text>
        <Text className="text-onSurfaceVariant text-center mb-8 leading-6">
          Connect with friends to see their rankings and compete together!
        </Text>
        <Pressable
          className="bg-primary px-8 py-4 rounded-full flex-row items-center"
          onPress={() => {/* TODO: Navigate to add friends screen */}}
        >
          <Ionicons name="person-add" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text className="text-white font-black text-sm uppercase tracking-wider">Add Friends</Text>
        </Pressable>
      </View>
    );
  });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="text-onSurface mt-4">Loading leaderboard...</Text>
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
          className="bg-primary px-6 py-3 rounded-full"
          onPress={handleRetry}
        >
          <Text className="text-white font-bold">Try Again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row justify-between items-center">
        <View className="flex-1" />
        <Text className="text-onSurface text-xl font-black uppercase tracking-[2px]">Leaderboard</Text>
        <View className="flex-1 items-end">
          <Pressable 
            className="w-10 h-10 items-center justify-center"
            onPress={handleSharePress}
          >
            <Ionicons name="share-social-outline" size={20} color="#4151FF" />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-6 mb-8">
        <View className="flex-row bg-surfaceVariant/30 p-1.5 rounded-full border border-outline/10">
          <Pressable
            onPress={() => handleTabChange('global')}
            className={`flex-1 py-4 rounded-full items-center ${activeTab === 'global' ? 'bg-surface shadow-lg' : ''}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'global' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Global</Text>
          </Pressable>
          <Pressable
            onPress={() => handleTabChange('friends')}
            className={`flex-1 py-4 rounded-full items-center ${activeTab === 'friends' ? 'bg-surface shadow-lg' : ''}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'friends' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Friends</Text>
          </Pressable>
        </View>
      </View>

      <FlashList
        data={rankList}
        renderItem={renderRankItem}
        keyExtractor={(item) => item.userId}
        estimatedItemSize={88}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Top 3 Winners - Only show if there are enough winners */}
            {topWinners.length >= 3 && (
              <View className="flex-row justify-center items-end px-4 mb-14 pt-8">
                <WinnerCard user={topWinners[1]} type="silver" />
                <WinnerCard user={topWinners[0]} type="gold" />
                <WinnerCard user={topWinners[2]} type="bronze" />
              </View>
            )}

            {/* Section title */}
            <View className="px-6">
              <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-[3px] mb-6">
                {activeTab === 'global' ? 'World Rankings' : 'Friends Rankings'}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          activeTab === 'friends' ? (
            <FriendsEmptyState />
          ) : (
            <View className="items-center py-12">
              <Ionicons name="trophy-outline" size={64} color="#6B7280" />
              <Text className="text-onSurfaceVariant text-lg font-bold mt-4">No rankings available</Text>
              <Text className="text-onSurfaceVariant text-center mt-2">
                Complete some levels to see rankings!
              </Text>
              {currentUser && (
                <View className="mt-8 w-full px-6">
                  <Card className="bg-secondary p-6 rounded-full flex-row items-center border-0 shadow-2xl shadow-secondary/50">
                    <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
                      <Text className="text-secondary font-black text-base">{currentUser.globalRank || currentUser.rank || 0}</Text>
                    </View>
                    <View className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-white/30">
                      <Image source={{ uri: currentUser.avatarUrl || currentUser.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white text-lg font-black">{currentUser.name}</Text>
                      <Text className="text-white/70 text-[8px] font-black uppercase tracking-[2px]">GLOBAL RANK</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white text-xl font-black">{currentUser.totalXp || currentUser.points || 0}</Text>
                      <Text className="text-white/70 text-[8px] font-black uppercase tracking-widest">POINTS</Text>
                    </View>
                  </Card>
                </View>
              )}
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 200 }}
      />

      {/* Current User Fixed Footer - Only show if not empty */}
      {rankList.length > 0 && currentUser && <CurrentUserCard currentUser={currentUser} showFriendRank={activeTab === 'friends'} />}
    </SafeAreaView>
  );
}
