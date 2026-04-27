import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
	FadeInUp,
	FadeInDown,
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	Easing,
	withRepeat,
} from "react-native-reanimated";
import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { useOnboardingStore } from "../store";
import { getAIErrorPresentation } from "@/lib/aiErrors";
import { useConvexAI } from "@/hooks/useConvexAI";
import { ONBOARDING_COLORS } from "../theme";

const ONBOARDING_LEVEL_ID = "copywriting-1-easy";

const COPY_BRIEF = [
	"Kill the default voice",
	"",
	"Write a one-sentence tagline for Blackout Coffee Co.",
	"Audience: People who wake up before 5am to train.",
	"Tone: Raw, no-nonsense, slightly aggressive.",
	"",
	"Use the player prompt as the strategic direction for the final copy.",
	"Return only the final tagline text, with no markdown or explanation.",
].join("\n");

const HINTS = [
	"Think about who drinks this coffee and what makes it different",
	"Specify the feeling the tagline should leave",
	"Avoid generic words like robust, bold, premium, artisan",
];

const LOADING_MESSAGES = [
	"Analyzing your prompt...",
	"Understanding requirements...",
	"Selecting the best persona...",
	"Setting technical constraints...",
	"Generating your creation...",
	"Polishing the output...",
];

export function GeneratingScreen() {
	const {
		goToNextStep,
		userPrompt,
		setGeneratedCopy,
		setCopyFeedback,
		setScore,
		goToPreviousStep,
	} = useOnboardingStore();
	const { generateText, evaluateCopySubmission } = useConvexAI();
	const [messageIndex, setMessageIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [isRetrying, setIsRetrying] = useState(false);
	const rotation = useSharedValue(0);

	const runGeneration = async () => {
		setError(null);
		setProgress(0);

		const copySystemPrompt = [
			"You are a conversion-focused copywriter.",
			"",
			"VISIBLE BRIEF:",
			COPY_BRIEF,
			"",
			`VISIBLE GUIDANCE:\n- ${HINTS.join("\n- ")}`,
			"",
			"Use the player prompt as the strategic direction for the final copy.",
			"Return only the final copy text, with no markdown or explanation.",
		].join("\n");

		try {
			// Step 1: Generate copy
			const generateResult = await generateText(userPrompt, copySystemPrompt);
			const generatedCopyText = generateResult.result || "";

			if (!generatedCopyText.trim()) {
				throw new Error("No copy was generated. Try a more specific prompt.");
			}

			setGeneratedCopy(generatedCopyText);

			// Step 2: Evaluate the generated copy
			const evaluation = await evaluateCopySubmission({
				levelId: ONBOARDING_LEVEL_ID,
				text: generatedCopyText,
				userPrompt,
				visibleBrief: COPY_BRIEF,
				visibleHints: HINTS,
			});

			setScore(evaluation.score);
			setCopyFeedback(evaluation.feedback || []);
			goToNextStep();
		} catch (err: unknown) {
			const aiError = getAIErrorPresentation(err);
			setError(aiError.message);
			setProgress(0);
		}
	};

	useEffect(() => {
		if (!userPrompt.trim()) {
			// When you jump here via the dev nav, `userPrompt` may be empty.
			// In dev, don't auto-bounce back—just stay on this slide.
			if (__DEV__) {
				return;
			}

			goToPreviousStep();
			return;
		}

		runGeneration();
	}, [userPrompt, goToPreviousStep, runGeneration]);

	useEffect(() => {
		rotation.value = withRepeat(
			withTiming(360, { duration: 2000, easing: Easing.linear }),
			-1,
			false,
		);
	}, [rotation.value]);

	useEffect(() => {
		if (error) return;

		const progressInterval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 95) return prev;
				return prev + Math.random() * 12 + 3;
			});
		}, 600);

		const messageInterval = setInterval(() => {
			setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
		}, 1500);

		return () => {
			clearInterval(progressInterval);
			clearInterval(messageInterval);
		};
	}, [error]);

	const handleRetry = () => {
		setIsRetrying(true);
		setError(null);
		runGeneration().finally(() => setIsRetrying(false));
	};

	const handleBack = () => {
		goToPreviousStep();
	};

	const spinnerStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}));

	if (error) {
		return (
			<OnboardingScreenWrapper showProgress={true}>
				<View style={styles.container}>
					<View style={styles.content}>
						<Animated.View
							entering={FadeInDown.duration(600).delay(200)}
							style={[styles.iconContainer, styles.errorIcon]}
						>
							<Ionicons name="alert-circle" size={64} color="#EF4444" />
						</Animated.View>

						<Animated.View
							entering={FadeInUp.duration(500).delay(300)}
							style={styles.textContainer}
						>
							<Text style={styles.title}>Generation Failed</Text>
							<Text style={styles.errorText}>{error}</Text>

							<View style={styles.buttonRow}>
								<TouchableOpacity
									style={[styles.button, styles.secondaryButton]}
									onPress={handleBack}
									disabled={isRetrying}
								>
									<Text style={styles.secondaryButtonText}>Go Back</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.button, styles.primaryButton]}
									onPress={handleRetry}
									disabled={isRetrying}
								>
									<Text style={styles.primaryButtonText}>
										{isRetrying ? "Retrying..." : "Try Again"}
									</Text>
								</TouchableOpacity>
							</View>
						</Animated.View>
					</View>
				</View>
			</OnboardingScreenWrapper>
		);
	}

	return (
		<OnboardingScreenWrapper showProgress={true}>
			<View style={styles.container}>
				<View style={styles.content}>
					<Animated.View
						entering={FadeInDown.duration(600).delay(200)}
						style={styles.iconContainer}
					>
						<Ionicons name="flash" size={64} color={ONBOARDING_COLORS.accent} />
					</Animated.View>

					<Animated.View
						entering={FadeInUp.duration(500).delay(300)}
						style={styles.textContainer}
					>
						<Text style={styles.title}>Generating Your Creation... ⚡</Text>

						<View style={styles.loadingBox}>
							<Animated.View style={[styles.spinner, spinnerStyle]}>
								<Ionicons
									name="sync"
									size={48}
									color={ONBOARDING_COLORS.accent}
								/>
							</Animated.View>

							<Animated.Text
								key={messageIndex}
								entering={FadeInUp.duration(300)}
								style={styles.loadingMessage}
							>
								{LOADING_MESSAGES[messageIndex]}
							</Animated.Text>
						</View>

						<View style={styles.infoCard}>
							<Ionicons
								name="information-circle"
								size={20}
								color={ONBOARDING_COLORS.accentWarm}
							/>
							<Text style={styles.infoText}>
								The AI is thinking... This usually takes 10-30 seconds.
							</Text>
						</View>

						<View style={styles.progressContainer}>
							<View style={styles.progressBarBg}>
								<Animated.View
									style={[styles.progressBarFill, { width: `${progress}%` }]}
								/>
							</View>
							<Text style={styles.progressText}>{Math.floor(progress)}%</Text>
						</View>
					</Animated.View>
				</View>
			</View>
		</OnboardingScreenWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
	},
	content: {
		alignItems: "center",
		paddingHorizontal: 32,
		paddingBottom: 40,
	},
	iconContainer: {
		marginBottom: 30,
		backgroundColor: "rgba(187, 134, 252, 0.1)",
		padding: 24,
		borderRadius: 50,
	},
	errorIcon: {
		backgroundColor: "rgba(239, 68, 68, 0.1)",
	},
	textContainer: {
		alignItems: "center",
		width: "100%",
	},
	title: {
		fontSize: 24,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
		marginBottom: 30,
		textAlign: "center",
		paddingHorizontal: 20,
	},
	errorText: {
		fontSize: 16,
		color: ONBOARDING_COLORS.textSecondary,
		textAlign: "center",
		marginBottom: 24,
		lineHeight: 24,
	},
	loadingBox: {
		width: "100%",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		padding: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.08)",
		marginBottom: 24,
	},
	spinner: {
		marginBottom: 24,
	},
	loadingMessage: {
		color: ONBOARDING_COLORS.textSecondary,
		fontSize: 16,
		fontWeight: "600",
		textAlign: "center",
	},
	infoCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(245, 158, 11, 0.08)",
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(245, 158, 11, 0.15)",
		marginBottom: 40,
	},
	infoText: {
		color: ONBOARDING_COLORS.textPrimary,
		marginLeft: 12,
		flex: 1,
		fontSize: 14,
		fontStyle: "italic",
	},
	progressContainer: {
		width: "100%",
		alignItems: "center",
	},
	progressBarBg: {
		width: "100%",
		height: 12,
		backgroundColor: "rgba(0, 0, 0, 0.08)",
		borderRadius: 6,
		overflow: "hidden",
		marginBottom: 12,
	},
	progressBarFill: {
		height: "100%",
		backgroundColor: ONBOARDING_COLORS.accent,
		borderRadius: 6,
	},
	progressText: {
		color: ONBOARDING_COLORS.textMuted,
		fontWeight: "bold",
		fontSize: 14,
	},
	buttonRow: {
		flexDirection: "row",
		gap: 16,
		width: "100%",
		marginTop: 8,
	},
	button: {
		flex: 1,
		borderRadius: 28,
		height: 56,
		alignItems: "center",
		justifyContent: "center",
	},
	primaryButton: {
		backgroundColor: ONBOARDING_COLORS.accent,
	},
	secondaryButton: {
		backgroundColor: "rgba(0,0,0,0.08)",
		borderWidth: 1,
		borderColor: "rgba(0,0,0,0.12)",
	},
	primaryButtonText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "700",
	},
	secondaryButtonText: {
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 16,
		fontWeight: "600",
	},
});
