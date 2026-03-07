import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

const CONTEXT_TYPES = [
    { icon: 'time-outline' as const, label: 'Time of Day', example: 'at sunset' },
    { icon: 'cloud-outline' as const, label: 'Weather / Atmosphere', example: 'on a misty morning' },
    { icon: 'happy-outline' as const, label: 'Emotions / Mood', example: 'feeling peaceful' },
    { icon: 'camera-outline' as const, label: 'Camera / Composition', example: 'close-up shot' },
];

export function Concept3Screen() {
    const { goToNextStep, addBadge, addXp } = useOnboardingStore();

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addBadge('context-master');
        addXp(15);
        goToNextStep();
    };

    return (
        <OnboardingScreenWrapper>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.topSpace} />

                {/* Prompto */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.center}>
                    <PromptoCharacter state="speaking" size="md" />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <View style={styles.ingredientBadge}>
                        <Text style={styles.ingredientNumber}>3</Text>
                    </View>
                    <Text style={styles.title}>Context</Text>
                </Animated.View>

                {/* Explanation */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.explanationContainer}
                >
                    <Text style={styles.explanation}>
                        Context brings your prompt to life{'\n'}with{' '}
                        <Text style={styles.bold}>rich details and atmosphere</Text>
                    </Text>
                </Animated.View>

                {/* Context types */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(700)}
                    style={styles.typesContainer}
                >
                    {CONTEXT_TYPES.map((type, index) => (
                        <Animated.View
                            key={type.label}
                            entering={FadeInUp.duration(400).delay(700 + index * 100)}
                            style={styles.typeCard}
                        >
                            <Ionicons name={type.icon} size={22} color="#03DAC6" />
                            <View style={styles.typeContent}>
                                <Text style={styles.typeLabel}>{type.label}</Text>
                                <Text style={styles.typeExample}>e.g., "{type.example}"</Text>
                            </View>
                        </Animated.View>
                    ))}
                </Animated.View>

                {/* Progressive example */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(1100)}
                    style={styles.progressionCard}
                >
                    <Text style={styles.progressionTitle}>See the Difference</Text>
                    <View style={styles.progressionStep}>
                        <View style={[styles.dot, { backgroundColor: '#FF6B00' }]} />
                        <Text style={styles.progressionText}>"A cat in watercolor"</Text>
                    </View>
                    <Ionicons name="arrow-down" size={16} color="#475569" style={{ alignSelf: 'center', marginVertical: 4 }} />
                    <View style={styles.progressionStep}>
                        <View style={[styles.dot, { backgroundColor: '#03DAC6' }]} />
                        <Text style={[styles.progressionText, styles.progressionHighlight]}>
                            "A cat in watercolor, at sunset, feeling peaceful"
                        </Text>
                    </View>
                </Animated.View>

                {/* Continue */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.continueButton}
                        onPress={handleContinue}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.continueText}>Let's Try It!</Text>
                    </TouchableOpacity>
                </View>

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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 10,
    },
    ingredientBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#03DAC6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ingredientNumber: {
        color: '#0B1220',
        fontSize: 14,
        fontWeight: '900',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },

    explanationContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    explanation: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
        fontWeight: '500',
    },
    bold: { color: '#FFFFFF', fontWeight: '700' },
    typesContainer: {
        marginTop: 20,
        gap: 10,
    },
    typeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        gap: 12,
    },

    typeContent: { flex: 1 },
    typeLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#E2E8F0',
    },
    typeExample: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
        fontStyle: 'italic',
    },
    progressionCard: {
        backgroundColor: 'rgba(3, 218, 198, 0.06)',
        borderRadius: 18,
        padding: 18,
        marginTop: 24,
        borderWidth: 1,
        borderColor: 'rgba(3, 218, 198, 0.15)',
    },
    progressionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#03DAC6',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        textAlign: 'center',
        marginBottom: 12,
    },
    progressionStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    progressionText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
        fontStyle: 'italic',
        flex: 1,
    },
    progressionHighlight: {
        color: '#E2E8F0',
        fontWeight: '600',
    },
    buttonContainer: {
        marginTop: 28,
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
    },
});
