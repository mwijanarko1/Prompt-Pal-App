import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

export function Practice1Screen() {
    const { goToNextStep, setUserPrompt, addXp } = useOnboardingStore();
    const [prompt, setPrompt] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);

    const validateSubject = () => {
        const trimmed = prompt.trim();
        if (trimmed.length < 3) {
            setFeedback("Try writing a more descriptive prompt. What do you see?");
            setIsValid(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        // Check for at least one noun-like word (simple heuristic)
        const hasSubject = /\b(beach|ocean|sea|sand|water|wave|sun|sky|palm|tree|shore|coast|island|sunset|cloud|boat|shell|fish|bird|dolphin|surfboard|umbrella|chair|person|people|dog|cat)\b/i.test(trimmed);

        if (!hasSubject && trimmed.length < 8) {
            setFeedback("I don't see a clear subject yet. Try adding a noun like 'beach', 'ocean', or 'palm trees'.");
            setIsValid(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            return;
        }

        setFeedback("Great! You've identified the subject clearly.");
        setIsValid(true);
        setUserPrompt(trimmed);
        addXp(20);
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
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.topSpace} />

                {/* Prompto */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)} style={styles.promptoContainer}>
                    <PromptoCharacter
                        state={isValid ? 'excited' : 'speaking'}
                        size="sm"
                    />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <Text style={styles.title}>Your Turn!</Text>
                    <Text style={styles.subtitle}>
                        Look at this scene and write a prompt{'\n'}with a{' '}
                        <Text style={styles.highlight}>clear subject</Text>
                    </Text>
                </Animated.View>

                {/* Image placeholder (beach scene described) */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.imageContainer}
                >
                    <View style={styles.sceneCard}>
                        <View style={styles.sceneIconWrap}>
                            <Ionicons name="image-outline" size={40} color="#03DAC6" />
                        </View>
                        <Text style={styles.sceneLabel}>Beach Scene</Text>
                        <Text style={styles.sceneDescription}>
                            Imagine a beautiful beach with golden sand, blue ocean waves, and
                            palm trees swaying in the wind.
                        </Text>
                    </View>
                </Animated.View>

                {/* Input */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(700)}
                    style={styles.inputContainer}
                >
                    <Text style={styles.inputLabel}>Your Prompt</Text>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Describe what you see…"
                        placeholderTextColor="#475569"
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                        maxLength={150}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{prompt.length}/150</Text>
                </Animated.View>

                {/* Feedback */}
                {feedback && (
                    <Animated.View
                        entering={FadeInUp.duration(400)}
                        style={[
                            styles.feedbackCard,
                            isValid ? styles.feedbackSuccess : styles.feedbackHint,
                        ]}
                    >
                        <Text style={styles.feedbackText}>{feedback}</Text>
                    </Animated.View>
                )}

                {/* Action buttons */}
                <View style={styles.buttonArea}>
                    {!isValid ? (
                        <TouchableOpacity
                            style={[
                                styles.checkButton,
                                prompt.trim().length < 3 && styles.checkButtonDisabled,
                            ]}
                            onPress={validateSubject}
                            activeOpacity={0.85}
                            disabled={prompt.trim().length < 3}
                        >
                            <Text style={styles.checkButtonText}>Check with Prompto</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.continueText}>Continue</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </OnboardingScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        flexGrow: 1,
    },
    topSpace: { height: 8 },
    promptoContainer: {
        alignItems: 'center',
    },
    titleContainer: {
        alignItems: 'center',
        marginTop: 12,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 8,
        fontWeight: '500',
    },
    highlight: {
        color: '#FF6B00',
        fontWeight: '700',
    },
    imageContainer: {
        marginTop: 20,
        width: '100%',
    },
    sceneCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    sceneIconWrap: {
        marginBottom: 8,
    },
    sceneLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    sceneDescription: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '500',
    },
    inputContainer: {
        marginTop: 20,
        width: '100%',
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
        minHeight: 80,
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
    feedbackCard: {
        width: '100%',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
    },
    feedbackSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    feedbackHint: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    feedbackText: {
        color: '#CBD5E1',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        fontWeight: '500',
    },
    buttonArea: {
        flex: 1,
        justifyContent: 'flex-end',
        marginTop: 24,
        width: '100%',
    },
    checkButton: {
        backgroundColor: '#4151FF',
        borderRadius: 28,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkButtonDisabled: {
        opacity: 0.4,
    },
    checkButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800',
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
