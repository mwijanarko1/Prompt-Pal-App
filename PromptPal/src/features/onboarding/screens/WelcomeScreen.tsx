import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
    FadeInDown,
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

export function WelcomeScreen() {
    const { goToNextStep } = useOnboardingStore();
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(1.05, { duration: 1200 }),
                withTiming(1, { duration: 1200 })
            ),
            -1,
            true
        );
    }, []);

    const buttonPulse = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const handleGetStarted = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goToNextStep();
    };

    return (
        <OnboardingScreenWrapper showProgress={false}>
            <View style={styles.container}>
                {/* Top space */}
                <View style={styles.topSpace} />

                {/* Prompto character */}
                <Animated.View entering={FadeInDown.duration(600).delay(200)}>
                    <PromptoCharacter state="waving" size="lg" />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.titleContainer}
                >
                    <View style={styles.titleRow}>
                        <Text style={styles.titlePrompt}>Prompt</Text>
                        <Text style={styles.titlePal}>Pal</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        Master the Art of AI Prompts
                    </Text>
                </Animated.View>

                {/* Description */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(700)}
                    style={styles.descriptionContainer}
                >
                    <Text style={styles.description}>
                        I'm <Text style={styles.highlight}>Prompto</Text>, your AI mentor.{'\n'}
                        Together, we'll master the art{'\n'}
                        of crafting perfect prompts.
                    </Text>
                </Animated.View>

                {/* Spacer */}
                <View style={styles.spacer} />

                {/* CTA Button */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(1000)}
                    style={styles.buttonContainer}
                >
                    <Animated.View style={buttonPulse}>
                        <TouchableOpacity
                            style={styles.getStartedButton}
                            onPress={handleGetStarted}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.getStartedText}>Get Started</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
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
    topSpace: {
        flex: 0.15,
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titlePrompt: {
        fontSize: 42,
        fontWeight: '900',
        color: '#FF6B00',
        letterSpacing: -1.5,
    },
    titlePal: {
        fontSize: 42,
        fontWeight: '900',
        color: '#4151FF',
        letterSpacing: -1.5,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 3,
        marginTop: 8,
    },
    descriptionContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    description: {
        fontSize: 17,
        color: '#CBD5E1',
        lineHeight: 26,
        textAlign: 'center',
        fontWeight: '500',
    },
    highlight: {
        color: '#BB86FC',
        fontWeight: '700',
    },
    spacer: {
        flex: 1,
    },
    buttonContainer: {
        width: '100%',
        paddingBottom: 32,
    },
    getStartedButton: {
        backgroundColor: '#FF6B00',
        borderRadius: 28,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    getStartedText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

});
