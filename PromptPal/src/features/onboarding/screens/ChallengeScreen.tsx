import { useEffect, useRef, useState } from "react";
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
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { useOnboardingStore } from "../store";
import { ONBOARDING_COLORS } from "../theme";
import { useConvexAI } from "@/hooks/useConvexAI";
import { getAIErrorPresentation } from "@/lib/aiErrors";

/** Same deliverable as GeneratingScreen / copy lesson brief (visible task). */
const ONBOARDING_TASK_BRIEF =
	"Write a one-sentence tagline for Blackout Coffee Co. Audience: people who train before dawn. Tone: raw, no-nonsense.";

export function ChallengeScreen() {
	const { goToNextStep, setUserPrompt } = useOnboardingStore();
	const { evaluateOnboardingPrompt } = useConvexAI();
	const [localPrompt, setLocalPrompt] = useState("");
	const [isChecking, setIsChecking] = useState(false);
	const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		return () => {
			if (advanceTimerRef.current) {
				clearTimeout(advanceTimerRef.current);
			}
		};
	}, []);

	const [feedback, setFeedback] = useState<{
		hasSubject: boolean;
		hasStyle: boolean;
		hasGuardrail: boolean;
		text: string;
	} | null>(null);

	const checkPrompt = async () => {
		const trimmed = localPrompt.trim();
		if (!trimmed || isChecking) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsChecking(true);
		setFeedback(null);

		try {
			const result = await evaluateOnboardingPrompt({
				userPrompt: trimmed,
				taskBrief: ONBOARDING_TASK_BRIEF,
			});

			setFeedback({
				hasSubject: result.hasSubject,
				hasStyle: result.hasStyle,
				hasGuardrail: result.hasGuardrail,
				text: result.coachMessage,
			});

			if (result.passed) {
				setUserPrompt(trimmed);
				void Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success,
				);
				advanceTimerRef.current = setTimeout(() => {
					advanceTimerRef.current = null;
					goToNextStep();
				}, 1500);
			} else {
				void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
			}
		} catch (err: unknown) {
			const aiError = getAIErrorPresentation(err);
			setFeedback({
				hasSubject: false,
				hasStyle: false,
				hasGuardrail: false,
				text: aiError.message,
			});
			void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		} finally {
			setIsChecking(false);
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
				>
					<Animated.View
						entering={FadeInDown.duration(600).delay(200)}
						style={styles.iconContainer}
					>
						<Ionicons name="trophy" size={64} color="#FFD700" />
					</Animated.View>

					<Animated.View
						entering={FadeInUp.duration(500).delay(400)}
						style={styles.textContainer}
					>
						<Text style={styles.title}>The Final Challenge!</Text>

						<Text style={styles.description}>
							Put it all together! Use a clear subject, specific style, and a
							guardrail.
						</Text>

						<View style={styles.targetCard}>
							<Ionicons
								name="megaphone"
								size={32}
								color={ONBOARDING_COLORS.accent}
							/>
							<Text style={styles.targetTitle}>TASK:</Text>
							<Text style={styles.targetText}>
								"Write a one-sentence tagline for Blackout Coffee Co."
							</Text>
						</View>

						<View style={styles.requirementsBox}>
							<Text style={styles.reqTitle}>Your prompt should include:</Text>
							<View style={styles.reqRow}>
								<Ionicons
									name={feedback?.hasSubject ? "checkbox" : "square-outline"}
									size={20}
									color={
										feedback?.hasSubject
											? ONBOARDING_COLORS.success
											: ONBOARDING_COLORS.textMuted
									}
								/>
								<Text
									style={[
										styles.reqText,
										feedback?.hasSubject && styles.reqTextMet,
									]}
								>
									Subject (e.g. ...tagline for a coffee brand.)
								</Text>
							</View>
							<View style={styles.reqRow}>
								<Ionicons
									name={feedback?.hasStyle ? "checkbox" : "square-outline"}
									size={20}
									color={
										feedback?.hasStyle
											? ONBOARDING_COLORS.success
											: ONBOARDING_COLORS.textMuted
									}
								/>
								<Text
									style={[
										styles.reqText,
										feedback?.hasStyle && styles.reqTextMet,
									]}
								>
									Style (e.g. ...write a professional...)
								</Text>
							</View>
							<View style={styles.reqRow}>
								<Ionicons
									name={feedback?.hasGuardrail ? "checkbox" : "square-outline"}
									size={20}
									color={
										feedback?.hasGuardrail
											? ONBOARDING_COLORS.success
											: ONBOARDING_COLORS.textMuted
									}
								/>
								<Text
									style={[
										styles.reqText,
										feedback?.hasGuardrail && styles.reqTextMet,
									]}
								>
									Guardrail (e.g. ...keep it under 5 words.)
								</Text>
							</View>
						</View>

						<View style={styles.inputContainer}>
							<TextInput
								style={styles.input}
								placeholder="Describe your prompt here..."
								placeholderTextColor={ONBOARDING_COLORS.textMuted}
								value={localPrompt}
								onChangeText={(text) => {
									setLocalPrompt(text);
									setFeedback(null);
									if (advanceTimerRef.current) {
										clearTimeout(advanceTimerRef.current);
										advanceTimerRef.current = null;
									}
								}}
								multiline
								numberOfLines={3}
								autoCapitalize="none"
								autoCorrect={false}
								spellCheck={false}
							/>
						</View>

						{feedback && (
							<Animated.View
								entering={FadeInUp.duration(300)}
								style={styles.feedbackContainer}
							>
								<Text
									style={[
										styles.feedbackText,
										{
											color:
												feedback.hasSubject &&
												feedback.hasStyle &&
												feedback.hasGuardrail
													? ONBOARDING_COLORS.success
													: "#EF4444",
										},
									]}
								>
									{feedback.text}
								</Text>
							</Animated.View>
						)}

						<View style={styles.tipCard}>
							<Ionicons name="bulb" size={20} color="#FFEB3B" />
							<Text style={styles.tipText}>
								Tip: "Write a [Style] [Subject], but [Guardrail]."
							</Text>
						</View>
					</Animated.View>

					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={[
								styles.button,
								(localPrompt.trim().length === 0 || isChecking) &&
									styles.buttonDisabled,
							]}
							onPress={() => {
								void checkPrompt();
							}}
							disabled={
								localPrompt.trim().length === 0 ||
								isChecking ||
								(feedback?.hasSubject &&
									feedback?.hasStyle &&
									feedback?.hasGuardrail)
							}
							activeOpacity={0.85}
						>
							{isChecking ? (
								<ActivityIndicator color="#FFFFFF" />
							) : (
								<>
									<Text style={styles.buttonText}>Finish Training</Text>
									<Ionicons
										name="sparkles"
										size={20}
										color="#FFFFFF"
										style={{ marginLeft: 8 }}
									/>
								</>
							)}
						</TouchableOpacity>
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
		alignItems: "center",
		paddingHorizontal: 32,
		paddingTop: 40,
		paddingBottom: 40,
	},
	iconContainer: {
		marginBottom: 20,
		backgroundColor: "rgba(255, 215, 0, 0.1)",
		padding: 24,
		borderRadius: 50,
	},
	textContainer: {
		alignItems: "center",
		width: "100%",
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
		marginBottom: 16,
		textAlign: "center",
	},
	description: {
		fontSize: 16,
		color: ONBOARDING_COLORS.textSecondary,
		textAlign: "center",
		lineHeight: 24,
		marginBottom: 24,
	},
	targetCard: {
		width: "100%",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		padding: 20,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.08)",
		alignItems: "center",
		marginBottom: 24,
	},
	targetTitle: {
		color: ONBOARDING_COLORS.textMuted,
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 1,
		marginTop: 12,
		marginBottom: 4,
	},
	targetText: {
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 18,
		fontWeight: "700",
		textAlign: "center",
	},
	requirementsBox: {
		width: "100%",
		backgroundColor: "rgba(0,0,0,0.05)",
		padding: 16,
		borderRadius: 12,
		marginBottom: 20,
	},
	reqTitle: {
		color: ONBOARDING_COLORS.textPrimary,
		fontWeight: "700",
		marginBottom: 12,
		fontSize: 15,
	},
	reqRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	reqText: {
		color: ONBOARDING_COLORS.textSecondary,
		marginLeft: 10,
		fontSize: 15,
	},
	reqTextMet: {
		color: ONBOARDING_COLORS.textPrimary,
		textDecorationLine: "line-through",
	},
	inputContainer: {
		width: "100%",
		marginBottom: 16,
	},
	input: {
		backgroundColor: "rgba(0,0,0,0.08)",
		borderRadius: 16,
		padding: 16,
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.12)",
		minHeight: 100,
		textAlignVertical: "top",
	},
	feedbackContainer: {
		marginBottom: 16,
	},
	feedbackText: {
		fontSize: 15,
		fontWeight: "600",
		textAlign: "center",
	},
	tipCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255, 235, 59, 0.1)",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 235, 59, 0.2)",
		width: "100%",
		marginBottom: 24,
	},
	tipText: {
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 14,
		fontStyle: "italic",
		marginLeft: 12,
		flex: 1,
	},
	buttonContainer: {
		width: "100%",
		marginTop: 16,
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
