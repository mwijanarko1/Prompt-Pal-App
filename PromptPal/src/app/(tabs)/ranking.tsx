import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { apiClient, LeaderboardEntry } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function RankingScreen() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'friends'>('global');
  const [topWinners, setTopWinners] = useState<LeaderboardUser[]>([]);
  const [rankList, setRankList] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leaderboard data from API
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch leaderboard and user rank data
        const [leaderboardData, userRankData] = await Promise.all([
          apiClient.getLeaderboard(50),
          apiClient.getUserRank(),
        ]);

        // Split into top 3 and the rest
        const top3 = leaderboardData.leaderboard.slice(0, 3);
        const rest = leaderboardData.leaderboard.slice(3);

        setTopWinners(top3);
        setRankList(rest);
        setCurrentUser(userRankData);

        // If user is in top 3, replace their entry
        if (userRankData.rank <= 3) {
          const userIndex = top3.findIndex(u => u.rank === userRankData.rank);
          if (userIndex >= 0) {
            const updatedTop3 = [...top3];
            updatedTop3[userIndex] = userRankData;
            setTopWinners(updatedTop3);
          }
        }

      } catch (err) {
        console.error('Failed to fetch leaderboard data:', err);
        setError('Failed to load leaderboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn) {
      fetchLeaderboardData();
    }
  }, [isLoaded, isSignedIn]);

  const renderWinner = (user: LeaderboardUser, type: 'gold' | 'silver' | 'bronze') => {
    const isGold = type === 'gold';
    const size = isGold ? 120 : type === 'silver' ? 100 : 90;
    const color = isGold ? '#FFD700' : type === 'silver' ? '#C0C0C0' : '#CD7F32';
    const label = type.toUpperCase();

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
            <Image source={{ uri: user.avatar }} className="w-full h-full" />
          </View>
          <View 
            className="absolute -bottom-2 self-center px-4 py-1.5 rounded-full border border-outline shadow-lg shadow-black/20"
            style={{ backgroundColor: color }}
          >
            <Text className="text-[8px] font-black text-black uppercase tracking-widest">{label}</Text>
          </View>
        </View>
        <Text className="text-onSurface text-base font-black">#{user.rank} {user.name}</Text>
        <Text className="text-primary text-[10px] font-black uppercase tracking-[2px] mt-1">{user.points}</Text>
      </View>
    );
  };

  const renderRankItem = (user: LeaderboardUser) => (
    <Card key={user.id} className="mb-3 flex-row items-center p-5 rounded-[32px] border-0 bg-surfaceVariant/20">
      <Text className="text-onSurfaceVariant text-lg font-black w-10">{user.rank}</Text>
      <View className="w-12 h-12 rounded-full overflow-hidden mr-4 border border-outline/30">
        <Image source={{ uri: user.avatar }} className="w-full h-full" />
      </View>
      <View className="flex-1">
        <Text className="text-onSurface text-base font-black">{user.name}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-[2px]">
          Lv. {user.level} {user.title}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-primary text-lg font-black">{user.points}</Text>
        <Text className="text-onSurfaceVariant text-[8px] font-black uppercase tracking-widest">PTS</Text>
      </View>
    </Card>
  );

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
        <TouchableOpacity
          className="bg-primary px-6 py-3 rounded-full"
          onPress={() => {
            setError(null);
            setLoading(true);
            // Retry fetching data
            Promise.all([
              apiClient.getLeaderboard(50),
              apiClient.getUserRank(),
            ])
              .then(([leaderboardData, userRankData]) => {
                const top3 = leaderboardData.leaderboard.slice(0, 3);
                const rest = leaderboardData.leaderboard.slice(3);
                setTopWinners(top3);
                setRankList(rest);
                setCurrentUser(userRankData);
              })
              .catch(err => {
                console.error('Failed to retry fetching leaderboard:', err);
                setError('Failed to load leaderboard. Please try again.');
              })
              .finally(() => setLoading(false));
          }}
        >
          <Text className="text-white font-bold">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-2 pb-4 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant/50"
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-onSurface text-xl font-black uppercase tracking-[2px]">Leaderboard</Text>
        <TouchableOpacity className="w-10 h-10 items-center justify-center">
          <Ionicons name="share-social-outline" size={20} color="#4151FF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="px-6 mb-8">
        <View className="flex-row bg-surfaceVariant/30 p-1.5 rounded-full border border-outline/10">
          <TouchableOpacity
            onPress={() => setActiveTab('global')}
            className={`flex-1 py-4 rounded-full items-center ${activeTab === 'global' ? 'bg-surface shadow-lg' : ''}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'global' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Global</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('friends')}
            className={`flex-1 py-4 rounded-full items-center ${activeTab === 'friends' ? 'bg-surface shadow-lg' : ''}`}
          >
            <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'friends' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Friends</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Top 3 Winners */}
        {topWinners.length >= 3 && (
          <View className="flex-row justify-center items-end px-4 mb-14 pt-8">
            {renderWinner(topWinners[1], 'silver')}
            {renderWinner(topWinners[0], 'gold')}
            {renderWinner(topWinners[2], 'bronze')}
          </View>
        )}

        {/* List View */}
        <View className="px-6 pb-32">
          <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-[3px] mb-6">World Rankings</Text>
          {rankList.length === 0 ? (
            <View className="items-center py-12">
              <Ionicons name="trophy-outline" size={64} color="#6B7280" />
              <Text className="text-onSurfaceVariant text-lg font-bold mt-4">No rankings available</Text>
              <Text className="text-onSurfaceVariant text-center mt-2">
                Complete some levels to see rankings!
              </Text>
            </View>
          ) : (
            rankList.map(renderRankItem)
          )}
        </View>
      </ScrollView>

      {/* Current User Fixed Footer */}
      {currentUser && (
        <View className="absolute bottom-10 left-6 right-6">
          <Card className="bg-secondary p-6 rounded-full flex-row items-center border-0 shadow-2xl shadow-secondary/50">
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
              <Text className="text-secondary font-black text-base">{currentUser.rank}</Text>
            </View>
            <View className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-white/30">
              <Image source={{ uri: currentUser.avatar }} className="w-full h-full" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-black">{currentUser.name}</Text>
              <Text className="text-white/70 text-[8px] font-black uppercase tracking-[2px]">GLOBAL RANK</Text>
            </View>
            <View className="items-end">
              <Text className="text-white text-xl font-black">{currentUser.points}</Text>
              <Text className="text-white/70 text-[8px] font-black uppercase tracking-widest">POINTS</Text>
            </View>
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}
