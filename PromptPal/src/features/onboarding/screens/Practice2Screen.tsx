import { useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
	FadeInUp,
	FadeInDown,
	FadeIn,
	FadeOut,
} from "react-native-reanimated";
import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { useOnboardingStore } from "../store";
import { ONBOARDING_COLORS } from "../theme";
import { useConvexAI } from "@/hooks/useConvexAI";
import { getAIErrorPresentation } from "@/lib/aiErrors";
import { logQuizAnswerSubmitted } from "@/lib/analytics";
import { delay } from "../utils/practiceEvaluation";

const ONBOARDING_CODE_LEVEL_ID = "code-11-hard";
const PASSING_SCORE = 70;

const TARGET_BRIEF =
	"Target Logic: Add a way for the user to type a new task and add it to the visible tasks list (the new task should appear in the list).";

const VISIBLE_HINTS = [
	"Mention an input field where the user can type a new task.",
	"Explain how the user triggers adding (e.g. an Add button click).",
	"Describe that the new task appears in the list.",
	"If applicable, describe that the input clears after adding.",
];

const LOCAL_TAKEAWAY =
	"For interactive features, step-by-step user behavior matters as much as the visible components.";

function extractCodeFromResponse(text: string): string {
	const match = text.match(/```(?:[a-z]+)?\s*([\s\S]*?)\s*```/i);
	return (match?.[1] || text).trim();
}

export function Practice2Screen() {
	const { goToNextStep, addBadge } = useOnboardingStore();
	const { generateText, evaluateCodeSubmission } = useConvexAI();

	const [localPrompt, setLocalPrompt] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationStep, setGenerationStep] = useState("");
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
			setGenerationStep("Analyzing your prompt...");
			void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await delay(350);

			const codeSystemPrompt = [
				"You are a strict frontend code generator.",
				"",
				"The user will provide a prompt describing a small interactive UI.",
				"",
				"Return a complete, runnable HTML document with any necessary inline JavaScript.",
				"- Return ONLY code.",
				"- No markdown code fences.",
				"- No explanations.",
				"",
				"VISIBLE CHALLENGE:",
				TARGET_BRIEF,
				"",
				`VISIBLE GUIDANCE:\n- ${VISIBLE_HINTS.join("\n- ")}`,
			].join("\n");

			setGenerationStep("Generating code...");
			void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await delay(350);

			const generateResult = await generateText(localPrompt, codeSystemPrompt);
			const generatedCodeText = extractCodeFromResponse(
				generateResult.result || "",
			);

			if (!generatedCodeText.trim()) {
				throw new Error("AI returned empty code. Try a more specific prompt.");
			}

			setGeneratedCode(generatedCodeText);

			setGenerationStep("Validating interactive behavior...");
			void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await delay(350);

			const evaluation = await evaluateCodeSubmission({
				levelId: ONBOARDING_CODE_LEVEL_ID,
				code: generatedCodeText,
				userPrompt: localPrompt,
				visibleBrief: TARGET_BRIEF,
				visibleHints: VISIBLE_HINTS,
			});

			const passed =
				typeof evaluation.score === "number"
					? evaluation.score >= PASSING_SCORE
					: false;
			const feedbackLines: string[] = Array.isArray(evaluation.feedback)
				? evaluation.feedback
				: [];

			setFeedback({
				success: passed,
				text:
					feedbackLines[0] ||
					(passed ? "Nice work." : "Your prompt needs more detail."),
				nudge: passed
					? undefined
					: feedbackLines.join(" ") ||
						"Try spelling out the interactive behavior clearly.",
				takeaway: passed ? LOCAL_TAKEAWAY : undefined,
				score:
					typeof evaluation.score === "number" ? evaluation.score : undefined,
			});
			logQuizAnswerSubmitted({
				quizId: "onboarding-practice",
				questionId: "practice-2",
				answerLength: localPrompt.trim().length,
				score:
					typeof evaluation.score === "number" ? evaluation.score : undefined,
				isCorrect: passed,
			});

			if (passed) {
				addBadge("logic-master");
				void Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success,
				);
			} else {
				void Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Warning,
				);
			}
		} catch (error) {
			console.error(error);
			const aiError = getAIErrorPresentation(error);
			setFeedback({
				success: false,
				text: "AI evaluation failed.",
				nudge: aiError.message,
			});
		} finally {
			setIsGenerating(false);
			setGenerationStep("");
		}
	};

	return (
		<OnboardingScreenWrapper showProgress={true}>
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				style={styles.container}
			>
				<ScrollView
					contentContainerStyle={styles.scrollContent}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.content}>
						<Animated.View
							entering={FadeInDown.duration(600).delay(200)}
							style={styles.header}
						>
							<Text style={styles.title}>Make it do something</Text>
							<Text style={styles.instruction}>
								Add a way for users to add tasks to this list.
							</Text>
						</Animated.View>

						<Animated.View
							entering={FadeInUp.duration(500).delay(400)}
							style={styles.codeContainer}
						>
							<View style={styles.codeHeader}>
								<Text style={styles.codeTitle}>Target Logic</Text>
								<TouchableOpacity onPress={() => setShowHint(!showHint)}>
									<Text style={styles.hintToggle}>
										{showHint ? "Hide Hint" : "Need a Hint?"}
									</Text>
								</TouchableOpacity>
							</View>

							<View style={styles.targetPreview}>
								<View style={styles.mockList}>
									<View style={styles.mockListItem}>
										<Text style={styles.mockItemText}>Buy groceries</Text>
									</View>
									<View style={styles.mockListItem}>
										<Text style={styles.mockItemText}>Walk the dog</Text>
									</View>
								</View>
								<Text style={styles.behaviorText}>
									Task: Add a way for the user to type and add new tasks to this
									list.
								</Text>
							</View>

							{showHint && (
								<Animated.View
									entering={FadeIn}
									exiting={FadeOut}
									style={styles.hintBox}
								>
									<Text style={styles.hintText}>
										💡 Think about what the user needs to type into, what they
										click, and where the new task shows up.
									</Text>
								</Animated.View>
							)}
						</Animated.View>

						<Animated.View
							entering={FadeInUp.duration(500).delay(600)}
							style={styles.inputSection}
						>
							<View style={styles.inputContainer}>
								<TextInput
									style={styles.input}
									placeholder="Describe the behavior - input, button, and adding to list..."
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
								<Animated.View
									entering={FadeIn}
									exiting={FadeOut}
									style={styles.loadingContainer}
								>
									<ActivityIndicator
										color={ONBOARDING_COLORS.info}
										size="large"
									/>
									<Text style={styles.loadingText}>{generationStep}</Text>
								</Animated.View>
							)}

							{feedback && !isGenerating && (
								<Animated.View
									entering={FadeInUp.duration(300)}
									style={styles.feedbackContainer}
								>
									<View style={styles.feedbackHeader}>
										<Ionicons
											name={
												feedback.success ? "checkmark-circle" : "alert-circle"
											}
											size={24}
											color={
												feedback.success ? ONBOARDING_COLORS.success : "#EF4444"
											}
										/>
										<Text
											style={[
												styles.feedbackText,
												{
													color: feedback.success
														? ONBOARDING_COLORS.success
														: "#EF4444",
												},
											]}
										>
											{feedback.text}
										</Text>
									</View>

									{feedback.nudge && !feedback.success && (
										<Text style={styles.nudgeText}>{feedback.nudge}</Text>
									)}

									{feedback.takeaway && feedback.success && (
										<View style={styles.takeawayBox}>
											<Text style={styles.takeawayTitle}>Lesson Takeaway:</Text>
											<Text style={styles.takeawayText}>
												{feedback.takeaway}
											</Text>
										</View>
									)}
								</Animated.View>
							)}
						</Animated.View>

						<View style={styles.spacer} />

						<Animated.View
							entering={FadeInUp.duration(500).delay(800)}
							style={styles.buttonContainer}
						>
							<TouchableOpacity
								style={[
									styles.button,
									(localPrompt.trim().length === 0 || isGenerating) &&
										styles.buttonDisabled,
									feedback?.success && {
										backgroundColor: ONBOARDING_COLORS.success,
									},
								]}
								onPress={feedback?.success ? goToNextStep : runActualCheck}
								disabled={localPrompt.trim().length === 0 || isGenerating}
								activeOpacity={0.85}
							>
								<Text style={styles.buttonText}>
									{isGenerating
										? "Analyzing..."
										: feedback?.success
											? "Next Lesson"
											: "Test Logic"}
								</Text>
								{!isGenerating && (
									<Ionicons
										name={feedback?.success ? "arrow-forward" : "flask"}
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
		width: "100%",
		maxWidth: 520,
		alignSelf: "center",
	},
	header: {
		alignItems: "center",
		marginBottom: 24,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
		marginBottom: 8,
		textAlign: "center",
	},
	instruction: {
		fontSize: 16,
		color: ONBOARDING_COLORS.textSecondary,
		textAlign: "center",
		fontWeight: "600",
	},
	codeContainer: {
		width: "100%",
		marginBottom: 24,
	},
	codeHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	codeTitle: {
		color: ONBOARDING_COLORS.textMuted,
		textTransform: "uppercase",
		fontWeight: "700",
		fontSize: 12,
		letterSpacing: 1,
		marginBottom: 8,
	},
	hintToggle: {
		color: ONBOARDING_COLORS.info,
		fontSize: 12,
		fontWeight: "700",
	},
	codeBox: {
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.08)",
	},
	codeText: {
		color: ONBOARDING_COLORS.textPrimary,
		fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
		fontSize: 11,
	},
	targetPreview: {
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		padding: 20,
		borderRadius: 20,
		borderWidth: 1.5,
		borderColor: "rgba(0, 0, 0, 0.08)",
	},
	mockList: {
		marginBottom: 16,
	},
	mockListItem: {
		backgroundColor: "#FFFFFF",
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.08)",
		marginBottom: 8,
	},
	mockItemText: {
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 14,
		fontWeight: "500",
	},
	behaviorText: {
		color: ONBOARDING_COLORS.textSecondary,
		fontSize: 12,
		fontWeight: "600",
		fontStyle: "italic",
		textAlign: "center",
	},
	hintBox: {
		marginTop: 12,
		backgroundColor: "rgba(65, 81, 255, 0.08)",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(65, 81, 255, 0.15)",
	},
	hintText: {
		color: ONBOARDING_COLORS.textSecondary,
		fontSize: 14,
		lineHeight: 20,
		fontWeight: "500",
	},
	inputSection: {
		width: "100%",
	},
	inputContainer: {
		width: "100%",
		marginBottom: 16,
	},
	input: {
		backgroundColor: "rgba(0,0,0,0.08)",
		borderRadius: 16,
		padding: 20,
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.12)",
		minHeight: 100,
		textAlignVertical: "top",
	},
	loadingContainer: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 20,
	},
	loadingText: {
		marginTop: 12,
		color: ONBOARDING_COLORS.textSecondary,
		fontSize: 14,
		fontWeight: "600",
	},
	generatedCodeSection: {
		width: "100%",
		marginBottom: 20,
	},
	feedbackContainer: {
		width: "100%",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.02)",
		padding: 16,
		borderRadius: 20,
	},
	feedbackHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 8,
	},
	feedbackText: {
		fontSize: 16,
		fontWeight: "700",
		textAlign: "center",
		flex: 1,
	},
	nudgeText: {
		fontSize: 14,
		color: ONBOARDING_COLORS.textSecondary,
		textAlign: "center",
		fontStyle: "italic",
		marginBottom: 12,
	},
	takeawayBox: {
		width: "100%",
		backgroundColor: "rgba(34, 197, 94, 0.08)",
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(34, 197, 94, 0.2)",
		marginTop: 8,
	},
	takeawayTitle: {
		color: ONBOARDING_COLORS.success,
		fontWeight: "800",
		fontSize: 13,
		marginBottom: 4,
		textTransform: "uppercase",
	},
	takeawayText: {
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 14,
		lineHeight: 20,
		fontWeight: "600",
	},
	spacer: {
		height: 32,
	},
	buttonContainer: {
		width: "100%",
	},
	button: {
		backgroundColor: ONBOARDING_COLORS.accent,
		borderRadius: 28,
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: ONBOARDING_COLORS.accent,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 8,
	},
	buttonDisabled: {
		backgroundColor: "rgba(0,0,0,0.1)",
		shadowOpacity: 0,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "800",
		letterSpacing: 0.5,
	},
});
