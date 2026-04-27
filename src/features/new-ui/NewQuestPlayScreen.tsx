import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { XpIcon } from './components/CustomIcons';
import { buildQuestPlayViewModel } from './questBackendViewModels';

const SubmitIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M3.63109 2.12202C2.73759 1.67552 1.74859 2.52802 2.05809 3.47752L4.06509 9.63002C4.12186 9.80383 4.22519 9.95876 4.36386 10.0779C4.50253 10.1971 4.67122 10.276 4.85159 10.306L12.7816 11.6275C13.1991 11.6975 13.1991 12.2975 12.7816 12.3675L4.85209 13.689C4.67172 13.719 4.50303 13.7979 4.36436 13.9171C4.22569 14.0363 4.12236 14.1912 4.06559 14.365L2.05809 20.521C1.74809 21.471 2.73759 22.3235 3.63109 21.877L21.3781 13.006C22.2076 12.591 22.2076 11.4075 21.3781 10.993L3.63109 2.12202Z" fill="white" />
  </Svg>
);

export const NewQuestPlayScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ runId?: string; nodeId?: string }>();
  const [prompt, setPrompt] = useState('');
  const [activeRunId, setActiveRunId] = useState<string | null>(params.runId ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasStartedRunRef = useRef(false);
  const questHome = useQuery(
    api.questProduct.getQuestHome,
    !params.runId && !params.nodeId ? {} : "skip",
  );
  const questRun = useQuery(
    api.questProduct.getQuestRun,
    activeRunId ? { runId: activeRunId as Id<"questRuns"> } : "skip",
  );
  const startQuestRun = useMutation(api.questProduct.startQuestRun);
  const submitQuestAttempt = useMutation(api.questProduct.submitQuestAttempt);

  useEffect(() => {
    if (params.runId) {
      setActiveRunId(params.runId);
    }
  }, [params.runId]);

  useEffect(() => {
    const startRun = async () => {
      const nodeId = params.nodeId ?? questHome?.activeNode?.id;
      if (!nodeId || activeRunId || hasStartedRunRef.current) {
        return;
      }

      hasStartedRunRef.current = true;
      try {
        const result = await startQuestRun({ nodeId });
        setActiveRunId(result.runId);
      } catch (error) {
        hasStartedRunRef.current = false;
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to start this quest.",
        );
      }
    };

    startRun();
  }, [activeRunId, params.nodeId, questHome?.activeNode?.id, startQuestRun]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  };

  const handleSubmit = async () => {
    if (!activeRunId || !prompt.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await submitQuestAttempt({
        runId: activeRunId as Id<"questRuns">,
        submissionPayload: { prompt: prompt.trim() },
      });
      router.push({
        pathname: "/game/quest-result",
        params: { runId: activeRunId },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit this prompt.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>Quest unavailable</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.retryButtonText}>BACK TO QUESTS</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!questRun) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#58CC02" />
          <Text style={styles.stateText}>Loading quest...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const playModel = buildQuestPlayViewModel({
    run: questRun.run,
    node: questRun.node,
    lesson: questRun.lesson,
    trackProgressPercent: questHome?.featuredCourse.progress,
  });
  const contentPayload = questRun.lesson?.contentPayload as Record<string, unknown> | undefined;
  const targetPrompt =
    typeof contentPayload?.requirementBrief === "string"
      ? contentPayload.requirementBrief
      : typeof contentPayload?.description === "string"
        ? contentPayload.description
        : playModel.subtitle;
  const heartCount = Math.max(0, Math.min(5, playModel.heartsRemaining));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Progress and Hearts */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="close" size={28} color="#3C3C3C" />
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${playModel.progressPercent}%` }]} />
              </View>
            </View>
            <View style={styles.heartsContainer}>
              {Array.from({ length: heartCount }).map((_, index) => (
                <Ionicons key={index} name="heart" size={24} color="#FF9600" style={styles.heartIcon} />
              ))}
            </View>
          </View>

          {/* Level Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{playModel.levelLabel}</Text>
            </View>
          </View>

          {/* Title Area */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{playModel.title}</Text>
            <Text style={styles.subTitle}>
              {playModel.subtitle}
            </Text>
          </View>

          {/* Target Card */}
          <View style={styles.targetCard}>
            <Text style={styles.targetLabel}>Quest Target</Text>
            <View style={styles.previewContainer}>
              <Text style={styles.targetText}>{targetPrompt}</Text>
            </View>
          </View>

          {/* Constraints Section */}
          <View style={styles.constraintsSection}>
            <Text style={styles.optimalLengthText}>Checklist</Text>
            <View style={styles.tagsContainer}>
              {playModel.checklistItems.slice(0, 3).map((item) => (
                <View key={item} style={styles.tag}>
                  <Ionicons name="checkmark" size={14} color="#3C3C3C" />
                  <Text style={styles.tagText}>{item.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Prompt Entry Area */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your Prompt</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Write your prompt..."
                placeholderTextColor="#A0A0A0"
                multiline
                value={prompt}
                onChangeText={setPrompt}
                textAlignVertical="top"
              />
            </View>
          </View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.rewardBox}>
            <Text style={styles.rewardLabel}>REWARD</Text>
            <View style={styles.xpBox}>
              <Text style={styles.rewardValue}>+{playModel.rewardXp} XP</Text>
              <XpIcon width={16} height={18} />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.submitButton, (!prompt.trim() || isSubmitting) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!prompt.trim() || isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? "SUBMITTING" : "SUBMIT PROMPT"}</Text>
            <SubmitIcon />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 10,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'DIN Round Pro',
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#58CC02',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderBottomWidth: 4,
    borderBottomColor: '#46A302',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'DIN Round Pro',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 2,
  },
  progressContainer: {
    flex: 1,
    marginRight: 15,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#58CC02',
    borderRadius: 6,
  },
  heartsContainer: {
    flexDirection: 'row',
  },
  heartIcon: {
    marginLeft: 4,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  levelBadge: {
    backgroundColor: '#E8F7DD',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelBadgeText: {
    color: '#58CC02',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
    fontFamily: 'DIN Round Pro',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  mainTitle: {
    fontSize: 40,
    fontWeight: '700',
    color: '#3C3C3C',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'DIN Round Pro',
  },
  subTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    fontFamily: 'DIN Round Pro',
  },
  targetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: 380,
    height: 138,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 25,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  targetLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3C3C3C',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'DIN Round Pro',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewButton: {
    backgroundColor: '#00D4D4',
    width: 350,
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    // Add subtle shadow for the button as in image
    shadowColor: '#00D4D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  previewButtonText: {
    color: '#3C3C3C',
    fontWeight: '800',
    fontSize: 18,
    fontFamily: 'DIN Round Pro',
  },
  targetText: {
    color: '#3C3C3C',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '700',
    fontFamily: 'DIN Round Pro',
  },
  constraintsSection: {
    marginBottom: 20,
  },
  optimalLengthText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'DIN Round Pro',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 120, // As per design
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    // Height is Hug (approx 24px)
    minHeight: 24,
  },
  tagText: {
    marginLeft: 4, // Gap: 4px
    fontSize: 11, // Small font for 24px height
    fontWeight: '700',
    color: '#3C3C3C',
    fontFamily: 'DIN Round Pro',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'DIN Round Pro',
  },
  inputWrapper: {
    backgroundColor: '#F7F7F7',
    borderRadius: 15,
    padding: 16,
    height: 180,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  textInput: {
    fontSize: 18,
    color: '#3C3C3C',
    lineHeight: 26,
    height: '100%',
    fontFamily: 'DIN Round Pro',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  rewardBox: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#999',
    marginBottom: 2,
    fontFamily: 'DIN Round Pro',
  },
  xpBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FF9600',
    marginRight: 6,
    fontFamily: 'DIN Round Pro',
  },
  submitButton: {
    backgroundColor: '#58CC02',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 14,
    borderRadius: 15,
    // Bottom shadow for the green button
    borderBottomWidth: 4,
    borderBottomColor: '#46A302',
  },
  submitButtonDisabled: {
    backgroundColor: '#AFAFAF',
    borderBottomColor: '#8E8E8E',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    marginRight: 8,
    fontFamily: 'DIN Round Pro',
  },
  sendIcon: {
    transform: [{ rotate: '-45deg' }],
  },
});
