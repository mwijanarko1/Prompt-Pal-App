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
	TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
	Button,
	Card,
	Badge,
	ResultModal,
	Modal,
} from "@/components/ui";
import { processApiLevelsWithLocalAssets } from "@/features/levels/data";
import { useGameStore, Level, ChallengeType } from "@/features/game/store";
import { useUserProgressStore } from "@/features/user/store";
import { useConvexAI } from "@/hooks/useConvexAI";
import { convexHttpClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api.js";
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
import { buildQuestHelpContent } from "@/features/game/utils/questHelp";
import { getChecklistMatchResult } from "@/lib/scaffolding/checklistMatching";
import {
	getInitialPromptStateForLevel,
	getLevelChecklistItems,
	isBeginnerTemplateLocked,
} from "@/features/game/utils/scaffold";

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

export default function QuestScreen() {
	const { id } = useLocalSearchParams(); // This is the Quest ID
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
	const [showHelpModal, setShowHelpModal] = useState(false);
	const [lastScore, setLastScore] = useState<number | null>(null);
	const [feedback, setFeedback] = useState<string[]>([]);
	const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
	const [attemptHistory, setAttemptHistory] = useState<UserLevelAttempt[]>([]);
	const [level, setLevel] = useState<Level | null>({
		id: "mock_level_1",
		title: "Master the Identity Prompt",
		description: "Learn how to craft a persona that guides the model's tone and behavior.",
		type: "code",
		difficulty: "beginner",
		passingScore: 70,
		unlocked: true,
		order: 1,
		points: 250,
		starterCode: "<html>\n  <body>\n    <h1 class=\"text-2xl font-bold\">Hello World</h1>\n  </body>\n</html>",
	});
	const [quest, setQuest] = useState<any>({
		id: "mock_quest_1",
		title: "Identity Master",
		xpReward: 250,
		completed: false
	});
	const [promptSelection, setPromptSelection] = useState<
		{ start: number; end?: number } | undefined
	>(undefined);
	const [beginnerSlotsFilled, setBeginnerSlotsFilled] = useState(true);

	// Refs for keyboard scrolling
	const scrollViewRef = useRef<ScrollView>(null);
	const inputRef = useRef<View>(null);
	const promptInputRef = useRef<TextInput>(null);
	const hasEditedPromptRef = useRef(false);
	const shouldJumpToTemplateRef = useRef(false);
	const scrollYRef = useRef(0);
	const [keyboardHeight, setKeyboardHeight] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
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
	const helpContent = useMemo(
		() => (level ? buildQuestHelpContent(level, visibleHints) : null),
		[level, visibleHints],
	);

	// Hint system state
	const [hints, setHints] = useState<string[]>([]);
	const [isLoadingHint, setIsLoadingHint] = useState(false);
	const [hintCooldown, setHintCooldown] = useState(0);
	const [showHints, setShowHints] = useState(false);
	const [moduleLevels, setModuleLevels] = useState<Level[]>([]);
	const inputAccessoryId = "promptInputAccessory";

	const { loseLife, startLevel, completeLevel, syncToBackend, lives: livesAvailable } = useGameStore();
	const { updateStreak, addXP, spendXP, setCurrentQuest, xp } =
		useUserProgressStore();

	const checklistItems = useMemo(() => (level ? getLevelChecklistItems(level) : []), [level]);
	const beginnerLocked = useMemo(
		() => (level ? isBeginnerTemplateLocked(level) : false),
		[level],
	);
	const matchedChecklistItems = useMemo(
		() => (level && prompt ? getChecklistMatchResult(prompt, checklistItems).matchedItems : []),
		[prompt, checklistItems, level],
	);
	
	const noHintsLeft = useMemo(() => {
		if (!level || !level.id) return false;
		try {
			return NanoAssistant.getHintsRemaining(level.id, level.difficulty) === 0;
		} catch (e) {
			return false;
		}
	}, [level]);

	const canAffordHint = (xp || 0) >= HINT_XP_COST;

	// Helper to determine XP reward for a level

	useEffect(() => {
		const loadQuestAndLevel = async () => {
			setIsLoading(true);
			setError(null);

			try {
				// 1. Get Quest data from Convex
				const apiQuest = await convexHttpClient.query(
					api.queries.getDailyQuestById,
					{ id: id as string },
				);

				if (!apiQuest) {
					throw new Error("Quest not found");
				}
				setQuest(apiQuest);

				// 2. Get associated Level data
				const levelId = apiQuest.levelId;
				if (!levelId) {
					throw new Error("Quest has no associated level");
				}

				const apiLevel = await convexHttpClient.query(
					api.queries.getLevelById,
					{ id: levelId },
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
					startLevel(processedLevel.id);
					// Reset hints
					NanoAssistant.resetHintsForLevel(processedLevel.id);
					setHints([]);
				} else {
					throw new Error("Associated level not found");
				}
			} catch (error: any) {
				logger.warn("QuestScreen", "Using static/mock data for demo", {
					operation: "loadQuestAndLevel",
					id,
				});
				
				// FALLBACK TO STATIC DATA FOR DEMO
				const staticLevel: Level = {
					id: "mock_level_1",
					title: "Master the Identity Prompt",
					description: "Learn how to craft a persona that guides the model's tone and behavior.",
					type: "code",
					difficulty: "beginner",
					passingScore: 70,
					unlocked: true,
					order: 1,
					points: 250,
					starterCode: "<html>\n  <body>\n    <h1 class=\"text-2xl font-bold\">Hello World</h1>\n  </body>\n</html>",
				};
				
				const staticQuest = {
					id: "mock_quest_1",
					title: "Identity Master",
					xpReward: 250,
					completed: false
				};

				setQuest(staticQuest);
				setLevel(staticLevel);
				setError(null); // Clear error to show the UI
			} finally {
				setIsLoading(false);
			}
		};

		if (id) {
			loadQuestAndLevel();
		}
	}, [id, startLevel, user?.id]);

	useEffect(() => {
		const nextPrompt = getInitialPromptStateForLevel(level);
		setPrompt(nextPrompt);
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

	const openReferenceTab = useCallback(() => {
		if (!level) return;

		if (level.type === "image") {
			setActiveTab("target");
		}

		setShowHelpModal(false);
	}, [level]);

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
		if (quest?.completed) {
			return; // Already completed today's quest
		}

		setIsGenerating(true);
		try {
			if (level.type === "image") {
				const generateResult = await generateImage(prompt);
				const generatedImageUrl = generateResult.imageUrl;

				if (!generatedImageUrl) {
					throw new Error("Failed to generate image: no image URL returned");
				}

				setGeneratedImage(generatedImageUrl);
				setActiveTab("attempt");

				if (!level.targetImageUrlForEvaluation) {
					throw new Error("No target image URL available for evaluation");
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
				const finalScore = evaluation.score;

				setLastScore(finalScore);
				setFeedback(evaluation.feedback || []);
				setMatchedKeywords(evaluation.keywordsMatched || []);

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
					let shouldAwardXp = true;
					if (user?.id && quest) {
						const result = await convexHttpClient.mutation(
							api.mutations.completeDailyQuest,
							{
								questId: quest.id,
								score: finalScore,
							},
						);
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
					setQuest((q: any) => (q ? { ...q, completed: true } : q));
					if (quest) setCurrentQuest({ ...quest, completed: true });
					setShowResult(true);
				} else {
					await loseLife();
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
					let shouldAwardXp = true;
					if (user?.id && quest) {
						const result = await convexHttpClient.mutation(
							api.mutations.completeDailyQuest,
							{
								questId: quest.id,
								score: finalScore,
							},
						);
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
					setQuest((q: any) => (q ? { ...q, completed: true } : q));
					if (quest) setCurrentQuest({ ...quest, completed: true });
					setShowResult(true);
				} else {
					await loseLife();
				}
			} else if (level.type === "copywriting") {
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

				const copyScoringResult = await evaluateCopySubmission({
					levelId: level.id,
					text: generatedCopyText,
					userPrompt: prompt,
					visibleBrief: copyVisibleBrief,
					visibleHints,
				});

				const finalScore = copyScoringResult.score;

				setLastScore(finalScore);
				setFeedback(copyScoringResult.feedback || []);
				setCopyScoringResult(copyScoringResult);

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
					let shouldAwardXp = true;
					if (user?.id && quest) {
						const result = await convexHttpClient.mutation(
							api.mutations.completeDailyQuest,
							{
								questId: quest.id,
								score: finalScore,
							},
						);
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
					setQuest((q: any) => (q ? { ...q, completed: true } : q));
					if (quest) setCurrentQuest({ ...quest, completed: true });
					setShowResult(true);
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

	const renderNewHeader = () => {
		const totalLives = 3;
		
		// Simple progress calculation (can be refined based on module levels)
		const progress = 70; // Hardcoded for now, or calculate if needed

		return (
			<SafeAreaView className="bg-white" edges={["top"]}>
				<View className="px-6 py-4 flex-row items-center justify-between">
					<TouchableOpacity onPress={() => router.back()} className="mr-4">
						<Ionicons name="chevron-back" size={28} color="#000" />
					</TouchableOpacity>
					
					{/* Progress Bar Container */}
					<View className="flex-1 h-3 bg-surfaceVariant/30 rounded-full overflow-hidden mr-4">
						<View 
							style={{ width: `${progress}%` }} 
							className="h-full bg-success rounded-full" 
						/>
					</View>

					{/* Hearts Container */}
					<View className="flex-row gap-1">
						{[...Array(totalLives)].map((_, i) => (
							<Ionicons 
								key={i} 
								name="heart" 
								size={24} 
								color={i < livesAvailable ? "#FF9600" : "#E5E5E5"} 
							/>
						))}
					</View>
				</View>
			</SafeAreaView>
		);
	};

	const renderBadge = () => {
		const category = level?.type?.toUpperCase() || "CODING";
		const levelNum = level?.order || 1;
		return (
			<View className="px-6 items-center mt-2 mb-4">
				<View className="bg-[#EAF8E1] px-4 py-1.5 rounded-full flex-row items-center">
					<Text className="text-[#58CC02] text-xs font-black tracking-widest">
						LEVEL {levelNum}  •  {category}
					</Text>
				</View>
			</View>
		);
	};

	const renderFooter = () => (
		<View className="bg-white border-t border-outline/10 px-6 py-6 pb-10 flex-row items-center justify-between">
			<View>
				<Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-1">
					REWARD
				</Text>
				<View className="flex-row items-center">
					<Text className="text-[#FF9600] text-xl font-black">+{quest?.xpReward || 250} XP</Text>
					<Text className="text-[#FF9600] text-xl ml-1">⚡</Text>
				</View>
			</View>
			<TouchableOpacity
				onPress={handleGenerate}
				disabled={isGenerating || quest?.completed || (beginnerLocked && !beginnerSlotsFilled)}
				className={`flex-row items-center px-8 py-4 rounded-2xl ${
					isGenerating ? "bg-success/50" : "bg-success shadow-sm"
				}`}
			>
				<Text className="text-white text-base font-black uppercase tracking-widest mr-2">
					{isGenerating ? "SUBMITTING..." : "SUBMIT PROMPT"}
				</Text>
				{!isGenerating && <Ionicons name="chevron-forward" size={20} color="white" />}
			</TouchableOpacity>
		</View>
	);

	const renderNewUI = () => (
		<View className="flex-1 bg-white">
			{renderNewHeader()}
			
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={0}
			>
				<ScrollView
					ref={scrollViewRef}
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 20 }}
				>
					{renderBadge()}
					
					<View className="px-6 items-center mb-8">
						<Text className="text-onSurface text-[40px] font-black text-center leading-tight mb-2">
							{level?.title}
						</Text>
						<Text className="text-onSurfaceVariant text-base font-medium text-center px-4 leading-6">
							{level?.description}
						</Text>
					</View>

					{/* Target Card Wrapper */}
					<View className="px-6 mb-8">
						<Card className="p-6 rounded-[32px] border border-outline/10 shadow-sm bg-white overflow-hidden">
							<Text className="text-onSurface text-base font-black text-center mb-6">
								Match This Exactly
							</Text>
							
							<View className="min-h-[220px] items-center justify-center rounded-2xl bg-surfaceVariant/5">
								{level.type === "image" && (
									<Image
										source={typeof level.targetImageUrl === "number" ? level.targetImageUrl : { uri: level.targetImageUrl as string }}
										className="w-full h-full rounded-2xl"
										resizeMode="contain"
									/>
								)}
								{level.type === "code" && (
									<HtmlPreview html={generatedCode ?? (level as { starterCode?: string }).starterCode ?? ""} height={220} />
								)}
								{level.type === "copywriting" && (
									<CopyTargetPreview
										instruction={(level as { instruction?: string }).instruction || ""}
										criteria={(level as { grading?: { criteria?: { description: string }[] } }).grading?.criteria?.map((c) => c.description) ?? []}
										context={formatStarterContext(level.starterContext as Record<string, unknown>)}
									/>
								)}
							</View>
						</Card>
					</View>

					{/* Optimal Length & Tags */}
					<View className="px-6 mb-4">
						<Text className="text-[#3C3C3C] text-sm font-medium mb-4">
							Optimal Length: 12-20 words
						</Text>
						
						<View className="flex-row gap-2 mb-6">
							{["IDENTITY", "CONTEXT", "CONSTRAINT"].map((tag) => {
								const isMet = matchedChecklistItems.includes(tag);
								return (
									<View 
										key={tag}
										className={`flex-row items-center px-4 py-2 rounded-full border ${
											isMet ? "border-[#E5E5E5] bg-white" : "border-outline/20 bg-surfaceVariant/5"
										}`}
									>
										{isMet && <Ionicons name="checkmark" size={14} color="#58CC02" style={{ marginRight: 4 }} />}
										<Text className={`text-[11px] font-black tracking-widest ${isMet ? "text-[#3C3C3C]" : "text-onSurfaceVariant"}`}>
											{tag}
										</Text>
									</View>
								);
							})}
						</View>

						{/* Prompt Area */}
						<Text className="text-[#8E8E93] text-sm font-bold mb-4">
							Your Prompt
						</Text>
						
						<View className="bg-surfaceVariant/5 border border-outline/20 rounded-[24px] p-6 min-h-[160px]">
							<TextInput
								ref={promptInputRef}
								value={prompt}
								onChangeText={handlePromptChange}
								onFocus={handlePromptFocus}
								placeholder="e.g., Create a pill-shaped button with a cyan..."
								placeholderTextColor="#8E8E93"
								multiline
								style={{ 
									textAlignVertical: "top",
									fontSize: 18,
									color: "#000000",
									backgroundColor: "transparent",
									flex: 1,
									padding: 0
								}}
							/>
						</View>
					</View>
					
					{/* Results Feedback (if any) */}
					{lastScore !== null && (
						<View className="px-6 mt-4">
							<Card className={`p-4 rounded-2xl border ${lastScore >= level.passingScore ? "border-success/30 bg-success/5" : "border-error/30 bg-error/5"}`}>
								<View className="flex-row items-center justify-between">
									<Text className="font-bold">Score: {lastScore}%</Text>
									<Ionicons 
										name={lastScore >= level.passingScore ? "checkmark-circle" : "alert-circle"} 
										size={20} 
										color={lastScore >= level.passingScore ? "#58CC02" : "#EF4444"} 
									/>
								</View>
							</Card>
						</View>
					)}
				</ScrollView>
			</KeyboardAvoidingView>

			{renderFooter()}

			<ResultModal
				visible={showResult}
				score={lastScore || 0}
				xp={quest?.xpReward || 250}
				moduleType={level.type}
				onNext={() => {
					setShowResult(false);
					router.replace("/(tabs)/");
				}}
				onClose={() => setShowResult(false)}
			/>
		</View>
	);

	// Final screen state routing
	if (isLoading) {
		return (
			<View className="flex-1 bg-white items-center justify-center">
				<ActivityIndicator size="large" color="#58CC02" />
			</View>
		);
	}

	if (error) {
		return (
			<SafeAreaView className="flex-1 bg-white px-6 items-center justify-center">
				<Ionicons name="alert-circle" size={64} color="#EF4444" />
				<Text className="text-xl font-bold mt-4">Failed to load quest</Text>
				<Text className="text-onSurfaceVariant text-center mt-2 mb-8">{error}</Text>
				<Button onPress={() => router.back()}>Go Back</Button>
			</SafeAreaView>
		);
	}

	return renderNewUI();
}
