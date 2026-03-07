import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

export function StoryIntroScreen() {
    const { goToNextStep } = useOnboardingStore();

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToNextStep();
    };

    return (
        <OnboardingScreenWrapper>
            <View style={styles.container}>
                <View style={styles.topSpace} />

                {/* Prompto */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <PromptoCharacter state="thinking" size="lg" />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(400)}
                    style={styles.titleContainer}
                >
                    <Text style={styles.title}>The Secret of{'\n'}Great Prompts</Text>
                </Animated.View>

                {/* Body */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.bodyContainer}
                >
                    <Text style={styles.body}>
                        Every amazing AI creation starts with a great prompt. But what makes
                        a prompt <Text style={styles.emphasis}>great</Text>?
                    </Text>
                </Animated.View>

                {/* Teaser card */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(800)}
                    style={styles.teaserCard}
                >
                    <Ionicons name="sparkles" size={24} color="#F59E0B" style={{ marginRight: 12 }} />
                    <Text style={styles.teaserText}>
                        Let me show you the{'\n'}
                        <Text style={styles.teaserHighlight}>three magic ingredients</Text>
                        …
                    </Text>
                </Animated.View>

                {/* Ingredients preview */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(1000)}
                    style={styles.ingredientPreview}
                >
                    {[
                        { icon: 'locate-outline' as const, label: 'Subject', color: '#FF6B00' },
                        { icon: 'color-palette-outline' as const, label: 'Style', color: '#BB86FC' },
                        { icon: 'bulb-outline' as const, label: 'Context', color: '#03DAC6' },
                    ].map((item) => (
                        <View
                            key={item.label}
                            style={[styles.ingredientChip, { borderColor: item.color + '40' }]}
                        >
                            <Ionicons name={item.icon} size={14} color={item.color} style={{ marginRight: 6 }} />
                            <Text style={[styles.ingredientLabel, { color: item.color }]}>
                                {item.label}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                <View style={styles.spacer} />

                {/* Continue */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(1200)}
                    style={styles.buttonContainer}
                >
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueText}>Continue</Text>
                    </TouchableOpacity>
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
        flex: 0.06,
    },
    titleContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: -0.5,
        lineHeight: 38,
    },
    bodyContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    body: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500',
    },
    emphasis: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    teaserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingHorizontal: 24,
        paddingVertical: 18,
        marginTop: 28,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },

    teaserText: {
        fontSize: 15,
        color: '#CBD5E1',
        lineHeight: 22,
        fontWeight: '500',
    },
    teaserHighlight: {
        color: '#F59E0B',
        fontWeight: '700',
    },
    ingredientPreview: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 24,
    },
    ingredientChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderWidth: 1,
    },

    ingredientLabel: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    spacer: {
        flex: 1,
    },
    buttonContainer: {
        width: '100%',
        paddingBottom: 32,
    },
    continueButton: {
        backgroundColor: '#FF6B00',
        borderRadius: 28,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 6,
    },
    continueText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
});
