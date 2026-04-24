import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatCapsule } from '@/features/new-ui/components/StatCapsule';
import { FeaturedCourseCard } from '@/features/new-ui/components/FeaturedCourseCard';
import { QuestPath } from '@/features/new-ui/components/QuestPath';
import { XpIcon, StreakIcon } from '@/features/new-ui/components/CustomIcons';
import { useUserProgressStore } from '@/features/user/store';
import { useRouter } from 'expo-router';

export default function QuestScreen() {
  const router = useRouter();
  const { currentStreak, xp, level, currentQuest } = useUserProgressStore();

  const handleStartQuest = () => {
    // Navigate to the new quest play screen
    router.push('/game/new-quest');
  };

  // Mock data for nodes based on the design
  const nodes = [
    { id: '1', status: 'completed' as const },
    { id: '2', status: 'special' as const },
    { id: '3', status: 'current' as const, label: 'START' },
    { id: '4', status: 'locked' as const },
    { id: '5', status: 'locked' as const },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />

          <View style={styles.statsContainer}>
            <StatCapsule
              icon={<StreakIcon width={16} height={20} />}
              value={currentStreak || 0}
              color="#FF9600"
            />
            <StatCapsule
              icon={<XpIcon width={16} height={20} />}
              value={`${xp || 0} XP`}
              color="#FF9600"
            />
            <StatCapsule
              icon={<Ionicons name="heart" size={20} color="#FF4B4B" />}
              value="5"
              color="#FF4B4B"
            />
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FeaturedCourseCard
          level={level || 1}
          track="Coding Track"
          title="Master the Identity Prompt"
          progress={70}
          onPress={handleStartQuest}
        />

        <QuestPath
          nodes={nodes}
          onNodePress={(nodeId) => {
            // Only navigate if it's the current "START" node (id: '3')
            if (nodeId === '3') {
              handleStartQuest();
            }
          }}
        />

        {/* Fill space at bottom for scrolling */}
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
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 10,
  },
});
