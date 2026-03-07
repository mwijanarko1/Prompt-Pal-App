import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

export function ChallengeScreen() {
    const { goToNextStep, setUserPrompt, setScore } = useOnboardingStore();
    const [prompt, setPrompt] = useState('');
    const [validation, setValidation] = useState<{
        hasSubject: boolean;
        hasStyle: boolean;
        hasContext: boolean;
    } | null>(null);

    const validatePrompt = () => {
        const p = prompt.trim().toLowerCase();

        // Subject: mentions the product or brand
        const hasSubject =
            /\b(coffee|café|brand|product|company|drink|beverage|blend|roast|espresso|latte|brew|startup)\b/i.test(p) ||
            p.length > 10;
        // Style: mentions tone, voice, or writing style
        const hasStyle =
            /\b(tone|style|voice|friendly|professional|bold|witty|playful|inspirational|luxury|casual|formal|conversational|persuasive|energetic|warm|minimalist)\b/i.test(p);
        // Context: mentions audience, goal, or setting
        const hasContext =
            /\b(audience|target|customer|users|readers|goal|purpose|campaign|ad|landing page|social media|email|slogan|tagline|millennials|gen z|morning|busy|entrepreneur|students|professionals)\b/i.test(p);

        setValidation({ hasSubject, hasStyle, hasContext });

        if (hasSubject && hasStyle && hasContext) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    };

    const handleGenerate = () => {
        setUserPrompt(prompt.trim());

        // Calculate a mock score based on prompt quality
        const p = prompt.trim().toLowerCase();
        let score = 40; // base
        if (validation?.hasSubject) score += 20;
        if (validation?.hasStyle) score += 20;
        if (validation?.hasContext) score += 15;
        if (p.length > 30) score += 5;
        score = Math.min(score, 98);

        setScore(score);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        goToNextStep();
    };

    const allValid =
        validation?.hasSubject && validation?.hasStyle && validation?.hasContext;

    return (
        <OnboardingScreenWrapper>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.topSpace} />

                {/* Prompto */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.center}>
                    <PromptoCharacter
                        state={allValid ? 'excited' : 'speaking'}
                        size="sm"
                    />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <Text style={styles.title}>Your First Challenge</Text>
                    <Text style={styles.subtitle}>
                        Put all three ingredients together{'\n'}to craft the perfect prompt
                    </Text>
                </Animated.View>

                {/* Target brief */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.targetCard}
                >
                    <View style={styles.targetImageContainer}>
                        <Ionicons name="create-outline" size={48} color="#BB86FC" style={{ marginBottom: 8 }} />
                        <Text style={styles.targetScene}>Copywriting Brief</Text>
                    </View>
                    <Text style={styles.targetHint}>
                        Write a prompt to generate marketing copy{'\n'}for a new coffee brand
                    </Text>
                </Animated.View>

                {/* Checklist */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.checklist}
                >
                    {[
                        {
                            label: 'Subject',
                            hint: 'What product or brand?',
                            valid: validation?.hasSubject,
                            icon: 'cafe-outline' as const,
                        },
                        {
                            label: 'Style',
                            hint: 'What tone or voice?',
                            valid: validation?.hasStyle,
                            icon: 'mic-outline' as const,
                        },
                        {
                            label: 'Context',
                            hint: 'Who is the audience?',
                            valid: validation?.hasContext,
                            icon: 'people-outline' as const,
                        },
                    ].map((item) => (
                        <View key={item.label} style={styles.checkItem}>
                            {validation ? (
                                <Ionicons
                                    name={item.valid ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={20}
                                    color={item.valid ? '#22C55E' : '#475569'}
                                />
                            ) : (
                                <Ionicons name={item.icon} size={20} color="#64748B" />
                            )}
                            <Text
                                style={[
                                    styles.checkLabel,
                                    validation && item.valid && styles.checkLabelValid,
                                ]}
                            >
                                {item.label}
                            </Text>
                            <Text style={styles.checkHint}>{item.hint}</Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Prompt input */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(800)}
                    style={styles.inputContainer}
                >
                    <Text style={styles.inputLabel}>Your Prompt</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Write copy for a bold coffee brand targeting busy professionals…"
                        placeholderTextColor="#475569"
                        value={prompt}
                        onChangeText={(text) => {
                            setPrompt(text);
                            if (validation) setValidation(null);
                        }}
                        multiline
                        maxLength={200}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{prompt.length}/200</Text>
                </Animated.View>

                {/* Tip */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(900)}
                    style={styles.tipCard}
                >
                    <Ionicons name="bulb" size={16} color="#F59E0B" />
                    <Text style={styles.tipText}>
                        Start with the subject, then add style and context!
                    </Text>
                </Animated.View>

                {/* Actions */}
                <View style={styles.buttonArea}>
                    {!allValid ? (
                        <TouchableOpacity
                            style={[
                                styles.checkButton,
                                prompt.trim().length < 5 && styles.buttonDisabled,
                            ]}
                            onPress={validatePrompt}
                            activeOpacity={0.85}
                            disabled={prompt.trim().length < 5}
                        >
                            <Text style={styles.buttonText}>Check My Prompt</Text>
                        </TouchableOpacity>
                    ) : (
                        <Animated.View entering={FadeInUp.duration(400)}>
                            <TouchableOpacity
                                style={styles.generateButton}
                                onPress={handleGenerate}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                                <Text style={styles.generateText}>Generate My Creation</Text>
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
        lineHeight: 20,
        marginTop: 6,
        fontWeight: '500',
    },
    targetCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    targetImageContainer: {
        backgroundColor: 'rgba(187, 134, 252, 0.08)',
        padding: 24,
        alignItems: 'center',
    },

    targetScene: {
        fontSize: 14,
        fontWeight: '700',
        color: '#BB86FC',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    targetHint: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        padding: 12,
        fontWeight: '500',
    },
    checklist: {
        marginTop: 16,
        gap: 8,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
    },

    checkLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#94A3B8',
        minWidth: 70,
    },
    checkLabelValid: {
        color: '#22C55E',
    },
    checkHint: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
    },
    inputContainer: {
        marginTop: 16,
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
        marginLeft: 4,
    },
    textInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 16,
        padding: 16,
        color: '#E2E8F0',
        fontSize: 16,
        fontWeight: '500',
        minHeight: 100,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    charCount: {
        fontSize: 11,
        color: '#475569',
        textAlign: 'right',
        marginTop: 4,
        fontWeight: '600',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.15)',
    },
    tipText: {
        fontSize: 13,
        color: '#CBD5E1',
        fontWeight: '500',
        flex: 1,
    },
    buttonArea: {
        marginTop: 20,
    },
    checkButton: {
        backgroundColor: '#4151FF',
        borderRadius: 28,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonDisabled: {
        opacity: 0.4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
    generateButton: {
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
    generateText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
    },
});
