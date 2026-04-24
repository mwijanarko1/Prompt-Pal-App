import {
	View,
	Text,
	Image,
	Alert,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	ActivityIndicator,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	InputAccessoryView,
	type TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Button, Input, Card, Badge, ResultModal } from "@/components/ui";
import {
	fetchLevelsFromApi,
	isDailyQuestLevelId,
	processApiLevelsWithLocalAssets,
} from "@/features/levels/data";
import { useGameStore, Level, ChallengeType } from "@/features/game/store";
import { useUserProgressStore } from "@/features/user/store";
import { useConvexAI } from "@/hooks/useConvexAI";
import { convexHttpClient } from "@/lib/convex-client";
import { api } from "../../../convex/_generated/api.js";
import { getAIErrorPresentation } from "@/lib/aiErrors";
import { logger } from "@/lib/logger";
import { NanoAssistant } from "@/lib/nanoAssistant";
import { useUser } from "@clerk/clerk-expo";
import { CodeExecutionView } from "@/features/game/components/CodeExecutionView";
import type { CodeExecutionResult } from "@/features/game/components/CodeExecutionView";
import { CopyAnalysisView } from "@/features/game/components/CopyAnalysisView";
import {
	PracticeStyleChallenge,
	type PracticeStyleSection,
} from "@/features/game/components/PracticeStyleChallenge";
import { HtmlPreview } from "@/features/game/components/HtmlPreview";
import { CopyTargetPreview } from "@/features/game/components/CopyTargetPreview";
import { BeginnerTemplatePromptInput } from "@/features/game/components/BeginnerTemplatePromptInput";
import {
	findFirstPlaceholderRange,
	HINT_XP_COST,
	PromptScaffoldHelper,
} from "@/features/game/components/PromptScaffold";
import type { CodeTestResult } from "@/lib/scoring/codeScoring";
import type { CopyScoringResult } from "@/lib/scoring/copyScoring";
import { getChecklistMatchResult } from "@/lib/scaffolding/checklistMatching";
import {
	getInitialPromptStateForLevel,
	getLevelChecklistItems,
	getOrdinalMatchedChecklistItemsForBeginnerTemplate,
	isBeginnerTemplateLocked,
} from "@/features/game/utils/scaffold";
import { buildImageEvaluationRequest } from "@/features/game/utils/imageEvaluationRequest";
import {
	logDifficultyLevelUnlocked,
	logFirstLessonStarted,
	logLessonCompleted,
	logLessonFailed,
	logLessonStarted,
	logQuizAnswerSubmitted,
	logTopicCompleted,
} from "@/lib/analytics";

const { height: screenHeight } = Dimensions.get("window");

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
		case "image":
			return "image-generation";
		case "code":
			return "coding-logic";
		case "copywriting":
			return "copywriting";
		default:
			return "image-generation"; // fallback
	}
};

const extractCodeFromResponse = (text: string): string => {
	const match = text.match(/```(?:[a-z]+)?\s*([\s\S]*?)\s*```/i);
	return (match?.[1] || text).trim();
};

/** Format starterContext for display in copy brief (llm_judge lessons) */
function formatStarterContext(
	ctx: Record<string, unknown> | undefined,
): string {
	if (!ctx || typeof ctx !== "object") return "";
	return Object.entries(ctx)
		.map(([k, v]) => {
			const label = k
				.replace(/([A-Z])/g, " $1")
				.replace(/^./, (s) => s.toUpperCase())
				.trim();
			if (Array.isArray(v)) {
				return `${label}:\n${v.map((item) => (typeof item === "object" ? JSON.stringify(item, null, 2) : String(item))).join("\n")}`;
			}
			if (typeof v === "object" && v !== null) {
				return `${label}:\n${JSON.stringify(v, null, 2)}`;
			}
			return `${label}: ${String(v)}`;
		})
		.join("\n\n");
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

export default function GameScreen() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const { user } = useUser();
	const {
		generateText,
		generateImage,
		evaluateImage,
		evaluateCodeSubmission,
		evaluateCopySubmission,
	} = useConvexAI();
	const [prompt, setPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generatedImage, setGeneratedImage] = useState<string | null>(null);
	const [generatedCode, setGeneratedCode] = useState<string | null>(null);
	const [generatedCopy, setGeneratedCopy] = useState<string | null>(null);
	const [codeExecutionResult, setCodeExecutionResult] =
		useState<CodeExecutionResult | null>(null);
	const [copyScoringResult, setCopyScoringResult] =
		useState<CopyScoringResult | null>(null);
	const [activeTab, setActiveTab] = useState<"target" | "attempt">("target");
	const [showResult, setShowResult] = useState(false);
	const [lastScore, setLastScore] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<string[]>([]);
	const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
	const [attemptHistory, setAttemptHistory] = useState<UserLevelAttempt[]>([]);
	const [level, setLevel] = useState<Level | null>(null);
	const [promptSelection, setPromptSelection] = useState<
		{ start: number; end?: number } | undefined
	>(undefined);
	const [beginnerSlotsFilled, setBeginnerSlotsFilled] = useState(true);
	const [beginnerSlotTextForChecklist, setBeginnerSlotTextForChecklist] =
		useState("");
	const [beginnerSlotValues, setBeginnerSlotValues] = useState<string[]>([]);

	// Refs for keyboard scrolling
	const scrollViewRef = useRef<ScrollView>(null);
	const inputRef = useRef<View>(null);
	const promptInputRef = useRef<TextInput>(null);
	const hasEditedPromptRef = useRef(false);
	const shouldJumpToTemplateRef = useRef(false);
	const trackedStartedLevelIdsRef = useRef(new Set<string>());
	const scrollYRef = useRef(0);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const visibleHints = useMemo(() => level?.hints ?? [], [level?.hints]);
	const codeVisibleBrief = useMemo(
		() => [level?.moduleTitle, level?.description].filter(Boolean).join("\n\n"),
		[level?.description, level?.moduleTitle],
	);
	const copyVisibleBrief = useMemo(() => {
		const parts = [level?.description].filter((part): part is string =>
			Boolean(part),
		);
		if (level?.briefTitle) parts.unshift(level.briefTitle);
		const ctx = level?.starterContext as Record<string, unknown> | undefined;
		if (ctx && Object.keys(ctx).length > 0) {
			parts.push(formatStarterContext(ctx));
		}
		return parts.join("\n\n");
	}, [level?.briefTitle, level?.description, level?.starterContext]);

	// Hint system state
	const [hints, setHints] = useState<string[]>([]);
	const [isLoadingHint, setIsLoadingHint] = useState(false);
	const [hintCooldown, setHintCooldown] = useState(0);
	const [showHints, setShowHints] = useState(false);
	const [moduleLevels, setModuleLevels] = useState<Level[]>([]);
	const inputAccessoryId = "promptInputAccessory";

	const { loseLife, startLevel, completeLevel, syncToBackend } = useGameStore();
	const { updateStreak, addXP, spendXP, xp } = useUserProgressStore();

	const checklistItems = useMemo(() => getLevelChecklistItems(level), [level]);
	const beginnerLocked = useMemo(
		() => isBeginnerTemplateLocked(level),
		[level],
	);
	const matchedChecklistItems = useMemo(() => {
		if (beginnerLocked && level?.scaffoldTemplate) {
			const ordinal = getOrdinalMatchedChecklistItemsForBeginnerTemplate(
				level.scaffoldTemplate,
				checklistItems,
				beginnerSlotValues,
			);
			if (ordinal !== null) {
				return ordinal;
			}
		}
		const source = beginnerLocked ? beginnerSlotTextForChecklist : prompt;
		return getChecklistMatchResult(source, checklistItems).matchedItems;
	}, [
		beginnerLocked,
		beginnerSlotTextForChecklist,
		beginnerSlotValues,
		level?.scaffoldTemplate,
		prompt,
		checklistItems,
	]);
	const noHintsLeft = level
		? NanoAssistant.getHintsRemaining(level.id, level.difficulty) === 0
		: false;
	const canAffordHint = xp >= HINT_XP_COST;

	// Helper to determine XP reward for a level
	const getLevelXPReward = useCallback((lvl: Level): number => {
		// Use the level's points field if available, otherwise fallback by difficulty
		if (lvl.points && lvl.points > 0) return lvl.points;
		switch (lvl.difficulty) {
			case "beginner":
				return 50;
			case "intermediate":
				return 100;
			case "advanced":
				return 200;
			default:
				return 50;
		}
	}, []);

	useEffect(() => {
		const loadLevel = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const apiLevel = await convexHttpClient.query(
					api.queries.getLevelById,
					{ id: id as string },
				);

				if (apiLevel) {
					const processedLevel = {
						...processApiLevelsWithLocalAssets([apiLevel as Level])[0],
						targetImageUrlForEvaluation:
							typeof apiLevel.targetImageUrl === "string"
								? apiLevel.targetImageUrl
								: undefined,
					};

					setLevel(processedLevel);
					setBeginnerSlotTextForChecklist("");
					startLevel(processedLevel.id);
					if (!trackedStartedLevelIdsRef.current.has(processedLevel.id)) {
						const moduleId =
							processedLevel.moduleId ||
							getModuleIdFromLevelType(processedLevel.type || "image");
						const lessonBase = {
							lessonId: processedLevel.id,
							lessonType: processedLevel.type || "unknown",
							moduleId,
							topic: processedLevel.moduleTitle,
							difficulty: processedLevel.difficulty,
							isDailyQuest: false,
						};
						trackedStartedLevelIdsRef.current.add(processedLevel.id);
						logLessonStarted(lessonBase);
						if (useGameStore.getState().completedLevels.length === 0) {
							logFirstLessonStarted(lessonBase);
						}
					}
					// Reset hints for this level
					NanoAssistant.resetHintsForLevel(processedLevel.id);
					setHints([]);

					try {
						const apiLevels = await fetchLevelsFromApi();
						const currentModuleId =
							processedLevel.moduleId ||
							getModuleIdFromLevelType(processedLevel.type || "image");
						const expectedType =
							currentModuleId === "image-generation"
								? "image"
								: currentModuleId === "coding-logic"
									? "code"
									: currentModuleId === "copywriting"
										? "copywriting"
										: null;
						const moduleLevelsList =
							apiLevels.length > 0 && expectedType
								? apiLevels.filter(
										(l: Level) =>
											!isDailyQuestLevelId(l.id) &&
											(l.moduleId === currentModuleId ||
												l.type === expectedType),
									)
								: [];

						if (moduleLevelsList.length > 0) {
							setModuleLevels(moduleLevelsList);
						}
					} catch (levelsError) {
						logger.warn(
							"GameScreen",
							"Failed to load all levels for progress",
							{ error: levelsError },
						);
						setModuleLevels([]);
					}

					try {
						const attempts = user?.id
							? await convexHttpClient.query(api.queries.getUserLevelAttempts, {
									levelId: id as string,
								})
							: [];
						setAttemptHistory(attempts);

						// Restore the latest attempt's data based on level type
						if (attempts.length > 0) {
							const latestAttempt = attempts[attempts.length - 1]; // Most recent attempt

							// Restore based on level type
							if (processedLevel.type === "image") {
								if (latestAttempt.imageUrl) {
									setGeneratedImage(latestAttempt.imageUrl);
								}
							} else if (processedLevel.type === "code") {
								if (latestAttempt.code) {
									setGeneratedCode(latestAttempt.code);
								}
								if (latestAttempt.testResults) {
									const testResults = normalizeCodeTestResults(
										latestAttempt.testResults,
									);
									setCodeExecutionResult({
										code: latestAttempt.code || "",
										testResults,
										output: latestAttempt.feedback?.join("\n") || "",
										success:
											(latestAttempt.score || 0) >= processedLevel.passingScore,
										error: testResults.find((result) => !result.passed)?.error,
										score: latestAttempt.score,
										passingScore: processedLevel.passingScore,
									});
								}
							} else if (processedLevel.type === "copywriting") {
								if (latestAttempt.copy) {
									setGeneratedCopy(latestAttempt.copy);
								}
							}

							if (latestAttempt.score) {
								setLastScore(latestAttempt.score);
							}
							if (latestAttempt.feedback && latestAttempt.feedback.length > 0) {
								setFeedback(latestAttempt.feedback);
							}
							if (
								latestAttempt.keywordsMatched &&
								latestAttempt.keywordsMatched.length > 0
							) {
								setMatchedKeywords(latestAttempt.keywordsMatched);
							}
						}
					} catch (attemptsError) {
						// Don't fail level loading if attempt history fails
						logger.warn("GameScreen", "Failed to load attempt history", {
							error: attemptsError,
						});
						setAttemptHistory([]);
					}
				} else {
					throw new Error("Level not found");
				}
			} catch (error: any) {
				logger.error("GameScreen", error, { operation: "loadLevel", id });

				// Determine error message based on error type
				let errorMessage = "Failed to load level. Please try again.";

				if (error.status === 403) {
					errorMessage =
						"This level is locked. Complete previous levels to unlock it.";
				} else if (error.status === 404) {
					errorMessage = "Level not found.";
				} else if (error.status === 401) {
					errorMessage = "Authentication required. Please sign in again.";
				} else if (error.message) {
					errorMessage = error.message;
				}

				setError(errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		if (id) {
			loadLevel();
		}
	}, [id, startLevel, user?.id]);

	useEffect(() => {
		const nextPrompt = getInitialPromptStateForLevel(level);
		setPrompt(nextPrompt);
		setBeginnerSlotTextForChecklist("");
		setBeginnerSlotValues([]);
		setPromptSelection(undefined);
		hasEditedPromptRef.current = false;
		setBeginnerSlotsFilled(!isBeginnerTemplateLocked(level));
		shouldJumpToTemplateRef.current = Boolean(
			level?.scaffoldType === "template" &&
				nextPrompt &&
				!isBeginnerTemplateLocked(level),
		);
	}, [
		level?.id,
		level?.scaffoldType,
		level?.scaffoldTemplate,
		level?.difficulty,
	]);

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
			Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
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
			},
		);

		const keyboardWillHideListener = Keyboard.addListener(
			Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
			() => {
				setKeyboardHeight(0);
			},
		);

		return () => {
			keyboardWillShowListener.remove();
			keyboardWillHideListener.remove();
		};
	}, []);

	const handlePromptChange = useCallback((text: string) => {
		hasEditedPromptRef.current = true;
		setPromptSelection(undefined);
		setPrompt(text);
	}, []);

	const handlePromptFocus = useCallback(() => {
		if (!level || isBeginnerTemplateLocked(level)) {
			return;
		}
		if (
			level.scaffoldType !== "template" ||
			!level.scaffoldTemplate ||
			hasEditedPromptRef.current ||
			prompt !== level.scaffoldTemplate ||
			!shouldJumpToTemplateRef.current
		) {
			return;
		}

		const range = findFirstPlaceholderRange(level.scaffoldTemplate);
		if (!range) return;

		shouldJumpToTemplateRef.current = false;
		requestAnimationFrame(() => {
			setPromptSelection(range);
		});
	}, [level, prompt]);

	const handleBeginnerSlotsFilledChange = useCallback((filled: boolean) => {
		setBeginnerSlotsFilled(filled);
	}, []);

	const handleBeginnerSlotValuesJoined = useCallback((joined: string) => {
		setBeginnerSlotTextForChecklist(joined);
	}, []);

	const handleBeginnerSlotValuesArray = useCallback((values: string[]) => {
		setBeginnerSlotValues(values);
	}, []);

	const handleGetHint = useCallback(async () => {
		if (!level || isLoadingHint || hintCooldown > 0) return;
		if (!canAffordHint) {
			Alert.alert("Not Enough XP", `You need ${HINT_XP_COST} XP to buy a hint.`);
			return;
		}
		if (noHintsLeft) {
			Alert.alert(
				"No Hints Remaining",
				`You've used all ${NanoAssistant.getMaxHintsPerLevel(level.difficulty)} hints for this level.`,
			);
			return;
		}

		setIsLoadingHint(true);
		try {
			const moduleType = (level.type || "image") as ChallengeType;
			const hint = await NanoAssistant.getHint(
				prompt,
				moduleType,
				level as Parameters<typeof NanoAssistant.getHint>[2],
			);
			await spendXP(HINT_XP_COST);
			setHints((prev) => [...prev, hint]);
			setShowHints(true);
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error
					? error.message
					: "Could not get hint. Please try again.";
			Alert.alert("Hint Unavailable", errorMessage);
		} finally {
			setIsLoadingHint(false);
		}
	}, [
		canAffordHint,
		hintCooldown,
		isLoadingHint,
		level,
		noHintsLeft,
		prompt,
		spendXP,
	]);

	const getLessonAnalyticsBase = useCallback(() => {
		if (!level) {
			return null;
		}

		return {
			lessonId: level.id,
			lessonType: level.type || "unknown",
			moduleId: level.moduleId || getModuleIdFromLevelType(level.type || "image"),
			topic: level.moduleTitle,
			difficulty: level.difficulty,
			isDailyQuest: false,
		};
	}, [level]);

	const logCurrentLessonSubmission = useCallback(() => {
		const base = getLessonAnalyticsBase();
		if (!base) {
			return;
		}

		logQuizAnswerSubmitted({
			...base,
			questionId: level?.id ?? base.lessonId,
			answerLength: prompt.trim().length,
			attemptCount: attemptHistory.length + 1,
		});
	}, [attemptHistory.length, getLessonAnalyticsBase, level?.id, prompt]);

	const logCurrentLessonOutcome = useCallback(
		(finalScore: number) => {
			const base = getLessonAnalyticsBase();
			if (!base || !level) {
				return;
			}

			const attemptCount = attemptHistory.length + 1;
			const isPassing = finalScore >= level.passingScore;
			if (isPassing) {
				logLessonCompleted({
					...base,
					score: finalScore,
					passingScore: level.passingScore,
					attemptCount,
					xpEarned: getLevelXPReward(level),
				});

				const completedLevelIds = new Set([
					...useGameStore.getState().completedLevels,
					level.id,
				]);
				if (
					moduleLevels.length > 0 &&
					moduleLevels.every((moduleLevel) =>
						completedLevelIds.has(moduleLevel.id),
					)
				) {
					logTopicCompleted({
						moduleId: base.moduleId,
						topic: base.topic,
						completedLessons: moduleLevels.length,
						totalLessons: moduleLevels.length,
					});
				}

				const sortedModuleLevels = [...moduleLevels].sort(
					(a, b) => (a.order || 0) - (b.order || 0),
				);
				const currentIndex = sortedModuleLevels.findIndex(
					(moduleLevel) => moduleLevel.id === level.id,
				);
				const nextLevel =
					currentIndex >= 0 ? sortedModuleLevels[currentIndex + 1] : undefined;
				if (nextLevel && nextLevel.difficulty !== level.difficulty) {
					logDifficultyLevelUnlocked({
						difficulty: nextLevel.difficulty,
						levelId: nextLevel.id,
						moduleId: base.moduleId,
					});
				}
				return;
			}

			logLessonFailed({
				...base,
				score: finalScore,
				passingScore: level.passingScore,
				attemptCount,
			});
		},
		[
			attemptHistory.length,
			getLessonAnalyticsBase,
			getLevelXPReward,
			level,
			moduleLevels,
		],
	);

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center">
				<ActivityIndicator size="large" color="#FF6B00" />
				<Text className="text-onSurface mt-4 font-black">
					Loading Challenge…
				</Text>
			</SafeAreaView>
		);
	}

	if (!level) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 items-center justify-center px-6">
					<Card className="w-full items-center p-8">
						<Text className="text-error text-xl font-bold mb-4">
							Level Not Found
						</Text>
						<Text className="text-onSurfaceVariant text-center mb-8">
							We couldn't find challenge "{id}". It may have been removed or
							moved.
						</Text>
						<Button onPress={() => router.back()} variant="primary">
							Go Back
						</Button>
					</Card>
				</View>
			</SafeAreaView>
		);
	}

	const charCount = prompt.length;
	const tokenCount = Math.ceil(charCount / 4); // Rough estimation

	const handleGenerate = async () => {
		if (!prompt.trim()) {
			Alert.alert("Error", "Please enter a prompt");
			return;
		}

		logCurrentLessonSubmission();
		setIsGenerating(true);
		try {
			if (level.type === "image") {
				// Step 1: Generate image
				const generateResult = await generateImage(prompt);
				const generatedImageUrl = generateResult.imageUrl;
				const generatedStorageId =
					(generateResult as { storageId?: string }).storageId ?? undefined;

				if (!generatedImageUrl) {
					throw new Error("Failed to generate image: no image URL returned");
				}

				setGeneratedImage(generatedImageUrl);
				setActiveTab("attempt");

				// Step 2: Evaluate the generated image
				if (!level.targetImageUrlForEvaluation) {
					throw new Error("No target image URL available for evaluation");
				}

				const evaluationResult = await evaluateImage(
					buildImageEvaluationRequest({
						levelId: level.id,
						targetImageUrlForEvaluation: level.targetImageUrlForEvaluation,
						hiddenPromptKeywords: level.hiddenPromptKeywords,
						style: level.style,
						prompt,
						generateResult: {
							imageUrl: generatedImageUrl,
							storageId: generatedStorageId,
						},
					}),
				);

				const evaluation = evaluationResult.evaluation;
				const finalScore = evaluation.score;
				logCurrentLessonOutcome(finalScore);

				setLastScore(finalScore);
				setFeedback(evaluation.feedback || []);
				setMatchedKeywords(evaluation.keywordsMatched || []);

				// Save attempt to backend for history
				try {
					if (user?.id) {
						await convexHttpClient.mutation(
							api.mutations.saveUserLevelAttempt,
							{
								levelId: level.id,
								score: finalScore,
								feedback: evaluation.feedback || [],
								keywordsMatched: evaluation.keywordsMatched || [],
								imageUrl: generatedImageUrl,
							},
						);

						// Refresh attempt history to include the new attempt
						const attempts = await convexHttpClient.query(
							api.queries.getUserLevelAttempts,
							{
								levelId: level.id,
							},
						);
						setAttemptHistory(attempts || []);
					}
				} catch (saveError) {
					// Don't fail the evaluation if saving attempt fails
					logger.warn("GameScreen", "Failed to save attempt", {
						error: saveError,
					});
				}

				if (finalScore >= level.passingScore) {
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
					// Award XP for completing the level
					await addXP(getLevelXPReward(level));
					setShowResult(true);
					await completeLevel(level.id);
					syncToBackend().catch(() => {}); // Persist progress immediately
				} else {
					// User didn't pass - lose a life
					await loseLife();

					// Evaluation results are already displayed inline below the button
				}
			} else if (level.type === "code") {
				setGeneratedCode(null);
				setCodeExecutionResult(null);

				const starterCode = (level as { starterCode?: string }).starterCode;
				const currentCode = generatedCode || starterCode;
				const codeSystemPrompt = [
					"You are a coding assistant. The user will give you a prompt to modify or extend the current code.",
					"",
					"VISIBLE CHALLENGE:",
					codeVisibleBrief ||
						level.description ||
						"Solve the coding challenge described by the player.",
					"",
					visibleHints.length > 0
						? `VISIBLE GUIDANCE:\n- ${visibleHints.join("\n- ")}`
						: "",
					"",
					currentCode
						? [
								"CURRENT CODE (modify this according to the user's prompt):",
								"```",
								currentCode,
								"```",
								"",
							].join("\n")
						: "",
					"Use the player prompt as the implementation direction. Return the complete modified code.",
					"Return only executable HTML/JavaScript code. Do not include markdown code fences or explanations.",
				].join("\n");

				const generateResult = await generateText(prompt, codeSystemPrompt);
				const generatedCodeText = extractCodeFromResponse(
					generateResult.result || "",
				);

				if (!generatedCodeText) {
					throw new Error("Failed to generate code: no code returned");
				}

				setGeneratedCode(generatedCodeText);

				const evaluation = await evaluateCodeSubmission({
					levelId: level.id,
					code: generatedCodeText,
					userPrompt: prompt,
					visibleBrief: codeVisibleBrief,
					visibleHints,
				});

				const finalScore = evaluation.score;
				const userPassed = finalScore >= level.passingScore;
				logCurrentLessonOutcome(finalScore);

				setLastScore(finalScore);
				setFeedback(evaluation.feedback || []);
				const testResults = normalizeCodeTestResults(evaluation.testResults);
				setCodeExecutionResult({
					code: generatedCodeText,
					testResults,
					output: (evaluation.feedback || []).join("\n"),
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

						const sanitizedTestResults = (evaluation.testResults || []).map(
							(r: any) => ({
								...r,
								id: r.id ?? undefined,
								name: r.name ?? undefined,
								error: r.error ?? undefined,
								output: r.output ?? undefined,
								expectedOutput: r.expectedOutput ?? undefined,
								actualOutput: r.actualOutput ?? undefined,
								executionTime: r.executionTime ?? undefined,
							}),
						);

						await convexHttpClient.mutation(
							api.mutations.saveUserLevelAttempt,
							{
								levelId: level.id,
								score: finalScore,
								feedback: evaluation.feedback || [],
								keywordsMatched:
									passedTestNames.length > 0 ? passedTestNames : [],
								code: generatedCodeText,
								testResults: sanitizedTestResults,
							},
						);

						const attempts = await convexHttpClient.query(
							api.queries.getUserLevelAttempts,
							{
								levelId: level.id,
							},
						);
						setAttemptHistory(attempts || []);
					}
				} catch (saveError) {
					logger.warn("GameScreen", "Failed to save attempt", {
						error: saveError,
					});
				}

				if (userPassed) {
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
					await addXP(getLevelXPReward(level));
					setShowResult(true);
					await completeLevel(level.id);
					syncToBackend().catch(() => {}); // Persist progress immediately
				} else {
					await loseLife();
				}
			} else if (level.type === "copywriting") {
				// Step 1: Generate copy using AI
				const copyGenerationPrompt = [
					"You are a conversion-focused copywriter.",
					"",
					"VISIBLE BRIEF:",
					copyVisibleBrief ||
						level.description ||
						"Write the requested marketing asset.",
					"",
					visibleHints.length > 0
						? `VISIBLE GUIDANCE:\n- ${visibleHints.join("\n- ")}`
						: "",
					"",
					"Use the player prompt as the strategic direction for the final copy.",
					"Return only the final copy text, with no markdown or explanation.",
				].join("\n");

				const generateResult = await generateText(prompt, copyGenerationPrompt);
				const generatedCopyText = generateResult.result || "";

				if (!generatedCopyText) {
					throw new Error("Failed to generate copy: no copy returned");
				}

				setGeneratedCopy(generatedCopyText);

				// Step 2: Evaluate the generated copy
				const copyScoringResult = await evaluateCopySubmission({
					levelId: level.id,
					text: generatedCopyText,
					userPrompt: prompt,
					visibleBrief: copyVisibleBrief,
					visibleHints,
				});

				const finalScore = copyScoringResult.score;
				logCurrentLessonOutcome(finalScore);

				setLastScore(finalScore);
				setFeedback(copyScoringResult.feedback || []);
				setCopyScoringResult(copyScoringResult);

				// Save attempt to backend for history
				try {
					if (user?.id) {
						const highMetrics = copyScoringResult.metrics
							.filter((m) => m.value >= 60 && m.label)
							.map((m) => m.label)
							.filter((label): label is string => label !== undefined);

						await convexHttpClient.mutation(
							api.mutations.saveUserLevelAttempt,
							{
								levelId: level.id,
								score: finalScore,
								feedback: copyScoringResult.feedback || [],
								keywordsMatched: highMetrics.length > 0 ? highMetrics : [],
								copy: generatedCopyText,
							},
						);

						// Refresh attempt history to include the new attempt
						const attempts = await convexHttpClient.query(
							api.queries.getUserLevelAttempts,
							{
								levelId: level.id,
							},
						);
						setAttemptHistory(attempts || []);
					}
				} catch (saveError) {
					logger.warn("GameScreen", "Failed to save attempt", {
						error: saveError,
					});
				}

				if (finalScore >= level.passingScore) {
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
					// Award XP for completing the level
					await addXP(getLevelXPReward(level));
					setShowResult(true);
					await completeLevel(level.id);
					syncToBackend().catch(() => {}); // Persist progress immediately
				} else {
					await loseLife();
				}
			}
		} catch (error: any) {
			const aiError = getAIErrorPresentation(error);

			if (aiError.isOperational) {
				logger.warn("GameScreen", aiError.message, {
					operation: "handleGenerate",
					code: aiError.code,
				});
			} else {
				logger.error("GameScreen", error, { operation: "handleGenerate" });
			}

			Alert.alert(aiError.title, aiError.message);
		} finally {
			setIsGenerating(false);
		}
	};

	const renderHeader = () => (
		<SafeAreaView className="bg-background" edges={["top"]}>
			<View className="px-6 py-2">
				<View className="flex-row items-center">
					<TouchableOpacity
						onPress={() => {
							if (level) {
								const moduleId = getModuleIdFromLevelType(
									level.type || "image",
								);
								if (router.canGoBack()) {
									router.back();
								} else {
									router.push(`/game/levels/${moduleId}`);
								}
							} else {
								router.back();
							}
						}}
						className="w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant"
					>
						<Text className="text-onSurface text-xl font-bold">←</Text>
					</TouchableOpacity>

					<Text className="text-onSurface text-lg font-black ml-4" numberOfLines={1}>
						{level.title}
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);

	const renderImageChallenge = () => {
		const imageUri =
			activeTab === "target"
				? level.targetImageUrl
				: generatedImage || level.targetImageUrl;
		const resolvedSource =
			typeof imageUri === "number"
				? imageUri
				: typeof imageUri === "string"
					? { uri: imageUri }
					: imageUri && typeof imageUri === "object" && "uri" in imageUri
						? (imageUri as { uri: string; width?: number; height?: number })
						: undefined;

		return (
			<View className="px-6 pt-4 pb-6">
				{level.description && (
					<View className="mb-4">
						<Text className="text-onSurface text-base font-black leading-6 text-center">
							{level.description}
						</Text>
					</View>
				)}
				<Card
					className="p-0 overflow-hidden rounded-[40px] border-0"
					variant="elevated"
				>
					<View className="aspect-square relative">
						{imageUri ? (
							<Image
								source={resolvedSource}
								className="w-full h-full"
								resizeMode="cover"
								onError={() => {}}
							/>
						) : (
							<View className="w-full h-full bg-surfaceVariant items-center justify-center">
								<Ionicons name="image-outline" size={64} color="#9CA3AF" />
								<Text className="text-onSurfaceVariant text-center mt-4 font-bold">
									{activeTab === "target"
										? "Target Image Not Available"
										: "Your Attempt Will Appear Here"}
								</Text>
							</View>
						)}
						{activeTab === "target" && imageUri && (
							<View className="absolute top-6 right-6">
								<Badge
									label="🎯 TARGET"
									variant="primary"
									className="bg-primary px-3 py-1.5 rounded-full border-0"
								/>
							</View>
						)}
					</View>

					<View className="flex-row bg-surfaceVariant/50 p-2 m-4 rounded-full">
						<TouchableOpacity
							onPress={() => setActiveTab("target")}
							className={`flex-1 py-3 rounded-full items-center ${activeTab === "target" ? "bg-surface" : ""}`}
						>
							<Text
								className={`font-bold ${activeTab === "target" ? "text-onSurface" : "text-onSurfaceVariant"}`}
							>
								Target Image
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => setActiveTab("attempt")}
							className={`flex-1 py-3 rounded-full items-center ${activeTab === "attempt" ? "bg-surface" : ""}`}
						>
							<Text
								className={`font-bold ${activeTab === "attempt" ? "text-onSurface" : "text-onSurfaceVariant"}`}
							>
								Your Attempt
							</Text>
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
					<Text className="text-onSurface text-sm font-black mb-3">
						Attempt History
					</Text>
					<View className="space-y-3">
						{attemptHistory.map((attempt) => (
							<View
								key={attempt.id}
								className="bg-surfaceVariant/30 rounded-lg p-3"
							>
								<View className="flex-row items-center justify-between mb-2">
									<Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">
										Attempt #{attempt.attemptNumber}
									</Text>
									<View className="flex-row items-center">
										<Text className="text-onSurfaceVariant text-sm mr-2">
											{attempt.score}%
										</Text>
										<View
											className={`w-2 h-2 rounded-full ${attempt.score >= passingScore ? "bg-success" : "bg-error"}`}
										/>
									</View>
								</View>
								{attempt.feedback && attempt.feedback.length > 0 && (
									<View className="mt-2">
										<Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest mb-1">
											Feedback
										</Text>
										{attempt.feedback.map((feedbackItem, index) => (
											<View key={index} className="flex-row mb-1">
												<Text className="text-onSurfaceVariant text-xs mr-2">
													•
												</Text>
												<Text className="text-onSurfaceVariant text-xs flex-1">
													{feedbackItem}
												</Text>
											</View>
										))}
									</View>
								)}
								{attempt.keywordsMatched &&
									attempt.keywordsMatched.length > 0 &&
									level.type === "image" && (
										<View className="mt-2">
											<Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest mb-1">
												Keywords
											</Text>
											<View className="flex-row flex-wrap">
												{attempt.keywordsMatched.map((keyword, index) => (
													<View
														key={index}
														className="bg-surfaceVariant/50 px-2 py-0.5 rounded mr-1 mb-1"
													>
														<Text className="text-onSurfaceVariant text-xs">
															{keyword}
														</Text>
													</View>
												))}
											</View>
										</View>
									)}
								{level.type === "copywriting" && attempt.copy && (
									<Text
										className="text-onSurfaceVariant text-xs mt-2"
										numberOfLines={2}
									>
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
				<Card
					className={`p-4 rounded-[24px] border border-secondary/30 bg-secondary/5 ${showHints ? "" : "overflow-hidden"}`}
				>
					<View className="flex-row items-center justify-between mb-2">
						<View className="flex-row items-center">
							<Text className="text-secondary text-sm mr-2">💡</Text>
							<Text className="text-secondary text-xs font-black uppercase tracking-widest">
								Hints ({hints.length})
							</Text>
						</View>
						<Text className="text-onSurfaceVariant text-xs">
							{showHints ? "▲ Hide" : "▼ Show"}
						</Text>
					</View>
					{showHints && (
						<View className="mt-2">
							{hints.map((hint, index) => (
								<View key={index} className="flex-row mb-2">
									<Text className="text-secondary text-xs mr-2">
										{index + 1}.
									</Text>
									<Text className="text-onSurface text-sm flex-1">{hint}</Text>
								</View>
							))}
						</View>
					)}
				</Card>
			</TouchableOpacity>
		);
	};

	const getHintActionLabel = (hintsRemaining: number, maxHints: number) => {
		if (noHintsLeft) return "No hints left";
		if (!canAffordHint) return `Need ${HINT_XP_COST} XP`;
		if (hintCooldown > 0) return `${hintCooldown}s`;
		if (isLoadingHint) return "Loading…";
		return `Hint (${HINT_XP_COST} XP • ${hintsRemaining}/${maxHints})`;
	};

	const renderCodeChallenge = () => {
		const missionText =
			(level as { instruction?: string }).instruction ||
			level.description ||
			"Recreate this with your prompt.";
		const hintsRemaining = NanoAssistant.getHintsRemaining(
			level.id,
			level.difficulty,
		);
		const maxHints = NanoAssistant.getMaxHintsPerLevel(level.difficulty);
		const noHintsLeft = hintsRemaining === 0;
		const charCount = prompt.length;

		const starterCode = (level as { starterCode?: string }).starterCode;
		const grading = level as {
			grading?: { criteria?: { description: string }[] };
		};

		const previewHtml = generatedCode ?? starterCode ?? "";

		// Show only Mission under the preview card.
		const sections: PracticeStyleSection[] = [
			{
				title: "Mission",
				icon: "flag-outline",
				tone: "neutral" as const,
				body: missionText,
			},
		];

		return (
			<PracticeStyleChallenge
				title={level.title || "Code Challenge"}
				subtitle={previewHtml ? missionText : undefined}
				previewLabel="Target"
				targetPreview={
					previewHtml ? (
						<HtmlPreview html={previewHtml} height={220} />
					) : undefined
				}
				sections={sections}
				promptLabel="Your Prompt"
				prompt={prompt}
				onChangePrompt={handlePromptChange}
				promptPlaceholder="Describe what you want to build..."
				scaffoldType={level.scaffoldType}
				scaffoldTemplate={level.scaffoldTemplate}
				beginnerTemplateLocked={beginnerLocked}
				onBeginnerTemplateSlotsFilledChange={handleBeginnerSlotsFilledChange}
				onBeginnerSlotValuesJoinedChange={handleBeginnerSlotValuesJoined}
				onBeginnerSlotValuesArrayChange={handleBeginnerSlotValuesArray}
				checklistItems={checklistItems}
				matchedChecklistItems={matchedChecklistItems}
				charCount={charCount}
				tokenCount={tokenCount}
				inputAccessoryViewID={
					Platform.OS === "ios" ? inputAccessoryId : undefined
				}
				inputRef={promptInputRef}
				inputSelection={promptSelection}
				onPromptFocus={handlePromptFocus}
				onPromptSelectionChange={setPromptSelection}
				hintActionLabel={getHintActionLabel(hintsRemaining, maxHints)}
				onPressHint={handleGetHint}
				hintActionDisabled={
					isLoadingHint || hintCooldown > 0 || noHintsLeft || !canAffordHint
				}
				hintPanel={renderHintsPanel()}
				onSubmit={handleGenerate}
				submitLabel="Let's Build It"
				submitIcon="flash-outline"
				submitDisabled={
					prompt.trim().length === 0 ||
					isGenerating ||
					(beginnerLocked && !beginnerSlotsFilled)
				}
				isSubmitting={isGenerating}
			/>
		);
	};

	const renderCopywritingChallenge = () => {
		const missionText =
			(level as { instruction?: string }).instruction ||
			level.description ||
			"Write a prompt that creates compelling copy.";
		const grading = level as {
			grading?: { criteria?: { description: string }[] };
		};
		const requirementItems =
			grading.grading?.criteria?.map((c) => c.description) ?? [];
		const hintsRemaining = NanoAssistant.getHintsRemaining(
			level.id,
			level.difficulty,
		);
		const maxHints = NanoAssistant.getMaxHintsPerLevel(level.difficulty);
		const noHintsLeft = hintsRemaining === 0;
		const wordCount = prompt
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
		const charCount = prompt.length;
		const minWords = level.wordLimit?.min ?? 0;
		const maxWords = level.wordLimit?.max ?? 500;
		const wordProgress = level.wordLimit
			? Math.min((wordCount / Math.max(maxWords, 1)) * 100, 100)
			: undefined;
		const isWordOverLimit = level.wordLimit ? wordCount > maxWords : false;
		const isWordUnderLimit = level.wordLimit ? wordCount < minWords : false;

		const ctx = level?.starterContext as Record<string, unknown> | undefined;
		const contextStr =
			ctx && Object.keys(ctx).length > 0
				? formatStarterContext(ctx)
				: undefined;

		const sections: PracticeStyleSection[] = level.wordLimit
			? [
					{
						title: "Word Limit",
						icon: "text-outline",
						tone: "secondary" as const,
						badge: `${minWords}-${maxWords} words`,
					},
				]
			: [];

		return (
			<PracticeStyleChallenge
				title={level.title || "Copywriting Challenge"}
				subtitle={missionText}
				previewLabel="Brief"
				targetPreview={
					<CopyTargetPreview
						instruction={missionText}
						criteria={requirementItems.slice(0, 3)}
						context={contextStr}
					/>
				}
				sections={sections}
				promptLabel="Your Prompt"
				prompt={prompt}
				onChangePrompt={handlePromptChange}
				promptPlaceholder="Describe the audience and tone you want..."
				scaffoldType={level.scaffoldType}
				scaffoldTemplate={level.scaffoldTemplate}
				beginnerTemplateLocked={beginnerLocked}
				onBeginnerTemplateSlotsFilledChange={handleBeginnerSlotsFilledChange}
				onBeginnerSlotValuesJoinedChange={handleBeginnerSlotValuesJoined}
				onBeginnerSlotValuesArrayChange={handleBeginnerSlotValuesArray}
				checklistItems={checklistItems}
				matchedChecklistItems={matchedChecklistItems}
				charCount={charCount}
				tokenCount={tokenCount}
				wordCountLabel={
					level.wordLimit ? `${wordCount} / ${minWords}-${maxWords}` : undefined
				}
				wordProgress={wordProgress}
				wordProgressTone={
					isWordOverLimit ? "error" : isWordUnderLimit ? "warning" : "success"
				}
				inputAccessoryViewID={
					Platform.OS === "ios" ? inputAccessoryId : undefined
				}
				inputRef={promptInputRef}
				inputSelection={promptSelection}
				onPromptFocus={handlePromptFocus}
				onPromptSelectionChange={setPromptSelection}
				hintActionLabel={getHintActionLabel(hintsRemaining, maxHints)}
				onPressHint={handleGetHint}
				hintActionDisabled={
					isLoadingHint || hintCooldown > 0 || noHintsLeft || !canAffordHint
				}
				hintPanel={renderHintsPanel()}
				onSubmit={handleGenerate}
				submitLabel="Let's Write It"
				submitIcon="create-outline"
				submitDisabled={
					prompt.trim().length === 0 ||
					isGenerating ||
					(beginnerLocked && !beginnerSlotsFilled)
				}
				isSubmitting={isGenerating}
			/>
		);
	};

	const renderPromptSection = () => {
		if (level.type !== "image") {
			return null;
		}

		const hintsRemaining = level
			? NanoAssistant.getHintsRemaining(level.id, level.difficulty)
			: 0;
		const maxHints = level
			? NanoAssistant.getMaxHintsPerLevel(level.difficulty)
			: 4;
		const noHintsLeft = hintsRemaining === 0;

		const charCount = prompt.length;

		return (
			<View className="px-6 pb-8">
				<View className="flex-row justify-between items-center mb-3">
					<Text className="text-onSurfaceVariant text-[11px] font-black uppercase tracking-[2px]">
						Your Turn
					</Text>
					<TouchableOpacity
						onPress={handleGetHint}
						disabled={
							isLoadingHint || hintCooldown > 0 || noHintsLeft || !canAffordHint
						}
						className={`flex-row items-center px-3 py-2 rounded-full ${
							noHintsLeft
								? "bg-surfaceVariant/30"
								: !canAffordHint
									? "bg-surfaceVariant/50"
								: hintCooldown > 0
									? "bg-surfaceVariant/50"
									: "bg-secondary/20"
						}`}
					>
						{isLoadingHint ? (
							<ActivityIndicator size="small" color="#4151FF" />
						) : (
							<>
								<Text
									className={`text-base mr-1 ${noHintsLeft ? "opacity-50" : ""}`}
								>
									{hintCooldown > 0 ? "⏳" : "🪄"}
								</Text>
								<Text
									className={`text-[11px] font-bold ${
										noHintsLeft || !canAffordHint
											? "text-onSurfaceVariant/50"
											: hintCooldown > 0
												? "text-onSurfaceVariant"
												: "text-secondary"
									}`}
								>
									{getHintActionLabel(hintsRemaining, maxHints)}
								</Text>
							</>
						)}
					</TouchableOpacity>
				</View>

				{renderHintsPanel()}

				<View ref={inputRef}>
					<Card className="p-5 rounded-[24px] border border-primary/20 bg-surfaceVariant/15 mb-4">
						<PromptScaffoldHelper
							scaffoldType={level.scaffoldType}
							scaffoldTemplate={level.scaffoldTemplate}
							hideTemplateCard={beginnerLocked}
							checklistItems={checklistItems}
							matchedChecklistItems={matchedChecklistItems}
						/>
						{beginnerLocked && level.scaffoldTemplate ? (
							<BeginnerTemplatePromptInput
								template={level.scaffoldTemplate}
								onChangePrompt={handlePromptChange}
								onSlotValuesJoinedChange={handleBeginnerSlotValuesJoined}
								onSlotValuesArrayChange={handleBeginnerSlotValuesArray}
								onAllSlotsFilledChange={handleBeginnerSlotsFilledChange}
								onPromptFocus={handlePromptFocus}
								inputAccessoryViewID={
									Platform.OS === "ios" ? inputAccessoryId : undefined
								}
								firstInputRef={promptInputRef}
								className="mb-3 min-h-[100px] content-start"
							/>
						) : (
							<Input
								ref={promptInputRef}
								value={prompt}
								onChangeText={handlePromptChange}
								onFocus={handlePromptFocus}
								placeholder="Describe what you see..."
								multiline
								className="text-base text-onSurface min-h-[100px] bg-transparent border-0 p-0 mb-3"
								inputAccessoryViewID={
									Platform.OS === "ios" ? inputAccessoryId : undefined
								}
								selection={promptSelection}
								onSelectionChange={(event) =>
									setPromptSelection(event.nativeEvent.selection)
								}
							/>
						)}

						<View className="flex-row items-center">
							<View className="flex-row">
								<Badge
									label={`${charCount} chars`}
									variant="surface"
									className="bg-surfaceVariant mr-2 border-0 px-2.5"
								/>
								<Badge
									label={`${tokenCount} tokens`}
									variant="surface"
									className="bg-surfaceVariant mr-2 border-0 px-2.5"
								/>
								<Badge
									label={level.style || ""}
									variant="primary"
									className="bg-primary/20 border-0 px-2.5"
								/>
							</View>
						</View>
					</Card>
				</View>

				<View className="mt-4">
					<Button
						onPress={handleGenerate}
						loading={isGenerating}
						disabled={
							prompt.trim().length === 0 ||
							(beginnerLocked && !beginnerSlotsFilled)
						}
						variant="primary"
						size="lg"
						fullWidth
						className="rounded-full py-5"
					>
						<View className="flex-row items-center">
							<Text className="text-onPrimary text-base font-bold mr-2">
								Generate & Compare
							</Text>
							<Ionicons name="sparkles" size={16} color="#FFFFFF" />
						</View>
					</Button>
				</View>

				{/* Evaluation Results */}
				{lastScore !== null && level.type === "image" && (
					<View className="mt-4">
						<Card className="p-4 rounded-[20px] border border-primary/20 bg-primary/5">
							<View className="flex-row items-center justify-between mb-3">
								<Text className="text-onSurface text-sm font-bold">Score</Text>
								<View className="flex-row items-center">
									<Text className="text-primary text-xl font-black mr-2">
										{lastScore}%
									</Text>
									<View
										className={`w-2.5 h-2.5 rounded-full ${lastScore >= level.passingScore ? "bg-success" : "bg-error"}`}
									/>
								</View>
							</View>

							{feedback && feedback.length > 0 && (
								<View className="mt-2">
									<Text className="text-onSurface text-[10px] font-bold uppercase tracking-widest mb-2">
										Feedback
									</Text>
									{feedback.map((feedbackItem, index) => (
										<View key={index} className="flex-row mb-1">
											<Text className="text-onSurfaceVariant text-xs mr-2">
												•
											</Text>
											<Text className="text-onSurface text-sm flex-1">
												{feedbackItem}
											</Text>
										</View>
									))}
								</View>
							)}

							{matchedKeywords && matchedKeywords.length > 0 && (
								<View className="mt-3">
									<Text className="text-onSurface text-[10px] font-bold uppercase tracking-widest mb-2">
										Captured
									</Text>
									<View className="flex-row flex-wrap">
										{matchedKeywords.map((keyword, index) => (
											<View
												key={index}
												className="bg-primary/20 px-2 py-1 rounded-full mr-2 mb-1"
											>
												<Text className="text-primary text-[11px] font-bold">
													{keyword}
												</Text>
											</View>
										))}
									</View>
								</View>
							)}
						</Card>
					</View>
				)}

				{/* Attempt History - shown for image in this section; code/copy use renderAttemptHistory below */}
				{attemptHistory.length > 0 &&
					level.type === "image" &&
					renderAttemptHistoryCard()}
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
									const apiLevel = await convexHttpClient.query(
										api.queries.getLevelById,
										{ id: id as string },
									);
									if (apiLevel) {
										const processedLevel = {
											...processApiLevelsWithLocalAssets([
												apiLevel as Level,
											])[0],
											targetImageUrlForEvaluation:
												typeof apiLevel.targetImageUrl === "string"
													? apiLevel.targetImageUrl
													: undefined,
										};
										setLevel(processedLevel);
										setBeginnerSlotTextForChecklist("");
										startLevel(processedLevel.id);
										NanoAssistant.resetHintsForLevel(processedLevel.id);
										setHints([]);
									}
								} catch (err) {
									logger.error("GameScreen", err, {
										operation: "retryLoadLevel",
										id,
									});
									setError(
										"Failed to load level. Please check your connection and try again.",
									);
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
					<Button variant="outline" onPress={() => router.back()}>
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
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 60}
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
					contentContainerStyle={{
						flexGrow: 1,
						paddingBottom: 120 + keyboardHeight,
					}}
				>
					{level.type === "image" && renderImageChallenge()}
					{level.type === "code" && renderCodeChallenge()}
					{level.type === "copywriting" && renderCopywritingChallenge()}

					{renderPromptSection()}

					{/* Attempt History for code and copywriting (image shows it inside renderPromptSection) */}
					{attemptHistory.length > 0 &&
						(level.type === "code" || level.type === "copywriting") && (
							<View className="px-6 py-4">{renderAttemptHistoryCard()}</View>
						)}
				</ScrollView>
			</KeyboardAvoidingView>

			{Platform.OS === "ios" && (
				<InputAccessoryView nativeID={inputAccessoryId}>
					<View className="px-4 py-2 bg-surface border-t border-outline flex-row justify-end">
						<TouchableOpacity
							onPress={Keyboard.dismiss}
							className="px-4 py-2 rounded-full bg-primary/15"
						>
							<Text className="text-primary text-xs font-black uppercase tracking-widest">
								Done
							</Text>
						</TouchableOpacity>
					</View>
				</InputAccessoryView>
			)}

			{Platform.OS !== "ios" && keyboardHeight > 0 && (
				<View
					className="absolute left-0 right-0 px-4 py-2 bg-surface border-t border-outline flex-row justify-end"
					style={{ bottom: keyboardHeight }}
				>
					<TouchableOpacity
						onPress={Keyboard.dismiss}
						className="px-4 py-2 rounded-full bg-primary/15"
					>
						<Text className="text-primary text-xs font-black uppercase tracking-widest">
							Done
						</Text>
					</TouchableOpacity>
				</View>
			)}

			<ResultModal
				visible={showResult}
				score={lastScore || 0}
				xp={50}
				moduleType={level.type}
				testCases={codeExecutionResult?.testResults}
				output={codeExecutionResult?.output}
				copyMetrics={copyScoringResult?.metrics}
				imageSimilarity={lastScore || undefined}
				imageFeedback={feedback}
				keywordsMatched={matchedKeywords}
				onNext={() => {
					setShowResult(false);
					if (!level) {
						router.replace(`/game/levels/${getModuleIdFromLevelType("image")}`);
						return;
					}
					const moduleId =
						level.moduleId || getModuleIdFromLevelType(level.type || "image");
					const expectedType =
						moduleId === "image-generation"
							? "image"
							: moduleId === "coding-logic"
								? "code"
								: "copywriting";
					const sortedLevels = [...moduleLevels]
						.filter((l) => l.moduleId === moduleId || l.type === expectedType)
						.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
					const idx = sortedLevels.findIndex((l) => l.id === level.id);
					const nextLevel =
						idx >= 0 && idx < sortedLevels.length - 1
							? sortedLevels[idx + 1]
							: null;
					if (nextLevel) {
						router.replace(`/game/${nextLevel.id}`);
					} else {
						router.replace(`/game/levels/${moduleId}`);
					}
				}}
				onClose={() => setShowResult(false)}
			/>
		</View>
	);
}
