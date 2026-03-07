import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    FadeIn,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';
import { ONBOARDING_COLORS } from '../theme';

const GENERATION_DURATION_MS = 9000;

const LOADING_MESSAGES = [
    'Analyzing your prompt…',
    'Understanding the subject…',
    'Applying the style…',
    'Setting the context…',
    'Generating your image…',
    'Almost there…',
];

export function GeneratingScreen() {
    const { goToNextStep } = useOnboardingStore();
    const [messageIndex, setMessageIndex] = useState(0);
    const progressWidth = useSharedValue(0);
    const dotOpacity = useSharedValue(0.3);

    // Cycle through loading messages
    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) =>
                prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
            );
        }, GENERATION_DURATION_MS / LOADING_MESSAGES.length);

        return () => clearInterval(interval);
    }, []);

    // Animate progress bar
    useEffect(() => {
        progressWidth.value = withTiming(100, {
            duration: GENERATION_DURATION_MS,
            easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
        });

        dotOpacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 600 }),
                withTiming(0.3, { duration: 600 })
            ),
            -1,
            true
        );
    }, []);

    // Auto-advance after animation
    useEffect(() => {
        const timer = setTimeout(() => {
            goToNextStep();
        }, GENERATION_DURATION_MS);

        return () => clearTimeout(timer);
    }, []);

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const dotStyle = useAnimatedStyle(() => ({
        opacity: dotOpacity.value,
    }));

    return (
        <OnboardingScreenWrapper>
            <View style={styles.container}>
                <View style={styles.topSpace} />

                {/* Prompto thinking */}
                <Animated.View entering={FadeIn.duration(500)}>
                    <PromptoCharacter state="thinking" size="lg" />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <Text style={styles.title}>Generating Your Creation…</Text>
                    <Animated.View style={[styles.sparkleRow, dotStyle]}>
                        <Ionicons name="flash" size={22} color={ONBOARDING_COLORS.accent} />
                    </Animated.View>
                </Animated.View>

                {/* Loading animation */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.loadingCard}
                >
                    <View style={styles.loadingIconRow}>
                        {(
                            [
                                { name: 'locate-outline', color: '#FF6B00' },
                                { name: 'color-palette-outline', color: ONBOARDING_COLORS.violet },
                                { name: 'bulb-outline', color: ONBOARDING_COLORS.teal },
                            ] as const
                        ).map((icon, i) => (
                            <Animated.View
                                key={icon.name}
                                entering={FadeIn.duration(400).delay(800 + i * 300)}
                                style={styles.loadingIcon}
                            >
                                <Ionicons name={icon.name} size={20} color={icon.color} />
                            </Animated.View>
                        ))}
                    </View>

                    {/* Message */}
                    <Text style={styles.loadingMessage}>
                        {LOADING_MESSAGES[messageIndex]}
                    </Text>

                    {/* Progress bar */}
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, progressStyle]} />
                    </View>
                </Animated.View>

                {/* Prompto's message */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(1000)}
                    style={styles.messageCard}
                >
                    <Text style={styles.messageText}>
                        "The AI is crafting something special…{'\n'}This usually takes a few seconds."
                    </Text>
                    <Text style={styles.messageSender}>— Prompto</Text>
                </Animated.View>

                <View style={styles.spacer} />
            </View>
        </OnboardingScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    topSpace: { flex: 0.1 },
    titleContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        color: ONBOARDING_COLORS.textPrimary,
        textAlign: 'center',
    },
    sparkleRow: {
        marginTop: 8,
    },

    loadingCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 24,
        padding: 28,
        marginTop: 28,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    loadingIconRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    loadingIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingMessage: {
        fontSize: 16,
        color: ONBOARDING_COLORS.textSecondary,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        minHeight: 24,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: ONBOARDING_COLORS.accent,
        borderRadius: 3,
    },
    messageCard: {
        backgroundColor: 'rgba(187, 134, 252, 0.06)',
        borderRadius: 18,
        padding: 18,
        marginTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(187, 134, 252, 0.12)',
        alignItems: 'center',
    },
    messageText: {
        fontSize: 14,
        color: '#94A3B8',
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
    spacer: { flex: 1 },
});
