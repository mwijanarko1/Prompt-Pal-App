import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

const STYLE_OPTIONS = [
    { id: 'sunset', label: 'Sunset Photography', icon: 'partly-sunny-outline' as const, color: '#F97316' },
    { id: 'watercolor', label: 'Watercolor Painting', icon: 'color-palette-outline' as const, color: '#03DAC6' },
    { id: 'cyberpunk', label: 'Cyberpunk Night', icon: 'flash-outline' as const, color: '#BB86FC' },
    { id: 'minimalist', label: 'Minimalist Sketch', icon: 'remove-outline' as const, color: '#F59E0B' },
];

export function Practice2Screen() {
    const { goToNextStep, userPrompt, setSelectedStyle, addXp } =
        useOnboardingStore();
    const [selected, setSelected] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    const basePrompt = userPrompt || 'A beach';

    const handleSelect = (styleId: string) => {
        if (confirmed) return;
        setSelected(styleId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleConfirm = () => {
        if (!selected) return;
        const style = STYLE_OPTIONS.find((s) => s.id === selected);
        if (style) {
            setSelectedStyle(style.label);
            setConfirmed(true);
            addXp(20);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        goToNextStep();
    };

    const selectedStyle = STYLE_OPTIONS.find((s) => s.id === selected);
    const combinedPrompt = selectedStyle
        ? `${basePrompt} in ${selectedStyle.label.toLowerCase()}`
        : basePrompt;

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
                        state={confirmed ? 'celebrating' : 'speaking'}
                        size="sm"
                    />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <Text style={styles.title}>Add Style to Your Prompt</Text>
                </Animated.View>

                {/* Current prompt */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(400)}
                    style={styles.currentPromptCard}
                >
                    <Text style={styles.currentPromptLabel}>Your Current Prompt</Text>
                    <Text style={styles.currentPromptText}>"{basePrompt}"</Text>
                </Animated.View>

                {/* Style options */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.optionsContainer}
                >
                    <Text style={styles.optionsLabel}>Choose a Style</Text>
                    <View style={styles.optionGrid}>
                        {STYLE_OPTIONS.map((style) => (
                            <TouchableOpacity
                                key={style.id}
                                style={[
                                    styles.optionCard,
                                    selected === style.id && {
                                        borderColor: style.color,
                                        backgroundColor: style.color + '12',
                                    },
                                ]}
                                onPress={() => handleSelect(style.id)}
                                activeOpacity={0.8}
                                disabled={confirmed}
                            >
                                <Ionicons name={style.icon} size={26} color={selected === style.id ? style.color : '#64748B'} style={{ marginBottom: 8 }} />
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        selected === style.id && { color: style.color },
                                    ]}
                                >
                                    {style.label}
                                </Text>
                                {selected === style.id && (
                                    <Animated.View entering={ZoomIn.duration(200)} style={styles.checkBadge}>
                                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                    </Animated.View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* Combined prompt preview */}
                {selected && (
                    <Animated.View
                        entering={FadeInUp.duration(400)}
                        style={styles.previewCard}
                    >
                        <Text style={styles.previewLabel}>Your Prompt Becomes</Text>
                        <Text style={styles.previewText}>"{combinedPrompt}"</Text>
                    </Animated.View>
                )}

                {/* Confirm / Continue */}
                <View style={styles.buttonArea}>
                    {!confirmed ? (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                !selected && styles.actionButtonDisabled,
                            ]}
                            onPress={handleConfirm}
                            activeOpacity={0.85}
                            disabled={!selected}
                        >
                            <Text style={styles.actionButtonText}>Apply Style</Text>
                        </TouchableOpacity>
                    ) : (
                        <Animated.View entering={FadeInUp.duration(400)}>
                            <View style={styles.successCard}>
                                <Ionicons name="sparkles" size={20} color="#F59E0B" />
                                <Text style={styles.successText}>
                                    Beautiful! Your prompt now has a clear style.
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={handleContinue}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.continueText}>Continue</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
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
        alignItems: 'center',
        marginTop: 12,
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    currentPromptCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    currentPromptLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    currentPromptText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#E2E8F0',
        fontStyle: 'italic',
    },
    optionsContainer: {
        marginTop: 20,
    },
    optionsLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        textAlign: 'center',
    },
    optionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionCard: {
        width: '48%',
        flexGrow: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        position: 'relative',
    },

    optionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textAlign: 'center',
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22C55E',
        alignItems: 'center',
        justifyContent: 'center',
    },
    previewCard: {
        backgroundColor: 'rgba(255, 107, 0, 0.06)',
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.2)',
    },
    previewLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FF6B00',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    previewText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#E2E8F0',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    buttonArea: {
        marginTop: 24,
    },
    actionButton: {
        backgroundColor: '#4151FF',
        borderRadius: 28,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonDisabled: {
        opacity: 0.4,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
    successCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    successText: {
        color: '#CBD5E1',
        fontSize: 14,
        fontWeight: '600',
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
