import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useUser, useAuth, useClerk } from '@clerk/clerk-expo';
import { useUserProgressStore } from '@/features/user/store';
import { StatCapsule } from '@/features/new-ui/components/StatCapsule';
import { XpIcon, StreakIcon } from '@/features/new-ui/components/CustomIcons';
import { convexHttpClient, refreshAuth, clearAuth } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api";
import { useRouter } from 'expo-router';
import Svg, { Circle } from "react-native-svg";

const { width } = Dimensions.get('window');

const CircularProgress = ({ size = 80, strokeWidth = 6, percentage = 0, color = "#58CC02" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#F0F0F0" strokeWidth={strokeWidth} fill="none" />
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
      <View style={styles.percentageContainer}>
        <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const { level, xp, currentStreak } = useUserProgressStore();

  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        setLoading(true);
        const [achievementsData, usageData] = await Promise.all([
          convexHttpClient.query(api.queries.getUserAchievements, {}),
          convexHttpClient.query(api.queries.getUserUsage, { appId: "prompt-pal" }),
        ]);
        setAchievements(achievementsData || []);
        setUsage(usageData);
      } catch (error) {
        console.error("Failed to load profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [isLoaded, isSignedIn]);

  const handleSignOut = async () => {
    try {
      await signOut();
      clearAuth();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  const textUsagePercent = usage && usage.limits.textCalls > 0
    ? (usage.used.textCalls / usage.limits.textCalls) * 100
    : 0;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color="#FF4B4B" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarBorder}>
              <Image source={{ uri: user?.imageUrl }} style={styles.avatar} />
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{level}</Text>
            </View>
          </View>

          <Text style={styles.userName}>{user?.fullName || 'Architect'}</Text>
          <Text style={styles.userEmail}>{user?.primaryEmailAddress?.emailAddress}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <StreakIcon width={24} height={28} />
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Days</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <XpIcon width={24} height={28} />
              <Text style={styles.statValue}>{xp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.statValue}>{achievements.length}</Text>
              <Text style={styles.statLabel}>Awards</Text>
            </View>
          </View>
        </View>

        {/* Usage Quota */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Quota</Text>
          <View style={styles.quotaCard}>
            <CircularProgress percentage={textUsagePercent} />
            <View style={styles.quotaInfo}>
              <Text style={styles.quotaTitle}>Text Prompts</Text>
              <Text style={styles.quotaSubtitle}>
                {usage?.used.textCalls} / {usage?.limits.textCalls} used today
              </Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${textUsagePercent}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <TouchableOpacity><Text style={styles.viewAll}>View All</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementScroll}>
            {achievements.length > 0 ? achievements.map((item, index) => (
              <View key={index} style={styles.badgeItem}>
                <View style={styles.badgeIconContainer}>
                   <Text style={{ fontSize: 30 }}>{item.icon || '✨'}</Text>
                </View>
                <Text style={styles.badgeName}>{item.title}</Text>
              </View>
            )) : (
              <Text style={styles.emptyText}>No achievements yet. Keep learning!</Text>
            )}
          </ScrollView>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    textTransform: 'uppercase',
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderBottomWidth: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#58CC02',
    padding: 4,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#58CC02',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#3C3C3C',
    marginBottom: 4,
    fontFamily: 'DIN Round Pro',
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '700',
    marginBottom: 24,
    fontFamily: 'DIN Round Pro',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EBEBEB',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3C3C3C',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#EBEBEB',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '900',
    color: '#58CC02',
    textTransform: 'uppercase',
  },
  quotaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    borderBottomWidth: 4,
  },
  quotaInfo: {
    flex: 1,
    marginLeft: 20,
  },
  quotaTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#3C3C3C',
    marginBottom: 4,
  },
  quotaSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '700',
    marginBottom: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 4,
  },
  percentageContainer: {
    position: 'absolute',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3C3C3C',
  },
  achievementScroll: {
    paddingLeft: 4,
  },
  badgeItem: {
    alignItems: 'center',
    marginRight: 24,
    width: 80,
  },
  badgeIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#EBEBEB',
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '900',
    color: '#3C3C3C',
    textAlign: 'center',
    fontFamily: 'DIN Round Pro',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});
