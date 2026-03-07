import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PromptoCharacter } from '../components/PromptoCharacter';
import { OnboardingScreenWrapper } from '../components/OnboardingScreenWrapper';
import { useOnboardingStore } from '../store';

const QUIZ_OPTIONS = [
    { id: 'A', text: '"Something cool"', isCorrect: false },
    { id: 'B', text: '"A fluffy orange cat"', isCorrect: true },
];

export function Concept1Screen() {
    const { goToNextStep, setConcept1Answer, addBadge, addXp } = useOnboardingStore();
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const handleSelectAnswer = (optionId: string) => {
        if (showResult) return;

        const option = QUIZ_OPTIONS.find((o) => o.id === optionId);
        setSelectedAnswer(optionId);
        setIsCorrect(option?.isCorrect ?? false);
        setConcept1Answer(optionId);
        setShowResult(true);

        if (option?.isCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            addXp(15);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    };

    const handleContinue = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        addBadge('subject-master');
        goToNextStep();
    };

    return (
        <OnboardingScreenWrapper>
            <View style={styles.container}>
                <View style={styles.topSpace} />

                {/* Prompto */}
                <Animated.View entering={FadeInDown.duration(500).delay(200)}>
                    <PromptoCharacter
                        state={showResult && isCorrect ? 'celebrating' : showResult ? 'speaking' : 'pointing'}
                        size="md"
                    />
                </Animated.View>

                {/* Title */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(300)}
                    style={styles.titleContainer}
                >
                    <View style={styles.ingredientBadge}>
                        <Text style={styles.ingredientNumber}>1</Text>
                    </View>
                    <Text style={styles.title}>Subject</Text>
                </Animated.View>

                {/* Explanation */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(500)}
                    style={styles.explanationContainer}
                >
                    <Text style={styles.explanation}>
                        Every prompt needs a <Text style={styles.bold}>clear subject</Text>
                        {'\n'}— what are you creating?
                    </Text>
                </Animated.View>

                {/* Example comparison */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(600)}
                    style={styles.exampleRow}
                >
                    <View style={[styles.exampleCard, styles.badExample]}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                        <Text style={styles.exampleLabel}>Vague</Text>
                        <Text style={styles.exampleText}>"Something"</Text>
                    </View>
                    <View style={[styles.exampleCard, styles.goodExample]}>
                        <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                        <Text style={styles.exampleLabel}>Clear</Text>
                        <Text style={styles.exampleText}>"A cat"</Text>
                    </View>
                </Animated.View>

                {/* Quiz */}
                <Animated.View
                    entering={FadeInUp.duration(500).delay(800)}
                    style={styles.quizContainer}
                >
                    <Text style={styles.quizTitle}>Which prompt has a clear subject?</Text>

                    {QUIZ_OPTIONS.map((option) => {
                        const isSelected = selectedAnswer === option.id;
                        const showCorrectness = showResult && isSelected;

                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionButton,
                                    isSelected && styles.optionSelected,
                                    showCorrectness && option.isCorrect && styles.optionCorrect,
                                    showCorrectness && !option.isCorrect && styles.optionIncorrect,
                                ]}
                                onPress={() => handleSelectAnswer(option.id)}
                                activeOpacity={0.8}
                                disabled={showResult}
                            >
                                <View style={styles.optionLetter}>
                                    <Text style={styles.optionLetterText}>{option.id}</Text>
                                </View>
                                <Text style={styles.optionText}>{option.text}</Text>
                                {showCorrectness && (
                                    <Animated.View entering={ZoomIn.duration(300)}>
                                        <Ionicons
                                            name={option.isCorrect ? 'checkmark-circle' : 'close-circle'}
                                            size={22}
                                            color={option.isCorrect ? '#22C55E' : '#EF4444'}
                                        />
                                    </Animated.View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </Animated.View>

                {/* Feedback */}
                {showResult && (
                    <Animated.View
                        entering={FadeInUp.duration(400)}
                        style={[
                            styles.feedbackCard,
                            isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
                        ]}
                    >
                        <Text style={styles.feedbackText}>
                            {isCorrect
                                ? '"A fluffy orange cat" is a clear, specific subject!'
                                : '"A fluffy orange cat" was the better answer — it tells the AI exactly what to create!'}
                        </Text>
                    </Animated.View>
                )}

                <View style={styles.spacer} />

                {/* Continue button */}
                {showResult && (
                    <Animated.View
                        entering={FadeInUp.duration(500)}
                        style={styles.buttonContainer}
                    >
                        <TouchableOpacity
                            style={styles.continueButton}
                            onPress={handleContinue}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.continueText}>Let's Try It!</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </View>
        </OnboardingScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    topSpace: { flex: 0.02 },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 10,
    },
    ingredientBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FF6B00',
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
    bold: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    exampleRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
        width: '100%',
    },
    exampleCard: {
        flex: 1,
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
    },
    badExample: {
        backgroundColor: 'rgba(239, 68, 68, 0.06)',
        borderColor: 'rgba(239, 68, 68, 0.15)',
    },
    goodExample: {
        backgroundColor: 'rgba(34, 197, 94, 0.06)',
        borderColor: 'rgba(34, 197, 94, 0.15)',
    },
    exampleLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    exampleText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#CBD5E1',
    },
    quizContainer: {
        width: '100%',
        marginTop: 24,
        gap: 10,
    },
    quizTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#E2E8F0',
        textAlign: 'center',
        marginBottom: 6,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        gap: 12,
    },
    optionSelected: {
        borderColor: '#FF6B00',
        backgroundColor: 'rgba(255, 107, 0, 0.06)',
    },
    optionCorrect: {
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
    },
    optionIncorrect: {
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionLetterText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '800',
    },
    optionText: {
        flex: 1,
        color: '#E2E8F0',
        fontSize: 15,
        fontWeight: '600',
    },
    feedbackCard: {
        width: '100%',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
        borderWidth: 1,
    },
    feedbackCorrect: {
        backgroundColor: 'rgba(34, 197, 94, 0.08)',
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    feedbackIncorrect: {
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
    spacer: { flex: 1 },
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
    },
});
