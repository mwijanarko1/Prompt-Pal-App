import { useUserProgressStore } from '@/features/user/store';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StreakIcon, XpIcon } from './components/CustomIcons';
import { FeaturedCourseCard } from './components/FeaturedCourseCard';
import { QuestPath } from './components/QuestPath';
import { StatCapsule } from './components/StatCapsule';

import { useRouter } from 'expo-router';


export const NewHomeUIScreen = () => {
  const router = useRouter();
  const { currentStreak, xp, level, currentQuest } = useUserProgressStore();
  const [activeTab, setActiveTab] = useState('quests');

  const handleStartQuest = () => {
    // Navigate to the new quest play screen
    router.push('/game/new-quest');
  };

  // Mock data for nodes based on the image
  const nodes = [
    { id: '1', status: 'completed' as const },
    { id: '2', status: 'special' as const },
    { id: '3', status: 'current' as const, label: 'START' },
    { id: '4', status: 'locked' as const },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="menu" size={28} color="#3C3C3C" />
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <StatCapsule
              icon={<StreakIcon width={16} height={20} />}
              value={currentStreak || 12}
              color="#FF9600"
            />
            <StatCapsule
              icon={<XpIcon width={16} height={20} />}
              value={`${xp || 482} XP`}
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
          level={level || 12}
          track="Coding Track"
          title="Master the Identity Prompt"
          progress={70}
          onPress={handleStartQuest}
        />

        <QuestPath
          nodes={nodes}
          onNodePress={(nodeId) => {
            if (nodeId === '3') { // The "START" node
              handleStartQuest();
            }
          }}
        />

        {/* Fill space at bottom for scrolling */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('quests')}>
          <View style={[styles.navIconContainer, activeTab === 'quests' && styles.navIconActive]}>
            <Ionicons name="compass" size={26} color={activeTab === 'quests' ? '#FFFFFF' : '#8E8E93'} />
          </View>
          <Text style={[styles.navText, activeTab === 'quests' && styles.navTextActive]}>Quests</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('rank')}>
          <Ionicons name="bar-chart-outline" size={26} color="#8E8E93" />
          <Text style={styles.navText}>Rank</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('cart')}>
          <Ionicons name="bag-handle-outline" size={26} color="#8E8E93" />
          <Text style={styles.navText}>Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Ionicons name="person-outline" size={26} color="#8E8E93" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 25, // For safe area on newer iPhones
    paddingTop: 10,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    // Custom shape as seen in image
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navIconActive: {
    backgroundColor: '#58CC02',
    // Floating effect
    marginTop: -20,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    fontFamily: 'DIN Round Pro',
  },
  navTextActive: {
    color: '#58CC02',
  },
});
