import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';
import { ONBOARDING_COLORS } from '../theme';

const PASSING_SCORE = 60;
const XP_REWARD = 100;

export function ResultsScreen() {
  const { goToNextStep, addBadge, addXp, generatedCopy, score, copyFeedback } = useOnboardingStore();

  useEffect(() => {
    addBadge('prompt-apprentice');
    addXp(XP_REWARD);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    goToNextStep();
  };

  const displayScore = score ?? 0;
  const passed = displayScore >= PASSING_SCORE;
  const qualityLabel = displayScore >= 80 ? 'EXPERT' : displayScore >= 60 ? 'GOOD' : 'LEARNING';

  return (
    <OnboardingScreenWrapper showProgress={true}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={ZoomIn.duration(600).delay(200)} style={styles.fireworksRow}>
          <Ionicons name="sparkles" size={24} color={ONBOARDING_COLORS.accentWarm} />
          <Ionicons name="star" size={32} color={ONBOARDING_COLORS.accent} />
          <Ionicons name="sparkles" size={24} color={ONBOARDING_COLORS.accentWarm} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.textContainer}>
          <Text style={styles.title}>Amazing Work! 🎉</Text>

          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons
                name={passed ? 'checkmark-done-circle' : 'checkmark-circle'}
                size={40}
                color={passed ? ONBOARDING_COLORS.success : ONBOARDING_COLORS.accentWarm}
              />
              <Text style={styles.resultStatus}>CHALLENGE COMPLETE</Text>
            </View>
            <View style={styles.divider} />
            {generatedCopy ? (
              <View style={styles.generatedCopyBox}>
                <Text style={styles.generatedCopyLabel}>YOUR AI-GENERATED HEADLINE</Text>
                <Text style={styles.generatedCopyText}>"{generatedCopy}"</Text>
              </View>
            ) : null}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>SCORE</Text>
                <Text style={[styles.statValue, { color: passed ? ONBOARDING_COLORS.success : ONBOARDING_COLORS.accentWarm }]}>
                  {displayScore}%
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>PROMPT QUALITY</Text>
                <Text style={styles.statValue}>{qualityLabel}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>XP EARNED</Text>
                <Text style={styles.statValue}>+{XP_REWARD}</Text>
              </View>
            </View>
          </View>

          {copyFeedback && copyFeedback.length > 0 ? (
            <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.breakdownBox}>
              <Text style={styles.breakdownTitle}>Feedback</Text>
              {copyFeedback.map((line, i) => (
                <View key={i} style={styles.breakdownRow}>
                  <Ionicons name="chatbubble-ellipses" size={18} color={ONBOARDING_COLORS.accent} />
                  <Text style={styles.breakdownText}>{line}</Text>
                </View>
              ))}
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.breakdownBox}>
              <View style={styles.breakdownRow}>
                <Ionicons name="checkmark-circle" size={20} color={ONBOARDING_COLORS.success} />
                <Text style={styles.breakdownText}>Subject: <Text style={styles.boldText}>Identified</Text></Text>
              </View>
              <View style={styles.breakdownRow}>
                <Ionicons name="checkmark-circle" size={20} color={ONBOARDING_COLORS.success} />
                <Text style={styles.breakdownText}>Specificity: <Text style={styles.boldText}>Detailed</Text></Text>
              </View>
              <View style={styles.breakdownRow}>
                <Ionicons name="checkmark-circle" size={20} color={ONBOARDING_COLORS.success} />
                <Text style={styles.breakdownText}>Guardrail: <Text style={styles.boldText}>Protected</Text></Text>
              </View>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.duration(500).delay(1000)} style={styles.messageCard}>
            <Text style={styles.messageText}>
              {passed
                ? "You nailed it! Your prompt produced a great tagline. You've learned the three magic ingredients for professional AI results."
                : "Nice try! Your prompt generated a tagline. Keep practicing Subject, Style, and Guardrails to improve your scores."}
            </Text>
          </Animated.View>
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View entering={FadeInUp.duration(500).delay(1200)} style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleContinue} activeOpacity={0.85}>
            <Ionicons name="trophy" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Continue Journey</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </OnboardingScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 30,
    paddingBottom: 40,
  },
  fireworksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: ONBOARDING_COLORS.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    marginBottom: 24,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resultStatus: {
    color: ONBOARDING_COLORS.textMuted,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 12,
    marginTop: 8,
  },
  generatedCopyBox: {
    width: '100%',
    backgroundColor: 'rgba(187, 134, 252, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.15)',
  },
  generatedCopyLabel: {
    color: ONBOARDING_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  generatedCopyText: {
    color: ONBOARDING_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: ONBOARDING_COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: ONBOARDING_COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '900',
  },
  breakdownBox: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  breakdownTitle: {
    color: ONBOARDING_COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  breakdownText: {
    color: ONBOARDING_COLORS.textSecondary,
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  boldText: {
    color: ONBOARDING_COLORS.textPrimary,
    fontWeight: 'bold',
  },
  messageCard: {
    backgroundColor: 'rgba(187, 134, 252, 0.06)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(187, 134, 252, 0.12)',
    width: '100%',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: ONBOARDING_COLORS.textPrimary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  button: {
    backgroundColor: ONBOARDING_COLORS.accent,
    borderRadius: 28,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ONBOARDING_COLORS.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
