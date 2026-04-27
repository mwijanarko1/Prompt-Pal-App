import React, { useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View, StyleSheet, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatCapsule } from '@/features/new-ui/components/StatCapsule';
import { FeaturedCourseCard } from '@/features/new-ui/components/FeaturedCourseCard';
import { QuestPath } from '@/features/new-ui/components/QuestPath';
import { XpIcon, StreakIcon } from '@/features/new-ui/components/CustomIcons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api.js";

export default function QuestScreen() {
  const router = useRouter();
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>();
  const questHome = useQuery(
    api.questProduct.getQuestHome,
    selectedTrackId ? { trackId: selectedTrackId } : {},
  );
  const startQuestRun = useMutation(api.questProduct.startQuestRun);
  const switchActiveTrack = useMutation(api.questProduct.switchActiveTrack);

  const handleStartQuest = async (nodeId?: string) => {
    const targetNodeId = nodeId ?? questHome?.activeNode?.id;
    if (!targetNodeId) {
      return;
    }
    const result = await startQuestRun({ nodeId: targetNodeId });
    router.push(`/game/quest/${result.runId}`);
  };

  const handleSwitchTrack = async (trackId: string) => {
    setSelectedTrackId(trackId);
    await switchActiveTrack({ trackId });
  };

  if (!questHome) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />

          <View style={styles.statsContainer}>
            <StatCapsule
              icon={<StreakIcon width={16} height={20} />}
              value={questHome.headerStats.currentStreak}
              color="#FF9600"
            />
            <StatCapsule
              icon={<XpIcon width={16} height={20} />}
              value={`${questHome.headerStats.totalXp} XP`}
              color="#FF9600"
            />
            <StatCapsule
              icon={<Ionicons name="heart" size={20} color="#FF4B4B" />}
              value={questHome.headerStats.hearts}
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
        <View style={styles.trackSwitcher}>
          {questHome.tracks.map((track) => {
            const isActive = track.id === questHome.activeTrack.id;
            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.trackChip, isActive && styles.trackChipActive]}
                onPress={() => handleSwitchTrack(track.id)}
                activeOpacity={0.85}
              >
                <Text style={[styles.trackChipText, isActive && styles.trackChipTextActive]}>
                  {track.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FeaturedCourseCard
          level={questHome.featuredCourse.level}
          track={questHome.featuredCourse.track}
          title={questHome.featuredCourse.title}
          progress={questHome.featuredCourse.progress}
          onPress={() => handleStartQuest()}
        />

        <QuestPath
          nodes={questHome.nodes.map((node) => ({
            id: node.id,
            status: node.status as any,
            label: node.label,
          }))}
          onNodePress={(nodeId) => {
            const node = questHome.nodes.find((item) => item.id === nodeId);
            if (node?.status === "current" || node?.status === "unlocked" || node?.status === "special") {
              handleStartQuest(nodeId);
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
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
  trackSwitcher: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  trackChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
  },
  trackChipActive: {
    borderColor: "#58CC02",
    backgroundColor: "#ECFFE5",
  },
  trackChipText: {
    color: "#777777",
    fontFamily: "DIN Round Pro",
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  trackChipTextActive: {
    color: "#3C3C3C",
  },
});
