import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';
import { ONBOARDING_COLORS } from '../theme';
import { delay, evaluatePractice1Prompt } from '../utils/practiceEvaluation';

export function Practice1Screen() {
    const { goToNextStep, addBadge } = useOnboardingStore();
    
    const [localPrompt, setLocalPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStep, setGenerationStep] = useState('');
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ 
        success: boolean; 
        text: string; 
        takeaway?: string;
        nudge?: string;
        score?: number;
    } | null>(null);
    const [showHint, setShowHint] = useState(false);

    const runActualCheck = async () => {
        if (!localPrompt.trim()) return;
        
        setIsGenerating(true);
        setFeedback(null);
        setGeneratedCode(null);
        
        try {
            setGenerationStep('Analyzing your prompt...');
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await delay(350);

            const evaluation = evaluatePractice1Prompt(localPrompt);
            setGeneratedCode(evaluation.code);

            setGenerationStep('Checking behavior & intent...');
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await delay(350);

            setFeedback({
                success: evaluation.success,
                text: evaluation.text,
                nudge: evaluation.nudge,
                takeaway: evaluation.takeaway,
                score: evaluation.score
            });

            if (evaluation.success) {
                addBadge('coding');
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        } catch (error) {
            console.error(error);
            setFeedback({
                success: false,
                text: "The local onboarding check failed. Let's try again!",
                nudge: "Try describing the button, its label, and what should happen when it is clicked."
            });
        } finally {
            setIsGenerating(false);
            setGenerationStep('');
        }
    };

    return (
        <OnboardingScreenWrapper showProgress={true}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.header}>
                            <Text style={styles.title}>Your First Prompt</Text>
                            <Text style={styles.instruction}>Recreate the button below using a prompt.</Text>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.duration(500).delay(400)} style={styles.codeContainer}>
                            <View style={styles.codeHeader}>
                                <Text style={styles.codeTitle}>Target Design</Text>
                                <TouchableOpacity onPress={() => setShowHint(!showHint)}>
                                    <Text style={styles.hintToggle}>{showHint ? 'Hide Hint' : 'Need a Hint?'}</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.targetPreview}>
                                <View style={styles.mockButton}>
                                    <Text style={styles.mockButtonText}>Say Hello</Text>
                                </View>
                                <Text style={styles.behaviorText}>Action: Shows "Hello!" alert when clicked</Text>
                            </View>
                            
                            {showHint && (
                                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.hintBox}>
                                    <Text style={styles.hintText}>
                                        💡 Think about what the button should do, what it says, and what color it is.
                                    </Text>
                                </Animated.View>
                            )}
                        </Animated.View>

                        <Animated.View entering={FadeInUp.duration(500).delay(600)} style={styles.inputSection}>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Describe the button above - include its looks and what it should do..."
                                    placeholderTextColor={ONBOARDING_COLORS.textMuted}
                                    value={localPrompt}
                                    onChangeText={(text) => {
                                        setLocalPrompt(text);
                                        setFeedback(null);
                                        setGeneratedCode(null);
                                    }}
                                    multiline
                                    numberOfLines={3}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    spellCheck={false}
                                    editable={!isGenerating}
                                />
                            </View>

                            {isGenerating && (
                                <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.loadingContainer}>
                                    <ActivityIndicator color={ONBOARDING_COLORS.accent} size="large" />
                                    <Text style={styles.loadingText}>{generationStep}</Text>
                                </Animated.View>
                            )}

                            {generatedCode && !isGenerating && (
                                <Animated.View entering={FadeIn} style={styles.generatedCodeSection}>
                                    <Text style={styles.codeTitle}>Generated Code</Text>
                                    <View style={[styles.codeBox, { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
                                        <Text style={styles.codeText}>{generatedCode}</Text>
                                    </View>
                                </Animated.View>
                            )}

                            {feedback && !isGenerating && (
                                <Animated.View entering={FadeInUp.duration(300)} style={styles.feedbackContainer}>
                                    <View style={styles.feedbackHeader}>
                                        <Ionicons 
                                            name={feedback.success ? "checkmark-circle" : "alert-circle"} 
                                            size={24} 
                                            color={feedback.success ? ONBOARDING_COLORS.success : "#EF4444"} 
                                        />
                                        <Text style={[styles.feedbackText, { color: feedback.success ? ONBOARDING_COLORS.success : "#EF4444" }]}>
                                            {feedback.text}
                                        </Text>
                                    </View>
                                    
                                    {feedback.nudge && !feedback.success && (
                                        <Text style={styles.nudgeText}>{feedback.nudge}</Text>
                                    )}
                                    
                                    {feedback.takeaway && feedback.success && (
                                        <View style={styles.takeawayBox}>
                                            <Text style={styles.takeawayTitle}>Lesson Takeaway:</Text>
                                            <Text style={styles.takeawayText}>{feedback.takeaway}</Text>
                                        </View>
                                    )}
                                </Animated.View>
                            )}
                        </Animated.View>

                        <View style={styles.spacer} />

                        <Animated.View entering={FadeInUp.duration(500).delay(800)} style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.button, 
                                    (localPrompt.trim().length === 0 || isGenerating) && styles.buttonDisabled,
                                    feedback?.success && { backgroundColor: ONBOARDING_COLORS.success }
                                ]}
                                onPress={feedback?.success ? goToNextStep : runActualCheck}
                                disabled={localPrompt.trim().length === 0 || isGenerating}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.buttonText}>
                                    {isGenerating ? 'Analyzing...' : feedback?.success ? 'Great! Continue' : 'Check Prompt'}
                                </Text>
                                {!isGenerating && (
                                    <Ionicons 
                                        name={feedback?.success ? "arrow-forward" : "flash"} 
                                        size={20} 
                                        color="#FFFFFF" 
                                        style={{ marginLeft: 8 }} 
                                    />
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </OnboardingScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 32,
    },
    content: {
        flex: 1,
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: ONBOARDING_COLORS.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    instruction: {
        fontSize: 18,
        color: ONBOARDING_COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '600',
    },
    codeContainer: {
        width: '100%',
        marginBottom: 24,
    },
    codeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    codeTitle: {
        color: ONBOARDING_COLORS.textMuted,
        textTransform: 'uppercase',
        fontWeight: '700',
        fontSize: 12,
        letterSpacing: 1,
        marginBottom: 8,
    },
    hintToggle: {
        color: ONBOARDING_COLORS.accent,
        fontSize: 12,
        fontWeight: '700',
    },
    codeBox: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    codeText: {
        color: ONBOARDING_COLORS.textPrimary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 12,
    },
    targetPreview: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mockButton: {
        backgroundColor: '#FF6B00',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
        shadowColor: '#FF6B00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 12,
    },
    mockButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    behaviorText: {
        color: ONBOARDING_COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
    },
    hintBox: {
        marginTop: 12,
        backgroundColor: 'rgba(255, 107, 0, 0.08)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 0, 0.15)',
    },
    hintText: {
        color: ONBOARDING_COLORS.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    inputSection: {
        width: '100%',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 20,
        color: ONBOARDING_COLORS.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.12)',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 12,
        color: ONBOARDING_COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '600',
    },
    generatedCodeSection: {
        width: '100%',
        marginBottom: 20,
    },
    feedbackContainer: {
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: 16,
        borderRadius: 20,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    feedbackText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        flex: 1,
    },
    nudgeText: {
        fontSize: 14,
        color: ONBOARDING_COLORS.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    takeawayBox: {
        width: '100%',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
        marginTop: 8,
    },
    takeawayTitle: {
        color: ONBOARDING_COLORS.success,
        fontWeight: '800',
        fontSize: 13,
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    takeawayText: {
        color: ONBOARDING_COLORS.textPrimary,
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '600',
    },
    spacer: {
        height: 32,
    },
    buttonContainer: {
        width: '100%',
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
    buttonDisabled: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        shadowOpacity: 0,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
