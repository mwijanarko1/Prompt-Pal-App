import { View, Text, Image, Alert, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, InputAccessoryView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input, Card, Badge, ProgressBar, ResultModal, Modal } from '@/components/ui';
import { fetchLevelsFromApi, processApiLevelsWithLocalAssets } from '@/features/levels/data';
import { useGameStore, Level, ChallengeType } from '@/features/game/store';
import { useUserProgressStore } from '@/features/user/store';
import { useConvexAI } from '@/hooks/useConvexAI';
import { convexHttpClient } from '@/lib/convex-client';
import { api } from '../../../../convex/_generated/api.js';
import { getAIErrorPresentation } from '@/lib/aiErrors';
import { logger } from '@/lib/logger';
import { NanoAssistant } from '@/lib/nanoAssistant';
import { useUser } from '@clerk/clerk-expo';
import { CodeExecutionView } from '@/features/game/components/CodeExecutionView';
import type { CodeExecutionResult } from '@/features/game/components/CodeExecutionView';
import { CopyAnalysisView } from '@/features/game/components/CopyAnalysisView';
import { PracticeStyleChallenge, type PracticeStyleSection } from '@/features/game/components/PracticeStyleChallenge';
import { HtmlPreview } from '@/features/game/components/HtmlPreview';
import { CopyTargetPreview } from '@/features/game/components/CopyTargetPreview';
import type { CodeTestResult } from '@/lib/scoring/codeScoring';
import type { CopyScoringResult } from '@/lib/scoring/copyScoring';
import { buildQuestHelpContent } from '@/features/game/utils/questHelp';

const { width, height: screenHeight } = Dimensions.get('window');

type UserLevelAttempt = {
    id: string;
    attemptNumber: number;
    score: number;
    feedback: string[];
    keywordsMatched: string[];
    imageUrl?: string;
    code?: string;
    copy?: string;
    testResults?: any[];
    createdAt: number;
};

// Helper function to map level type to moduleId for navigation
const getModuleIdFromLevelType = (levelType: string): string => {
    switch (levelType) {
        case 'image':
            return 'image-generation';
        case 'code':
            return 'coding-logic';
        case 'copywriting':
            return 'copywriting';
        default:
            return 'image-generation'; // fallback
    }
};

const extractCodeFromResponse = (text: string): string => {
    const match = text.match(/```(?:[a-z]+)?\s*([\s\S]*?)\s*```/i);
    return (match?.[1] || text).trim();
};

/** Format starterContext for display in copy brief (llm_judge lessons) */
function formatStarterContext(ctx: Record<string, unknown> | undefined): string {
    if (!ctx || typeof ctx !== 'object') return '';
    return Object.entries(ctx)
        .map(([k, v]) => {
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
            if (Array.isArray(v)) {
                return `${label}:\n${v.map((item) => (typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item))).join('\n')}`;
            }
            if (typeof v === 'object' && v !== null) {
                return `${label}:\n${JSON.stringify(v, null, 2)}`;
            }
            return `${label}: ${String(v)}`;
        })
        .join('\n\n');
}

const normalizeCodeTestResults = (results?: any[]): CodeTestResult[] =>
    (results ?? []).map((result: any, index: number) => ({
        id: result.id || `test-${index + 1}`,
        name: result.name || `Hidden Test ${index + 1}`,
        passed: Boolean(result.passed),
        error: result.error,
        output: result.output,
        expectedOutput: result.expectedOutput,
        actualOutput: result.actualOutput,
        executionTime: result.executionTime || 0,
    }));

export default function QuestScreen() {
    const { id } = useLocalSearchParams(); // This is the Quest ID
    const router = useRouter();
    const { user } = useUser();
    const { generateText, generateImage, evaluateImage, evaluateCodeSubmission, evaluateCopySubmission } = useConvexAI();
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [generatedCode, setGeneratedCode] = useState<string | null>(null);
    const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
    const [codeExecutionResult, setCodeExecutionResult] = useState<CodeExecutionResult | null>(null);
    const [copyScoringResult, setCopyScoringResult] = useState<CopyScoringResult | null>(null);
    const [activeTab, setActiveTab] = useState<'target' | 'attempt'>('target');
    const [showResult, setShowResult] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<string[]>([]);
    const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
    const [attemptHistory, setAttemptHistory] = useState<UserLevelAttempt[]>([]);
    const [level, setLevel] = useState<Level | null>(null);
    const [quest, setQuest] = useState<any>(null);

    // Refs for keyboard scrolling
    const scrollViewRef = useRef<ScrollView>(null);
    const inputRef = useRef<View>(null);
    const scrollYRef = useRef(0);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const visibleHints = useMemo(() => level?.hints ?? [], [level?.hints]);
    const codeVisibleBrief = useMemo(
        () => [level?.moduleTitle, level?.description].filter(Boolean).join('\n\n'),
        [level?.description, level?.moduleTitle]
    );
    const copyVisibleBrief = useMemo(() => {
        const parts = [level?.description].filter((part): part is string => Boolean(part));
        if (level?.briefTitle) parts.unshift(level.briefTitle);
        const ctx = level?.starterContext as Record<string, unknown> | undefined;
        if (ctx && Object.keys(ctx).length > 0) {
            parts.push(formatStarterContext(ctx));
        }
        return parts.join('\n\n');
    }, [level?.briefTitle, level?.description, level?.starterContext]);
    const helpContent = useMemo(
        () => (level ? buildQuestHelpContent(level, visibleHints) : null),
        [level, visibleHints]
    );

    // Hint system state
    const [hints, setHints] = useState<string[]>([]);
    const [isLoadingHint, setIsLoadingHint] = useState(false);
    const [hintCooldown, setHintCooldown] = useState(0);
    const [showHints, setShowHints] = useState(false);
    const [moduleLevels, setModuleLevels] = useState<Level[]>([]);
    const inputAccessoryId = 'promptInputAccessory';

    const progressInfo = useMemo(() => {
        if (!level || moduleLevels.length === 0) return { current: 1, total: 1, percentage: 0 };

        // Find all levels for the current module/type
        const currentModuleId = level.moduleId || getModuleIdFromLevelType(level.type || 'image');
        const relevantLevels = moduleLevels.filter(l =>
            l.moduleId === currentModuleId ||
            l.type === level.type
        );

        // Sort by order
        const sortedLevels = [...relevantLevels].sort((a, b) => (a.order || 0) - (b.order || 0));

        // Find index of current level
        const currentIndex = sortedLevels.findIndex(l => l.id === level.id);
        const current = currentIndex >= 0 ? currentIndex + 1 : 1;
        const total = sortedLevels.length;
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

        return { current, total, percentage };
    }, [level, moduleLevels]);

    const { lives, loseLife, startLevel, completeLevel, syncToBackend } = useGameStore();
    const { updateStreak, addXP, setCurrentQuest } = useUserProgressStore();

    // Helper to determine XP reward for a level
    const getLevelXPReward = useCallback((lvl: Level): number => {
        // Use the level's points field if available, otherwise fallback by difficulty
        if (lvl.points && lvl.points > 0) return lvl.points;
        switch (lvl.difficulty) {
            case 'beginner': return 50;
            case 'intermediate': return 100;
            case 'advanced': return 200;
            default: return 50;
        }
    }, []);

    useEffect(() => {
        const loadQuestAndLevel = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // 1. Get Quest data from Convex
                const apiQuest = await convexHttpClient.query(api.queries.getDailyQuestById, { id: id as string });

                if (!apiQuest) {
                    throw new Error('Quest not found');
                }
                setQuest(apiQuest);

                // 2. Get associated Level data
                const levelId = apiQuest.levelId;
                if (!levelId) {
                    throw new Error('Quest has no associated level');
                }

                const apiLevel = await convexHttpClient.query(api.queries.getLevelById, { id: levelId });

                if (apiLevel) {
                    const processedLevel = {
                        ...processApiLevelsWithLocalAssets([apiLevel as Level])[0],
                        targetImageUrlForEvaluation: typeof apiLevel.targetImageUrl === 'string' ? apiLevel.targetImageUrl : undefined,
                    };

                    setLevel(processedLevel);
                    startLevel(processedLevel.id);
                    // Reset hints
                    NanoAssistant.resetHintsForLevel(processedLevel.id);
                    setHints([]);

                    // 3. Fetch all levels for this module to calculate progress
                    try {
                        const allLevels = await convexHttpClient.query(api.queries.getLevels, { appId: 'prompt-pal' });
                        if (allLevels) {
                            const moduleType = processedLevel.type;
                            const currentModuleId = processedLevel.moduleId || getModuleIdFromLevelType(moduleType || 'image');
                            const relevantLevels = allLevels.filter((l: any) =>
                                l.moduleId === currentModuleId ||
                                l.type === moduleType
                            );
                            setModuleLevels(relevantLevels as Level[]);
                        }
                    } catch (moduleError) {
                        logger.warn('QuestScreen', 'Failed to load module levels', { error: moduleError });
                    }

                    // 4. Fetch attempt history
                    try {
                        const attempts = user?.id
                            ? await convexHttpClient.query(api.queries.getUserLevelAttempts, { levelId })
                            : [];
                        setAttemptHistory(attempts);
                    } catch (attemptsError) {
                        logger.warn('QuestScreen', 'Failed to load attempt history', { error: attemptsError });
                    }
                } else {
                    throw new Error('Associated level not found');
                }
            } catch (error: any) {
                logger.error('QuestScreen', error, { operation: 'loadQuestAndLevel', id });
                setError(error.message || 'Failed to load quest.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            loadQuestAndLevel();
        }
    }, [id, startLevel, user?.id]);

    // Hint cooldown timer
    useEffect(() => {
        const interval = setInterval(() => {
            const { isOnCooldown, remainingMs } = NanoAssistant.getCooldownStatus();
            setHintCooldown(isOnCooldown ? Math.ceil(remainingMs / 1000) : 0);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Keyboard handling - keep input visible and avoid unexpected dismissals
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (event) => {
                const nextKeyboardHeight = event?.endCoordinates?.height ?? 0;
                setKeyboardHeight(nextKeyboardHeight);

                requestAnimationFrame(() => {
                    if (!inputRef.current || !scrollViewRef.current) return;

                    inputRef.current.measureInWindow((_x, y, _width, height) => {
                        const inputBottom = y + height;
                        const keyboardTop = screenHeight - nextKeyboardHeight;
                        const safePadding = 24;

                        if (inputBottom > keyboardTop - safePadding) {
                            const overlap = inputBottom - (keyboardTop - safePadding);
                            scrollViewRef.current?.scrollTo({
                                y: Math.max(0, scrollYRef.current + overlap),
                                animated: true,
                            });
                        }
                    });
                });
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );

        return () => {
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    // Handle getting a hint
    const handleGetHint = useCallback(async () => {
        if (!level || isLoadingHint || hintCooldown > 0) return;

        setIsLoadingHint(true);
        try {
            const moduleType = (level.type || 'image') as ChallengeType;
            const hint = await NanoAssistant.getHint(prompt, moduleType, level as Parameters<typeof NanoAssistant.getHint>[2]);
            setHints(prev => [...prev, hint]);
            setShowHints(true);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Could not get hint. Please try again.';
            Alert.alert('Hint Unavailable', errorMessage);
        } finally {
            setIsLoadingHint(false);
        }
    }, [level, prompt, isLoadingHint, hintCooldown]);

    const openHelpModal = useCallback(() => {
        Keyboard.dismiss();
        setShowHelpModal(true);
    }, []);

    const openReferenceTab = useCallback(() => {
        if (!level) return;

        if (level.type === 'image') {
            setActiveTab('target');
        }

        setShowHelpModal(false);
    }, [level]);

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text className="text-onSurface mt-4 font-black">Loading Challenge…</Text>
            </SafeAreaView>
        );
    }

    if (!level) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center px-6">
                    <Card className="w-full items-center p-8">
                        <Text className="text-error text-xl font-bold mb-4">Level Not Found</Text>
                        <Text className="text-onSurfaceVariant text-center mb-8">
                            We couldn't find challenge "{id}". It may have been removed or moved.
                        </Text>
                        <Button onPress={() => router.back()} variant="primary">Go Back</Button>
                    </Card>
                </View>
            </SafeAreaView>
        );
    }

    const charCount = prompt.length;
    const tokenCount = Math.ceil(charCount / 4); // Rough estimation

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            Alert.alert('Error', 'Please enter a prompt');
            return;
        }
        if (quest?.completed) {
            return; // Already completed today's quest
        }

        setIsGenerating(true);
        try {
            if (level.type === 'image') {
                const generateResult = await generateImage(prompt);
                const generatedImageUrl = generateResult.imageUrl;

                if (!generatedImageUrl) {
                    throw new Error('Failed to generate image: no image URL returned');
                }

                setGeneratedImage(generatedImageUrl);
                setActiveTab('attempt');

                if (!level.targetImageUrlForEvaluation) {
                    throw new Error('No target image URL available for evaluation');
                }

                const evaluationResult = await evaluateImage({
                    taskId: level.id,
                    userImageUrl: generatedImageUrl,
                    expectedImageUrl: level.targetImageUrlForEvaluation,
                    hiddenPromptKeywords: level.hiddenPromptKeywords,
                    style: level.style,
                    userPrompt: prompt,
                });

                const evaluation = evaluationResult.evaluation;
                const score = evaluation.score;
                const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, score, level.passingScore, level.difficulty);
                const finalScore = penaltyDetails.finalScore;

                setLastScore(finalScore);
                setFeedback(evaluation.feedback || []);
                setMatchedKeywords(evaluation.keywordsMatched || []);

                try {
                    if (user?.id) {
                        await convexHttpClient.mutation(api.mutations.saveUserLevelAttempt, {
                            levelId: level.id,
                            score: finalScore,
                            feedback: evaluation.feedback || [],
                            keywordsMatched: evaluation.keywordsMatched || [],
                            imageUrl: generatedImageUrl,
                        });

                        const attempts = await convexHttpClient.query(api.queries.getUserLevelAttempts, {
                            levelId: level.id,
                        });
                        setAttemptHistory(attempts || []);
                    }
                } catch (saveError) {
                    logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
                }

                if (finalScore >= level.passingScore) {
                    let shouldAwardXp = true;
                    if (user?.id && quest) {
                        const result = await convexHttpClient.mutation(api.mutations.completeDailyQuest, {
                            questId: quest.id,
                            score: finalScore,
                        });
                        if (result?.alreadyCompleted) shouldAwardXp = false;
                    }
                    if (user?.id) {
                        const nextAttemptsCount = (attemptHistory?.length ?? 0) + 1;
                        await convexHttpClient.mutation(api.mutations.updateLevelProgress, {
                            appId: "prompt-pal",
                            levelId: level.id,
                            isCompleted: true,
                            bestScore: finalScore,
                            attempts: nextAttemptsCount,
                            completedAt: Date.now(),
                        });
                    }
                    await updateStreak();
                    await completeLevel(level.id);
                    syncToBackend().catch(() => {});
                    if (shouldAwardXp) await addXP(quest?.xpReward || 50);
                    setQuest((q: any) => q ? { ...q, completed: true } : q);
                    if (quest) setCurrentQuest({ ...quest, completed: true });
                    setShowResult(true);
                } else {
                    await loseLife();
                }
            } else if (level.type === 'code') {
                setGeneratedCode(null);
                setCodeExecutionResult(null);

                const starterCode = (level as { starterCode?: string }).starterCode;
                const currentCode = generatedCode || starterCode;
                const codeSystemPrompt = [
                    'You are a coding assistant. The user will give you a prompt to modify or extend the current code.',
                    '',
                    'VISIBLE CHALLENGE:',
                    codeVisibleBrief || level.description || 'Solve the coding challenge described by the player.',
                    '',
                    visibleHints.length > 0 ? `VISIBLE GUIDANCE:\n- ${visibleHints.join('\n- ')}` : '',
                    '',
                    currentCode
                        ? [
                            'CURRENT CODE (modify this according to the user\'s prompt):',
                            '```',
                            currentCode,
                            '```',
                            '',
                        ].join('\n')
                        : '',
                    'Use the player prompt as the implementation direction. Return the complete modified code.',
                    'Return only executable HTML/JavaScript code. Do not include markdown code fences or explanations.',
                ].join('\n');

                const generateResult = await generateText(prompt, codeSystemPrompt);
                const generatedCodeText = extractCodeFromResponse(generateResult.result || '');

                if (!generatedCodeText) {
                    throw new Error('Failed to generate code: no code returned');
                }

                setGeneratedCode(generatedCodeText);

                const evaluation = await evaluateCodeSubmission({
                    levelId: level.id,
                    code: generatedCodeText,
                    userPrompt: prompt,
                    visibleBrief: codeVisibleBrief,
                    visibleHints,
                });

                const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, evaluation.score, level.passingScore, level.difficulty);
                const finalScore = penaltyDetails.finalScore;
                const userPassed = finalScore >= level.passingScore;

                setLastScore(finalScore);
                setFeedback(evaluation.feedback || []);
                const testResults = normalizeCodeTestResults(evaluation.testResults);
                setCodeExecutionResult({
                    code: generatedCodeText,
                    testResults,
                    output: (evaluation.feedback || []).join('\n'),
                    success: userPassed,
                    error: evaluation.testResults?.find((r: any) => !r.passed)?.error,
                    score: finalScore,
                    passingScore: level.passingScore,
                });

                try {
                    if (user?.id) {
                        const passedTestNames = (evaluation.testResults || [])
                            .filter((r: any) => r.passed && r.name)
                            .map((r: any) => r.name)
                            .filter((name: any): name is string => name !== undefined);

                        const sanitizedTestResults = (evaluation.testResults || []).map((r: any) => ({
                            ...r,
                            id: r.id ?? undefined,
                            name: r.name ?? undefined,
                            error: r.error ?? undefined,
                            output: r.output ?? undefined,
                            expectedOutput: r.expectedOutput ?? undefined,
                            actualOutput: r.actualOutput ?? undefined,
                            executionTime: r.executionTime ?? undefined,
                        }));

                        await convexHttpClient.mutation(api.mutations.saveUserLevelAttempt, {
                            levelId: level.id,
                            score: finalScore,
                            feedback: evaluation.feedback || [],
                            keywordsMatched: passedTestNames.length > 0 ? passedTestNames : [],
                            code: generatedCodeText,
                            testResults: sanitizedTestResults,
                        });

                        const attempts = await convexHttpClient.query(api.queries.getUserLevelAttempts, {
                            levelId: level.id,
                        });
                        setAttemptHistory(attempts || []);
                    }
                } catch (saveError) {
                    logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
                }

                if (userPassed) {
                    let shouldAwardXp = true;
                    if (user?.id && quest) {
                        const result = await convexHttpClient.mutation(api.mutations.completeDailyQuest, {
                            questId: quest.id,
                            score: finalScore,
                        });
                        if (result?.alreadyCompleted) shouldAwardXp = false;
                    }
                    if (user?.id) {
                        const nextAttemptsCount = (attemptHistory?.length ?? 0) + 1;
                        await convexHttpClient.mutation(api.mutations.updateLevelProgress, {
                            appId: "prompt-pal",
                            levelId: level.id,
                            isCompleted: true,
                            bestScore: finalScore,
                            attempts: nextAttemptsCount,
                            completedAt: Date.now(),
                        });
                    }
                    await updateStreak();
                    await completeLevel(level.id);
                    syncToBackend().catch(() => {});
                    if (shouldAwardXp) await addXP(quest?.xpReward || 50);
                    setQuest((q: any) => q ? { ...q, completed: true } : q);
                    if (quest) setCurrentQuest({ ...quest, completed: true });
                    setShowResult(true);
                } else {
                    await loseLife();
                }
            } else if (level.type === 'copywriting') {
                const copyGenerationPrompt = [
                    'You are a conversion-focused copywriter.',
                    '',
                    'VISIBLE BRIEF:',
                    copyVisibleBrief || level.description || 'Write the requested marketing asset.',
                    '',
                    visibleHints.length > 0 ? `VISIBLE GUIDANCE:\n- ${visibleHints.join('\n- ')}` : '',
                    '',
                    'Use the player prompt as the strategic direction for the final copy.',
                    'Return only the final copy text, with no markdown or explanation.',
                ].join('\n');

                const generateResult = await generateText(prompt, copyGenerationPrompt);
                const generatedCopyText = generateResult.result || '';

                if (!generatedCopyText) {
                    throw new Error('Failed to generate copy: no copy returned');
                }

                setGeneratedCopy(generatedCopyText);

                const copyScoringResult = await evaluateCopySubmission({
                    levelId: level.id,
                    text: generatedCopyText,
                    userPrompt: prompt,
                    visibleBrief: copyVisibleBrief,
                    visibleHints,
                });

                const penaltyDetails = NanoAssistant.getPenaltyDetails(level.id, copyScoringResult.score, level.passingScore, level.difficulty);
                const finalScore = penaltyDetails.finalScore;

                setLastScore(finalScore);
                setFeedback(copyScoringResult.feedback || []);
                setCopyScoringResult(copyScoringResult);

                try {
                    if (user?.id) {
                        const highMetrics = copyScoringResult.metrics
                            .filter(m => m.value >= 60 && m.label)
                            .map(m => m.label)
                            .filter((label): label is string => label !== undefined);

                        await convexHttpClient.mutation(api.mutations.saveUserLevelAttempt, {
                            levelId: level.id,
                            score: finalScore,
                            feedback: copyScoringResult.feedback || [],
                            keywordsMatched: highMetrics.length > 0 ? highMetrics : [],
                            copy: generatedCopyText,
                        });

                        const attempts = await convexHttpClient.query(api.queries.getUserLevelAttempts, {
                            levelId: level.id,
                        });
                        setAttemptHistory(attempts || []);
                    }
                } catch (saveError) {
                    logger.warn('GameScreen', 'Failed to save attempt', { error: saveError });
                }

                if (finalScore >= level.passingScore) {
                    let shouldAwardXp = true;
                    if (user?.id && quest) {
                        const result = await convexHttpClient.mutation(api.mutations.completeDailyQuest, {
                            questId: quest.id,
                            score: finalScore,
                        });
                        if (result?.alreadyCompleted) shouldAwardXp = false;
                    }
                    if (user?.id) {
                        const nextAttemptsCount = (attemptHistory?.length ?? 0) + 1;
                        await convexHttpClient.mutation(api.mutations.updateLevelProgress, {
                            appId: "prompt-pal",
                            levelId: level.id,
                            isCompleted: true,
                            bestScore: finalScore,
                            attempts: nextAttemptsCount,
                            completedAt: Date.now(),
                        });
                    }
                    await updateStreak();
                    await completeLevel(level.id);
                    syncToBackend().catch(() => {});
                    if (shouldAwardXp) await addXP(quest?.xpReward || 50);
                    setQuest((q: any) => q ? { ...q, completed: true } : q);
                    if (quest) setCurrentQuest({ ...quest, completed: true });
                    setShowResult(true);
                } else {
                    await loseLife();
                }
            }
        } catch (error: any) {
            const aiError = getAIErrorPresentation(error);

            if (aiError.isOperational) {
                logger.warn('GameScreen', aiError.message, { operation: 'handleGenerate', code: aiError.code });
            } else {
                logger.error('GameScreen', error, { operation: 'handleGenerate' });
            }

            Alert.alert(aiError.title, aiError.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const renderHeader = () => (
        <SafeAreaView className="bg-background" edges={['top']}>
            <View className="px-6 py-2">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant">
                        <Text className="text-onSurface text-xl font-bold">←</Text>
                    </TouchableOpacity>

                    <View className="items-center flex-1 mx-4">
                        <Text className="text-secondary text-[10px] font-black uppercase tracking-widest mb-0.5" numberOfLines={1}>
                            DAILY QUEST
                        </Text>
                        <Text className="text-onSurface text-base font-black text-center" numberOfLines={2}>
                            {quest?.title || level?.title}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={openHelpModal}
                        disabled={!helpContent}
                        className={`w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant ${helpContent ? '' : 'opacity-40'}`}
                        accessibilityRole="button"
                        accessibilityLabel="Open challenge help"
                    >
                        <Text className="text-onSurface text-xl font-bold">?</Text>
                    </TouchableOpacity>
                </View>

                {quest?.completed && (
                    <View className="mb-4 py-3 px-4 rounded-2xl bg-success/20 border border-success/30">
                        <Text className="text-success text-center font-bold">You've completed today's quest. Come back tomorrow for a new one.</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );

    const renderImageChallenge = () => {
        const imageUri = activeTab === 'target' ? level.targetImageUrl : (generatedImage || level.targetImageUrl);
        const isLocalAsset = activeTab === 'target' && typeof imageUri === 'number';

        return (
            <View className="px-6 pt-4 pb-6">
                {level.description && (
                    <View className="mb-4">
                        <Text className="text-onSurface text-base font-black leading-6 text-center">
                            {level.description}
                        </Text>
                    </View>
                )}
                <Card className="p-0 overflow-hidden rounded-[40px] border-0" variant="elevated">
                    <View className="aspect-square relative">
                        {imageUri ? (
                            <Image
                                source={isLocalAsset ? imageUri : { uri: imageUri as string }}
                                className="w-full h-full"
                                resizeMode="cover"
                                onError={(error) => {
                                    console.log('Image load error:', error.nativeEvent);
                                }}
                            />
                        ) : (
                            <View className="w-full h-full bg-surfaceVariant items-center justify-center">
                                <Ionicons name="image-outline" size={64} color="#9CA3AF" />
                                <Text className="text-onSurfaceVariant text-center mt-4 font-bold">
                                    {activeTab === 'target' ? 'Target Image Not Available' : 'Your Attempt Will Appear Here'}
                                </Text>
                            </View>
                        )}
                        {activeTab === 'target' && imageUri && (
                            <View className="absolute top-6 right-6">
                                <Badge label="🎯 TARGET" variant="primary" className="bg-primary px-3 py-1.5 rounded-full border-0" />
                            </View>
                        )}
                    </View>

                    <View className="flex-row bg-surfaceVariant/50 p-2 m-4 rounded-full">
                        <TouchableOpacity
                            onPress={() => setActiveTab('target')}
                            className={`flex-1 py-3 rounded-full items-center ${activeTab === 'target' ? 'bg-surface' : ''}`}
                        >
                            <Text className={`font-bold ${activeTab === 'target' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Target Image</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('attempt')}
                            className={`flex-1 py-3 rounded-full items-center ${activeTab === 'attempt' ? 'bg-surface' : ''}`}
                        >
                            <Text className={`font-bold ${activeTab === 'attempt' ? 'text-onSurface' : 'text-onSurfaceVariant'}`}>Your Attempt</Text>
                        </TouchableOpacity>
                    </View>
                </Card>
            </View>
        );
    };

    const renderAttemptHistoryCard = () => {
        if (!level || attemptHistory.length === 0) return null;
        const passingScore = level.passingScore || 75;
        return (
            <View className="mt-4">
                <Card className="p-4 rounded-[24px] border border-outline/30 bg-surfaceVariant/20">
                    <Text className="text-onSurface text-sm font-black mb-3">Attempt History</Text>
                    <View className="space-y-3">
                        {attemptHistory.map((attempt) => (
                            <View key={attempt.id} className="bg-surfaceVariant/30 rounded-lg p-3">
                                <View className="flex-row items-center justify-between mb-2">
                                    <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">
                                        Attempt #{attempt.attemptNumber}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-onSurfaceVariant text-sm mr-2">{attempt.score}%</Text>
                                        <View className={`w-2 h-2 rounded-full ${attempt.score >= passingScore ? 'bg-success' : 'bg-error'}`} />
                                    </View>
                                </View>
                                {attempt.feedback && attempt.feedback.length > 0 && (
                                    <View className="mt-2">
                                        <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest mb-1">Feedback</Text>
                                        {attempt.feedback.map((feedbackItem, index) => (
                                            <View key={index} className="flex-row mb-1">
                                                <Text className="text-onSurfaceVariant text-xs mr-2">•</Text>
                                                <Text className="text-onSurfaceVariant text-xs flex-1">{feedbackItem}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                {attempt.keywordsMatched && attempt.keywordsMatched.length > 0 && level.type === 'image' && (
                                    <View className="mt-2">
                                        <Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest mb-1">Keywords</Text>
                                        <View className="flex-row flex-wrap">
                                            {attempt.keywordsMatched.map((keyword, index) => (
                                                <View key={index} className="bg-surfaceVariant/50 px-2 py-0.5 rounded mr-1 mb-1">
                                                    <Text className="text-onSurfaceVariant text-xs">{keyword}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                {level.type === 'code' && attempt.code && (
                                    <Text className="text-onSurfaceVariant text-xs mt-2" numberOfLines={2}>
                                        {attempt.code?.slice(0, 80)}…
                                    </Text>
                                )}
                                {level.type === 'copywriting' && attempt.copy && (
                                    <Text className="text-onSurfaceVariant text-xs mt-2" numberOfLines={2}>
                                        {attempt.copy?.slice(0, 80)}…
                                    </Text>
                                )}
                                <Text className="text-onSurfaceVariant text-xs mt-2">
                                    {new Date(attempt.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Card>
            </View>
        );
    };

    const renderHintsPanel = () => {
        if (!level || hints.length === 0) return null;

        return (
            <TouchableOpacity
                onPress={() => setShowHints(!showHints)}
                activeOpacity={0.9}
            >
                <Card className={`p-4 rounded-[24px] border border-secondary/30 bg-secondary/5 ${showHints ? '' : 'overflow-hidden'}`}>
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                            <Text className="text-secondary text-sm mr-2">💡</Text>
                            <Text className="text-secondary text-xs font-black uppercase tracking-widest">
                                Hints ({hints.length})
                            </Text>
                        </View>
                        <Text className="text-onSurfaceVariant text-xs">
                            {showHints ? '▲ Hide' : '▼ Show'}
                        </Text>
                    </View>
                    {showHints && (
                        <View className="mt-2">
                            {hints.map((hint, index) => (
                                <View key={index} className="flex-row mb-2">
                                    <Text className="text-secondary text-xs mr-2">{index + 1}.</Text>
                                    <Text className="text-onSurface text-sm flex-1">{hint}</Text>
                                </View>
                            ))}
                            <Text className="text-onSurfaceVariant text-[10px] mt-2 italic">
                                {NanoAssistant.getNextHintPenaltyDescription(level.id, level.difficulty)}
                            </Text>
                        </View>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

    const renderCodeChallenge = () => {
        const missionText = (level as { instruction?: string }).instruction || level.description || 'Write a prompt that guides the model to solve this challenge.';
        const hintsUsed = NanoAssistant.getHintsUsed(level.id);
        const hintsRemaining = NanoAssistant.getHintsRemaining(level.id, level.difficulty);
        const maxHints = NanoAssistant.getMaxHintsPerLevel(level.difficulty);
        const noHintsLeft = hintsRemaining === 0;
        const charCount = prompt.length;

        const starterCode = (level as { starterCode?: string }).starterCode;
        const grading = level as { grading?: { criteria?: { description: string }[] } };
        const requirementItems = grading.grading?.criteria?.map((c) => c.description) ?? [];

        const sections: PracticeStyleSection[] = [
            { title: 'Mission', icon: 'flag-outline', tone: 'neutral' as const, body: missionText },
            ...(requirementItems.length > 0 ? [{
                title: 'Requirements',
                icon: 'checkmark-done-outline',
                tone: 'neutral' as const,
                items: requirementItems,
            }] : []),
            ...(!starterCode && (level as { whatUserSees?: string }).whatUserSees ? [{
                title: 'What You See',
                icon: 'eye-outline',
                tone: 'neutral' as const,
                body: (level as { whatUserSees?: string }).whatUserSees,
            }] : []),
        ];

        return (
            <PracticeStyleChallenge
                title={level.title || 'Code Challenge'}
                subtitle={level.description}
                previewLabel="Target"
                targetPreview={(generatedCode || starterCode) ? <HtmlPreview html={generatedCode || starterCode} height={220} /> : undefined}
                sections={sections}
                promptLabel="Your Prompt"
                prompt={prompt}
                onChangePrompt={setPrompt}
                promptPlaceholder="Describe the behavior, output, and constraints you want from the model..."
                charCount={charCount}
                tokenCount={tokenCount}
                inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryId : undefined}
                hintActionLabel={
                    noHintsLeft ? 'No hints left' : hintCooldown > 0 ? `${hintCooldown}s` : isLoadingHint ? 'Loading…' : hintsUsed === 0 ? 'Need a Hint?' : `Hint (${hintsRemaining}/${maxHints})`
                }
                onPressHint={handleGetHint}
                hintActionDisabled={isLoadingHint || hintCooldown > 0 || noHintsLeft}
                hintPanel={renderHintsPanel()}
                onSubmit={handleGenerate}
                submitLabel="Generate"
                submitIcon="flash-outline"
                submitDisabled={prompt.trim().length === 0 || isGenerating || quest?.completed}
                isSubmitting={isGenerating}
                attemptTitle={generatedCode ? 'Your Attempt' : undefined}
                attemptView={generatedCode ? (
                    <CodeExecutionView
                        code={generatedCode || ''}
                        executionResult={codeExecutionResult}
                        language={level.language || 'javascript'}
                    />
                ) : undefined}
            />
        );
    };

    const renderCopywritingChallenge = () => {
        const missionText = (level as { instruction?: string }).instruction || level.description || 'Write a prompt that steers the model toward stronger copy.';
        const grading = level as { grading?: { criteria?: { description: string }[] } };
        const requirementItems = grading.grading?.criteria?.map((c) => c.description) ?? [];
        const hintsUsed = NanoAssistant.getHintsUsed(level.id);
        const hintsRemaining = NanoAssistant.getHintsRemaining(level.id, level.difficulty);
        const maxHints = NanoAssistant.getMaxHintsPerLevel(level.difficulty);
        const noHintsLeft = hintsRemaining === 0;
        const wordCount = prompt.trim().split(/\s+/).filter(word => word.length > 0).length;
        const charCount = prompt.length;
        const minWords = level.wordLimit?.min ?? 0;
        const maxWords = level.wordLimit?.max ?? 500;
        const wordProgress = level.wordLimit ? Math.min((wordCount / Math.max(maxWords, 1)) * 100, 100) : undefined;
        const isWordOverLimit = level.wordLimit ? wordCount > maxWords : false;
        const isWordUnderLimit = level.wordLimit ? wordCount < minWords : false;

        const ctx = level?.starterContext as Record<string, unknown> | undefined;
        const contextStr = ctx && Object.keys(ctx).length > 0 ? formatStarterContext(ctx) : undefined;

        // Target preview already shows mission + requirements; only add Word Limit to avoid redundancy
        const sections: PracticeStyleSection[] = [
            ...(level.wordLimit ? [{
                title: 'Word Limit',
                icon: 'text-outline',
                tone: 'secondary' as const,
                badge: `${minWords}-${maxWords} words`,
            }] : []),
        ];

        const copyRequirements = level.requiredElements?.length
            ? level.requiredElements
            : requirementItems;

        return (
            <PracticeStyleChallenge
                title={level.title || 'Copywriting Challenge'}
                subtitle={level.description}
                previewLabel="Target"
                targetPreview={
                    <CopyTargetPreview
                        instruction={missionText}
                        criteria={requirementItems}
                        context={contextStr}
                    />
                }
                sections={sections}
                promptLabel="Your Prompt"
                prompt={prompt}
                onChangePrompt={setPrompt}
                promptPlaceholder="Describe the audience, tone, structure, and output you want..."
                charCount={charCount}
                tokenCount={tokenCount}
                wordCountLabel={level.wordLimit ? `${wordCount} / ${minWords}-${maxWords}` : undefined}
                wordProgress={wordProgress}
                wordProgressTone={isWordOverLimit ? 'error' : isWordUnderLimit ? 'warning' : 'success'}
                inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryId : undefined}
                hintActionLabel={
                    noHintsLeft ? 'No hints left' : hintCooldown > 0 ? `${hintCooldown}s` : isLoadingHint ? 'Loading…' : hintsUsed === 0 ? 'Need a Hint?' : `Hint (${hintsRemaining}/${maxHints})`
                }
                onPressHint={handleGetHint}
                hintActionDisabled={isLoadingHint || hintCooldown > 0 || noHintsLeft}
                hintPanel={renderHintsPanel()}
                onSubmit={handleGenerate}
                submitLabel="Generate"
                submitIcon="create-outline"
                submitDisabled={prompt.trim().length === 0 || isGenerating || quest?.completed}
                isSubmitting={isGenerating}
                attemptTitle={generatedCopy ? 'Your Attempt' : undefined}
                attemptView={generatedCopy ? (
                    <CopyAnalysisView
                        copy={generatedCopy || ''}
                        scoringResult={copyScoringResult}
                        requirements={copyRequirements}
                    />
                ) : undefined}
            />
        );
    };

    const renderPromptSection = () => {
        if (level.type !== 'image') {
            return null;
        }

        const hintsUsed = level ? NanoAssistant.getHintsUsed(level.id) : 0;
        const hintsRemaining = level ? NanoAssistant.getHintsRemaining(level.id, level.difficulty) : 0;
        const maxHints = level ? NanoAssistant.getMaxHintsPerLevel(level.difficulty) : 4;
        const noHintsLeft = hintsRemaining === 0;

        return (
            <View className="px-6 pb-8">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-onSurfaceVariant text-xs font-black uppercase tracking-widest">
                        {level.type === 'image' ? 'YOUR PROMPT' : level.type === 'code' ? 'YOUR PROMPT EDITOR' : 'CRAFT YOUR PROMPT'}
                    </Text>
                    <TouchableOpacity
                        onPress={handleGetHint}
                        disabled={isLoadingHint || hintCooldown > 0 || noHintsLeft}
                        className={`flex-row items-center px-3 py-2 rounded-full ${noHintsLeft ? 'bg-surfaceVariant/30' : hintCooldown > 0 ? 'bg-surfaceVariant/50' : 'bg-secondary/20'
                            }`}
                    >
                        {isLoadingHint ? (
                            <ActivityIndicator size="small" color="#4151FF" />
                        ) : (
                            <>
                                <Text className={`text-base mr-1 ${noHintsLeft ? 'opacity-50' : ''}`}>{hintCooldown > 0 ? '⏳' : '🪄'}</Text>
                                <Text className={`text-xs font-bold ${noHintsLeft ? 'text-onSurfaceVariant/50' : hintCooldown > 0 ? 'text-onSurfaceVariant' : 'text-secondary'}`}>
                                    {noHintsLeft ? 'No hints left' : hintCooldown > 0 ? `${hintCooldown}s` : hintsUsed === 0 ? 'Free Hint' : `Hint (${hintsRemaining}/${maxHints})`}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {renderHintsPanel()}

                <View ref={inputRef}>
                    <Card className="p-6 rounded-[32px] border-2 border-primary/30 bg-surfaceVariant/20 mb-4">
                        <Input
                            value={prompt}
                            onChangeText={setPrompt}
                            placeholder={level.type === 'image' ? "Describe the floating islands, the nebula sky..." : "Enter your prompt here..."}
                            multiline
                            className="text-lg text-onSurface min-h-[120px] bg-transparent border-0 p-0 mb-4"
                            inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryId : undefined}
                        />

                        <View className="flex-row items-center">
                            <View className="flex-row">
                                <Badge label={`${charCount} chars`} variant="surface" className="bg-surfaceVariant mr-2 border-0 px-3" />
                                <Badge label={`${tokenCount} tokens`} variant="surface" className="bg-surfaceVariant mr-2 border-0 px-3" />
                                {level.type === 'image' && <Badge label={level.style || ''} variant="primary" className="bg-primary/20 border-0 px-3" />}
                            </View>
                        </View>
                    </Card>
                </View>

                <View className="mt-6">
                    <Button
                        onPress={handleGenerate}
                        loading={isGenerating}
                        disabled={quest?.completed}
                        variant="primary"
                        size="lg"
                        fullWidth
                        className="rounded-full py-5 shadow-glow"
                    >
                        {level.type === 'image' ? 'Generate & Compare' : 'Generate'}
                    </Button>
                </View>

                {/* Evaluation Results */}
                {lastScore !== null && level.type === 'image' && (
                    <View className="mt-4">
                        <Card className="p-4 rounded-[24px] border border-primary/30 bg-primary/5">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-onSurface text-sm font-black">Evaluation Score</Text>
                                <View className="flex-row items-center">
                                    <Text className="text-primary text-xl font-black mr-2">{lastScore}%</Text>
                                    <View className={`w-3 h-3 rounded-full ${lastScore >= level.passingScore ? 'bg-success' : 'bg-error'}`} />
                                </View>
                            </View>

                            {feedback && feedback.length > 0 && (
                                <View className="mt-2">
                                    <Text className="text-onSurface text-xs font-bold uppercase tracking-widest mb-2">Feedback</Text>
                                    {feedback.map((feedbackItem, index) => (
                                        <View key={index} className="flex-row mb-1">
                                            <Text className="text-onSurfaceVariant text-xs mr-2">•</Text>
                                            <Text className="text-onSurface text-sm flex-1">{feedbackItem}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {matchedKeywords && matchedKeywords.length > 0 && (
                                <View className="mt-3">
                                    <Text className="text-onSurface text-xs font-bold uppercase tracking-widest mb-2">Keywords Captured</Text>
                                    <View className="flex-row flex-wrap">
                                        {matchedKeywords.map((keyword, index) => (
                                            <View key={index} className="bg-primary/20 px-2 py-1 rounded-full mr-2 mb-1">
                                                <Text className="text-primary text-xs font-bold">{keyword}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </Card>
                    </View>
                )}

                {/* Attempt History - image uses this section; code/copy use renderAttemptHistoryCard below */}
                {attemptHistory.length > 0 && level.type === 'image' && renderAttemptHistoryCard()}
            </View>
        );
    };

    // Show loading state
    if (isLoading) {
        return (
            <View className="flex-1 bg-background">
                {renderHeader()}
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="text-onSurface mt-4">Loading level...</Text>
                </View>
            </View>
        );
    }

    // Show error state
    if (error) {
        return (
            <View className="flex-1 bg-background">
                {renderHeader()}
                <View className="flex-1 items-center justify-center px-6">
                    <Ionicons name="alert-circle" size={64} color="#ef4444" />
                    <Text className="text-onSurface text-xl font-black mt-4 text-center">
                        Unable to Load Level
                    </Text>
                    <Text className="text-onSurfaceVariant text-center mt-2 mb-6">
                        {error}
                    </Text>
                    <Button
                        onPress={() => {
                            setError(null);
                            setIsLoading(true);
                            // Reload the level
                            const loadLevel = async () => {
                                try {
                                    const apiLevel = await convexHttpClient.query(api.queries.getLevelById, { id: id as string });
                                    if (apiLevel) {
                                        const processedLevel = {
                                            ...processApiLevelsWithLocalAssets([apiLevel as Level])[0],
                                            targetImageUrlForEvaluation: typeof apiLevel.targetImageUrl === 'string' ? apiLevel.targetImageUrl : undefined,
                                        };
                                        setLevel(processedLevel);
                                        startLevel(processedLevel.id);
                                        NanoAssistant.resetHintsForLevel(processedLevel.id);
                                        setHints([]);
                                    }
                                } catch (err) {
                                    logger.error('GameScreen', err, { operation: 'retryLoadLevel', id });
                                    setError('Failed to load level. Please check your connection and try again.');
                                } finally {
                                    setIsLoading(false);
                                }
                            };
                            loadLevel();
                        }}
                        className="mb-4"
                    >
                        Try Again
                    </Button>
                    <Button
                        variant="outline"
                        onPress={() => router.back()}
                    >
                        Go Back
                    </Button>
                </View>
            </View>
        );
    }

    // Show error if level not loaded
    if (!level) {
        return (
            <View className="flex-1 bg-background">
                {renderHeader()}
                <View className="flex-1 items-center justify-center">
                    <Text className="text-onSurface">No level data available</Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-background">
            {renderHeader()}

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
            >
                <ScrollView
                    ref={scrollViewRef}
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="none"
                    onScroll={(event) => {
                        scrollYRef.current = event.nativeEvent.contentOffset.y;
                    }}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 + keyboardHeight }}
                >
                    {level.type === 'image' && renderImageChallenge()}
                    {level.type === 'code' && renderCodeChallenge()}
                    {level.type === 'copywriting' && renderCopywritingChallenge()}

                    {renderPromptSection()}

                    {/* Attempt History for code and copywriting (image shows it inside renderPromptSection) */}
                    {attemptHistory.length > 0 && (level.type === 'code' || level.type === 'copywriting') && (
                        <View className="px-6 py-4">
                            {renderAttemptHistoryCard()}
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>

            {Platform.OS === 'ios' && (
                <InputAccessoryView nativeID={inputAccessoryId}>
                    <View className="px-4 py-2 bg-surface border-t border-outline flex-row justify-end">
                        <TouchableOpacity
                            onPress={Keyboard.dismiss}
                            className="px-4 py-2 rounded-full bg-primary/15"
                        >
                            <Text className="text-primary text-xs font-black uppercase tracking-widest">Done</Text>
                        </TouchableOpacity>
                    </View>
                </InputAccessoryView>
            )}

            {Platform.OS === 'android' && keyboardHeight > 0 && (
                <View
                    className="absolute left-0 right-0 px-4 py-2 bg-surface border-t border-outline flex-row justify-end"
                    style={{ bottom: keyboardHeight }}
                >
                    <TouchableOpacity
                        onPress={Keyboard.dismiss}
                        className="px-4 py-2 rounded-full bg-primary/15"
                    >
                        <Text className="text-primary text-xs font-black uppercase tracking-widest">Done</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ResultModal
                visible={showResult}
                score={lastScore || 0}
                xp={quest?.xpReward || 50}
                moduleType={level.type}
                testCases={codeExecutionResult?.testResults}
                output={codeExecutionResult?.output}
                copyMetrics={copyScoringResult?.metrics}
                imageSimilarity={lastScore || undefined}
                imageFeedback={feedback}
                keywordsMatched={matchedKeywords}
                onNext={() => {
                    setShowResult(false);
                    router.replace('/(tabs)/');
                }}
                onClose={() => setShowResult(false)}
            />

            {helpContent && (
                <Modal
                    visible={showHelpModal}
                    onClose={() => setShowHelpModal(false)}
                    size="md"
                >
                    <View className="rounded-[28px] overflow-hidden bg-surface">
                        <View className="flex-row items-start justify-between mb-5">
                            <View className="flex-1 pr-4">
                                <Text className="text-primary text-[10px] font-black uppercase tracking-[2.5px] mb-2">
                                    {helpContent.eyebrow}
                                </Text>
                                <Text className="text-onSurface text-[30px] font-black tracking-tight">
                                    {helpContent.headline}
                                </Text>
                                <Text className="text-onSurfaceVariant text-sm mt-2 leading-5">
                                    {helpContent.summary}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowHelpModal(false)}
                                className="w-11 h-11 rounded-full bg-surfaceVariant/40 items-center justify-center"
                                accessibilityRole="button"
                                accessibilityLabel="Close challenge help"
                            >
                                <Ionicons name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-row items-center mb-5">
                            <Badge
                                label={`${level.passingScore}% to pass`}
                                variant="primary"
                                className="bg-primary/15 border-0 px-3 py-1 mr-2"
                            />
                            <Badge
                                label={level.difficulty}
                                variant="surface"
                                className="bg-surfaceVariant border-0 px-3 py-1"
                            />
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 8 }}
                        >
                            {helpContent.sections.map((section) => (
                                <View
                                    key={section.title}
                                    className="rounded-[24px] bg-surfaceVariant/25 border border-outline/10 p-4 mb-4"
                                >
                                    <Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-[2px] mb-3">
                                        {section.title}
                                    </Text>
                                    {section.items.map((item, index) => (
                                        <View
                                            key={`${section.title}-${index}`}
                                            className={`flex-row ${index === section.items.length - 1 ? '' : 'mb-2'}`}
                                        >
                                            <Text className="text-primary text-sm mr-2">•</Text>
                                            <Text className="text-onSurface text-sm leading-6 flex-1">{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>

                        <View className="mt-2">
                            <Button
                                onPress={openReferenceTab}
                                variant="outline"
                                fullWidth
                                className="rounded-full py-4"
                            >
                                View {helpContent.referenceLabel}
                            </Button>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}
