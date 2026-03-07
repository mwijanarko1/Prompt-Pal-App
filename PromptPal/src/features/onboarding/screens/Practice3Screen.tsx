import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

const CONTEXT_OPTIONS = [
    { id: 'sunset', label: 'At sunset', icon: 'sunny-outline' as const },
    { id: 'storm', label: 'With storm clouds', icon: 'thunderstorm-outline' as const },
    { id: 'peaceful', label: 'Feeling peaceful', icon: 'leaf-outline' as const },
    { id: 'drone', label: 'From a drone view', icon: 'camera-outline' as const },
    { id: 'golden', label: 'Golden hour light', icon: 'partly-sunny-outline' as const },
    { id: 'mist', label: 'Morning mist', icon: 'cloud-outline' as const },
];

export function Practice3Screen() {
    const {
        goToNextStep,
        userPrompt,
        selectedStyle,
        selectedContext,
        toggleContext,
        addXp,
    } = useOnboardingStore();
    const [confirmed, setConfirmed] = useState(false);

    const basePrompt = userPrompt || 'A beach';
    const styleText = selectedStyle ? ` in ${selectedStyle.toLowerCase()}` : '';
    const contextText =
        selectedContext.length > 0
            ? `, ${selectedContext.map((c) => {
                const opt = CONTEXT_OPTIONS.find((o) => o.id === c);
                return opt ? opt.label.toLowerCase() : c;
            }).join(', ')}`
            : '';
    const fullPrompt = `${basePrompt}${styleText}${contextText}`;

    const handleToggle = (id: string) => {
        if (confirmed) return;
        toggleContext(id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleConfirm = () => {
        if (selectedContext.length < 2) return;
        setConfirmed(true);
        addXp(25);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                        state={confirmed ? 'celebrating' : 'speaking'}
                        size="sm"
                    />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <Text style={styles.title}>Add Context</Text>
                    <Text style={styles.subtitle}>
                        Select <Text style={styles.highlight}>2–3 elements</Text> to enrich your prompt
                    </Text>
                </Animated.View>

                {/* Current prompt */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(400)}
                    style={styles.currentPromptCard}
                >
                    <Text style={styles.promptLabel}>Your Current Prompt</Text>
                    <Text style={styles.promptText}>
                        "{basePrompt}{styleText}"
                    </Text>
                </Animated.View>

                {/* Context options */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.optionsContainer}
                >
                    <Text style={styles.optionsLabel}>Context Elements</Text>
                    <View style={styles.optionGrid}>
                        {CONTEXT_OPTIONS.map((option) => {
                            const isSelected = selectedContext.includes(option.id);
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionChip,
                                        isSelected && styles.optionChipSelected,
                                    ]}
                                    onPress={() => handleToggle(option.id)}
                                    activeOpacity={0.8}
                                    disabled={confirmed}
                                >
                                    <Ionicons name={option.icon} size={16} color={isSelected ? '#03DAC6' : '#64748B'} />
                                    <Text
                                        style={[
                                            styles.optionLabel,
                                            isSelected && styles.optionLabelSelected,
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                    {isSelected && (
                                        <Animated.View entering={ZoomIn.duration(200)}>
                                            <Ionicons name="checkmark-circle" size={16} color="#03DAC6" />
                                        </Animated.View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Final prompt preview */}
                {selectedContext.length > 0 && (
                    <Animated.View
                        entering={FadeInUp.duration(400)}
                        style={styles.previewCard}
                    >
                        <Text style={styles.previewLabel}>Final Prompt</Text>
                        <Text style={styles.previewText}>"{fullPrompt}"</Text>
                    </Animated.View>
                )}

                {/* Actions */}
                <View style={styles.buttonArea}>
                    {!confirmed ? (
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                selectedContext.length < 2 && styles.actionButtonDisabled,
                            ]}
                            onPress={handleConfirm}
                            activeOpacity={0.85}
                            disabled={selectedContext.length < 2}
                        >
                            <Text style={styles.actionButtonText}>
                                Build Prompt ({selectedContext.length}/2+)
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Animated.View entering={FadeInUp.duration(400)}>
                            <View style={styles.successCard}>
                                <Ionicons name="trophy" size={20} color="#F59E0B" />
                                <Text style={styles.successText}>
                                    All three ingredients mastered! You're a natural!
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={handleContinue}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.continueText}>Start Your First Challenge!</Text>
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
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 6,
        fontWeight: '500',
    },
    highlight: {
        color: '#03DAC6',
        fontWeight: '700',
    },
    currentPromptCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 14,
        marginTop: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    promptLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    promptText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E2E8F0',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    optionsContainer: {
        marginTop: 20,
    },
    optionsLabel: {
        fontSize: 12,
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
        gap: 8,
    },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        gap: 6,
    },
    optionChipSelected: {
        borderColor: '#03DAC6',
        backgroundColor: 'rgba(3, 218, 198, 0.08)',
    },

    optionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
    },
    optionLabelSelected: {
        color: '#E2E8F0',
    },
    previewCard: {
        backgroundColor: 'rgba(3, 218, 198, 0.06)',
        borderRadius: 16,
        padding: 16,
        marginTop: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(3, 218, 198, 0.2)',
    },
    previewLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#03DAC6',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    previewText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E2E8F0',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    buttonArea: {
        marginTop: 24,
    },
    actionButton: {
        backgroundColor: '#03DAC6',
        borderRadius: 28,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionButtonDisabled: {
        opacity: 0.4,
    },
    actionButtonText: {
        color: '#0B1220',
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
        flex: 1,
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
