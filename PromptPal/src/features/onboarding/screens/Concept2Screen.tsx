import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

const STYLE_MATCHES = [
    { style: 'Cyberpunk', description: 'Futuristic, neon', icon: 'flash-outline' as const, color: '#BB86FC' },
    { style: 'Watercolor', description: 'Soft, painted', icon: 'color-palette-outline' as const, color: '#03DAC6' },
    { style: 'Minimalist', description: 'Clean, simple', icon: 'remove-outline' as const, color: '#F59E0B' },
];

export function Concept2Screen() {
    const { goToNextStep, addBadge, addXp } = useOnboardingStore();
    const [matched, setMatched] = useState<Record<string, boolean>>({});
    const allMatched = Object.keys(matched).length === STYLE_MATCHES.length;

    const handleMatch = (styleName: string) => {
        if (matched[styleName]) return;

        setMatched((prev) => ({ ...prev, [styleName]: true }));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (Object.keys(matched).length + 1 === STYLE_MATCHES.length) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addXp(15);
        }
    };

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addBadge('style-master');
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
                    <PromptoCharacter
                        state={allMatched ? 'excited' : 'speaking'}
                        size="md"
                    />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <View style={styles.ingredientBadge}>
                        <Text style={styles.ingredientNumber}>2</Text>
                    </View>
                    <Text style={styles.title}>Style</Text>
                </Animated.View>

                {/* Explanation */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.explanationContainer}
                >
                    <Text style={styles.explanation}>
                        Style gives your creation its{'\n'}
                        <Text style={styles.bold}>unique look and feel</Text>:
                    </Text>
                    <View style={styles.bulletList}>
                        {['Art medium (painting, photo)', 'Artistic style (cyberpunk, etc.)', 'Color palette'].map(
                            (item) => (
                                <View key={item} style={styles.bulletRow}>
                                    <View style={styles.bulletDot} />
                                    <Text style={styles.bulletText}>{item}</Text>
                                </View>
                            )
                        )}
                    </View>
                </Animated.View>

                {/* Before / After */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.transformRow}
                >
                    <View style={styles.transformCard}>
                        <Text style={styles.transformLabel}>Before</Text>
                        <Text style={styles.transformText}>"A cat"</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={20} color="#FF6B00" />
                    <View style={[styles.transformCard, styles.transformCardHighlight]}>
                        <Text style={styles.transformLabel}>After</Text>
                        <Text style={styles.transformText}>"A cat in watercolor"</Text>
                    </View>
                </Animated.View>

                {/* Interactive matching */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(800)}
                    style={styles.matchContainer}
                >
                    <Text style={styles.matchTitle}>Tap to match the style</Text>

                    {STYLE_MATCHES.map((item) => (
                        <TouchableOpacity
                            key={item.style}
                            style={[
                                styles.matchCard,
                                matched[item.style] && { borderColor: item.color, backgroundColor: item.color + '10' },
                            ]}
                            onPress={() => handleMatch(item.style)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={item.icon} size={22} color={matched[item.style] ? item.color : '#64748B'} />
                            <View style={styles.matchContent}>
                                <Text style={[styles.matchStyle, matched[item.style] && { color: item.color }]}>
                                    {item.style}
                                </Text>
                                <Text style={styles.matchDescription}>{item.description}</Text>
                            </View>
                            {matched[item.style] && (
                                <Animated.View entering={ZoomIn.duration(300)}>
                                    <Ionicons name="checkmark-circle" size={22} color={item.color} />
                                </Animated.View>
                            )}
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                {/* Feedback */}
                {allMatched && (
                    <Animated.View entering={FadeInUp.duration(400)} style={styles.feedbackCard}>
                        <Text style={styles.feedbackText}>
                            You're getting it! Style transforms a simple prompt into something extraordinary.
                        </Text>
                    </Animated.View>
                )}

                {/* Continue */}
                {allMatched && (
                    <Animated.View entering={FadeInUp.duration(500)} style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.continueText}>Let's Try It!</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

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
        backgroundColor: '#BB86FC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ingredientNumber: {
        color: '#FFFFFF',
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
    bulletList: {
        marginTop: 12,
        alignSelf: 'stretch',
        paddingLeft: 16,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    bulletDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#BB86FC',
        marginRight: 10,
    },
    bulletText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '500',
    },
    transformRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 20,
        width: '100%',
    },
    transformCard: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    transformCardHighlight: {
        borderColor: 'rgba(255, 107, 0, 0.3)',
        backgroundColor: 'rgba(255, 107, 0, 0.06)',
    },
    transformLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    transformText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#E2E8F0',
        textAlign: 'center',
    },
    matchContainer: {
        marginTop: 24,
        gap: 10,
    },
    matchTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E2E8F0',
        textAlign: 'center',
        marginBottom: 4,
    },
    matchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        gap: 12,
    },

    matchContent: { flex: 1 },
    matchStyle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E2E8F0',
    },
    matchDescription: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
        marginTop: 2,
    },
    feedbackCard: {
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    feedbackText: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonContainer: {
        marginTop: 20,
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
