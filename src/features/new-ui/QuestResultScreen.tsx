import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { buildQuestResultViewModel } from './questBackendViewModels';

interface ResultStatProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  bannerColor: string;
  borderColor: string;
}

const GoodIcon = () => (
  <Svg width="24" height="22" viewBox="0 0 24 22" fill="none">
    <Circle cx="10.4054" cy="11.5946" r="10.4054" fill="#58CC02"/>
    <Circle cx="10.4052" cy="11.5946" r="3.56757" fill="#ECFFDE"/>
    <Circle cx="10.4052" cy="11.5946" r="6.77703" stroke="#ECFFDE" strokeWidth="2.5"/>
    <Path d="M15.4976 3.25927L15.9781 6.86262C16.0251 7.21542 16.2562 7.51664 16.5847 7.65353L19.351 8.80614C19.5181 8.87578 19.7098 8.84963 19.8522 8.73777L23.1134 6.17542C23.4137 5.93948 23.3493 5.4676 22.9968 5.32072L20.6997 4.3636C20.3969 4.23744 20.1752 3.9708 20.1065 3.65005L19.4903 0.77447C19.4133 0.415087 18.9879 0.258829 18.6965 0.482922L15.6884 2.79687C15.5468 2.90584 15.474 3.08212 15.4976 3.25927Z" fill="#58A700"/>
    <Path d="M10.405 11.5946L20.2158 4.16217" stroke="#478700" strokeWidth="1.5" strokeLinecap="round"/>
  </Svg>
);

const SpeedyIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <Circle cx="10.75" cy="10.75" r="9.5" stroke="#FF9600" strokeWidth="2.5"/>
    <Circle cx="10.7499" cy="11.0214" r="2.21429" fill="#FF9600" stroke="#FF9600"/>
    <Path d="M10.2495 11.25L15.2495 7.25" stroke="#FF9600" strokeWidth="2" strokeLinecap="round"/>
  </Svg>
);

const ResultStat = ({ label, value, icon, bannerColor, borderColor }: ResultStatProps) => (
  <View style={[styles.statCard, { borderColor }]}>
    <View style={[styles.statBanner, { backgroundColor: bannerColor }]}>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <View style={styles.statContent}>
      {icon}
      <Text style={[styles.statValue, { color: bannerColor === '#FFC800' ? '#FF9600' : bannerColor }]}>{value}</Text>
    </View>
  </View>
);

export const QuestResultScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ runId?: string }>();
  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const result = useQuery(
    api.questProduct.getQuestResult,
    params.runId ? { runId: params.runId as Id<"questRuns"> } : "skip",
  );
  const claimQuestRewards = useMutation(api.questProduct.claimQuestRewards);

  const handleClaimXP = async () => {
    if (!params.runId || isClaiming) {
      return;
    }

    setIsClaiming(true);
    setErrorMessage(null);
    try {
      await claimQuestRewards({ runId: params.runId as Id<"questRuns"> });
      router.push({
        pathname: "/game/quest-completion",
        params: { runId: params.runId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to claim this reward.",
      );
    } finally {
      setIsClaiming(false);
    }
  };

  if (!params.runId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Missing quest result</Text>
          <TouchableOpacity style={styles.claimButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.claimButtonText}>BACK TO QUESTS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#58CC02" />
          <Text style={styles.stateText}>Loading result...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const resultModel = buildQuestResultViewModel({
    run: result.run,
    latestAttempt: result.latestAttempt,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Wizard Illustration */}
        <View style={styles.illustrationContainer}>
          <Image
            source={require('../../../assets/Group.svg')}
            style={styles.wizardImage}
            contentFit="contain"
          />
        </View>

        {/* Title Area */}
        <View style={styles.textSection}>
          <Text style={styles.title}>{resultModel.title}</Text>
          <Text style={styles.description}>
            {resultModel.description}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <ResultStat
            label="TOTAL XP"
            value={String(resultModel.rewardXp)}
            bannerColor="#FFB800"
            borderColor="#FFB800"
            icon={<Ionicons name="flash" size={20} color="#FF9600" style={styles.statIcon} />}
          />
          <ResultStat
            label="GOOD"
            value={`${resultModel.scorePercent}%`}
            bannerColor="#58CC02"
            borderColor="#58CC02"
            icon={<View style={styles.statIcon}><GoodIcon /></View>}
          />
          <ResultStat
            label="SPEEDY"
            value={resultModel.timeLabel}
            bannerColor="#FF9600"
            borderColor="#FF9600"
            icon={<View style={styles.statIcon}><SpeedyIcon /></View>}
          />
        </View>

        {/* Actions Area */}
        <View style={styles.actionsContainer}>
          {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
          <TouchableOpacity
            style={[styles.claimButton, (!resultModel.canClaimReward || isClaiming) && styles.claimButtonDisabled]}
            onPress={handleClaimXP}
            disabled={!resultModel.canClaimReward || isClaiming}
          >
            <Text style={styles.claimButtonText}>
              {isClaiming ? "CLAIMING" : resultModel.claimButtonLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={() => { }}>
            <Ionicons name="share-outline" size={24} color="#3C3C3C" />
            <Text style={styles.shareButtonText}>SHARE MY ACHIEVEMENT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    marginBottom: 16,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'DIN Round Pro',
    textAlign: 'center',
    marginTop: 10,
  },
  illustrationContainer: {
    width: '100%',
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  wizardImage: {
    width: '100%',
    height: '100%',
  },
  textSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
    marginBottom: 5,
  },
  description: {
    fontSize: 18,
    color: '#666',
    fontWeight: '700',
    fontFamily: 'DIN Round Pro',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
  },
  statCard: {
    width: 110,
    height: 86,
    marginHorizontal: 5,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  statBanner: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    letterSpacing: 0.5,
  },
  statContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
  },
  statIcon: {
    marginRight: 6,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  claimButton: {
    backgroundColor: '#58CC02',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 25,
    // Effect
    borderBottomWidth: 5,
    borderBottomColor: '#46A302',
  },
  claimButtonDisabled: {
    backgroundColor: '#AFAFAF',
    borderBottomColor: '#8E8E8E',
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    letterSpacing: 1,
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'DIN Round Pro',
    marginBottom: 12,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#3C3C3C',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});
