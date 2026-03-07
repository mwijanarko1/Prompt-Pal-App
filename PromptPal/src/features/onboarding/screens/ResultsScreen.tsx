import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

export function ResultsScreen() {
    const { goToNextStep, score, addBadge, addXp } = useOnboardingStore();
    const scoreAnim = useSharedValue(0);
    const displayScore = score ?? 78;

    useEffect(() => {
        // Animate score count-up
        scoreAnim.value = withDelay(
            800,
            withTiming(displayScore, {
                duration: 1500,
                easing: Easing.out(Easing.cubic),
            })
        );

        // Award badges
        addBadge('prompt-apprentice');
        addXp(100);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const scoreStyle = useAnimatedStyle(() => ({
        opacity: scoreAnim.value > 0 ? 1 : 0.3,
    }));

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goToNextStep();
    };

    const getScoreColor = () => {
        if (displayScore >= 80) return '#22C55E';
        if (displayScore >= 60) return '#F59E0B';
        return '#FF6B00';
    };

    const getScoreLabel = () => {
        if (displayScore >= 80) return 'Excellent!';
        if (displayScore >= 60) return 'Great Job!';
        return 'Good Start!';
    };

    return (
        <OnboardingScreenWrapper>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topSpace} />

                {/* Prompto celebrating */}
                <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.center}>
                    <PromptoCharacter state="celebrating" size="lg" />
                </Animated.View>

                {/* Celebration text */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.titleContainer}
                >
                    <Text style={styles.title}>Amazing Work!</Text>
                </Animated.View>

                {/* Score card */}
                <Animated.View
                    entering={ZoomIn.duration(600).delay(800)}
                    style={[styles.scoreCard, { borderColor: getScoreColor() + '30' }]}
                >
                    <Text style={styles.scoreLabel}>Similarity Score</Text>
                    <Animated.View style={scoreStyle}>
                        <Text style={[styles.scoreValue, { color: getScoreColor() }]}>
                            {displayScore}%
                        </Text>
                    </Animated.View>
                    <Text style={[styles.scoreRating, { color: getScoreColor() }]}>
                        {getScoreLabel()}
                    </Text>
                </Animated.View>

                {/* Breakdown */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(1200)}
                    style={styles.breakdownContainer}
                >
                    {[
                        { label: 'Subject', icon: 'locate-outline' as const, status: 'Perfect!', color: '#22C55E' },
                        { label: 'Style', icon: 'color-palette-outline' as const, status: 'Great!', color: '#22C55E' },
                        { label: 'Context', icon: 'bulb-outline' as const, status: 'Nice!', color: '#22C55E' },
                    ].map((item, index) => (
                        <Animated.View
                            key={item.label}
                            entering={FadeInUp.duration(400).delay(1200 + index * 150)}
                            style={styles.breakdownRow}
                        >
                            <Ionicons name="checkmark-circle" size={20} color={item.color} />
                            <Ionicons name={item.icon} size={18} color="#64748B" />
                            <Text style={styles.breakdownLabel}>{item.label}</Text>
                            <Text style={[styles.breakdownStatus, { color: item.color }]}>
                                {item.status}
                            </Text>
                        </Animated.View>
                    ))}
                </Animated.View>

                {/* Prompto message */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(1800)}
                    style={styles.messageCard}
                >
                    <Text style={styles.messageText}>
                        "You nailed it! Your prompt included all three magic ingredients
                        perfectly!"
                    </Text>
                    <Text style={styles.messageSender}>— Prompto</Text>
                </Animated.View>

                {/* Rewards */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(2000)}
                    style={styles.rewardsContainer}
                >
                    <Text style={styles.rewardsTitle}>Rewards Unlocked</Text>
                    <View style={styles.rewardsGrid}>
                        {[
                            { icon: 'school-outline' as const, label: 'Prompt Apprentice' },
                            { icon: 'star-outline' as const, label: 'Level 1 Complete' },
                            { icon: 'gift-outline' as const, label: '100 XP Bonus' },
                            { icon: 'flame-outline' as const, label: '1-Day Streak' },
                        ].map((reward) => (
                            <View key={reward.label} style={styles.rewardChip}>
                                <Ionicons name={reward.icon} size={14} color="#F59E0B" />
                                <Text style={styles.rewardLabel}>{reward.label}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                {/* Continue */}
                <Animated.View entering={FadeInUp.duration(500).delay(2200)} style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="trophy" size={20} color="#FFFFFF" />
                        <Text style={styles.continueText}>Continue Journey</Text>
                    </TouchableOpacity>
                </Animated.View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </OnboardingScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 32,
    },
    topSpace: { height: 8 },
    center: { alignItems: 'center' },
    titleContainer: {
        alignItems: 'center',
        marginTop: 16,
    },
    title: {
        fontSize: 30,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    scoreCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 24,
        padding: 24,
        marginTop: 20,
        alignItems: 'center',
        borderWidth: 2,
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    scoreValue: {
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: -2,
        marginVertical: 4,
    },
    scoreRating: {
        fontSize: 18,
        fontWeight: '800',
    },
    breakdownContainer: {
        marginTop: 20,
        gap: 10,
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        padding: 12,
    },

    breakdownLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E2E8F0',
        flex: 1,
    },
    breakdownStatus: {
        fontSize: 14,
        fontWeight: '700',
    },
    messageCard: {
        backgroundColor: 'rgba(187, 134, 252, 0.06)',
        borderRadius: 18,
        padding: 18,
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(187, 134, 252, 0.12)',
        alignItems: 'center',
    },
    messageText: {
        fontSize: 14,
        color: '#CBD5E1',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    messageSender: {
        fontSize: 12,
        color: '#BB86FC',
        fontWeight: '700',
        marginTop: 8,
    },
    rewardsContainer: {
        marginTop: 20,
    },
    rewardsTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F59E0B',
        textTransform: 'uppercase',
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 12,
    },
    rewardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    rewardChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.15)',
    },

    rewardLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#CBD5E1',
    },
    buttonContainer: {
        marginTop: 24,
    },
    continueButton: {
        backgroundColor: '#FF6B00',
        borderRadius: 28,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    continueText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
});
