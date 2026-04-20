import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ProgressBar } from "@/components/ui";
import { logOnboardingAbandoned } from "@/lib/analytics";
import {
	useOnboardingStore,
	getStepProgress,
	ONBOARDING_STEP_ORDER,
} from "../store";
import { ONBOARDING_COLORS } from "../theme";

interface OnboardingScreenWrapperProps {
	children: React.ReactNode;
	showProgress?: boolean;
}

export function OnboardingScreenWrapper({
	children,
	showProgress = true,
}: OnboardingScreenWrapperProps) {
	const { currentStep, completeOnboarding } = useOnboardingStore();
	const progress = getStepProgress(currentStep);

	const handleSkip = () => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		Alert.alert(
			"Skip Onboarding",
			"You can always replay it later from your profile settings.",
			[
				{ text: "Continue Learning", style: "cancel" },
				{
					text: "Skip",
					style: "destructive",
					onPress: () => {
						logOnboardingAbandoned({
							step: currentStep,
							stepIndex: ONBOARDING_STEP_ORDER.indexOf(currentStep) + 1,
							totalSteps: ONBOARDING_STEP_ORDER.length,
							reason: "skipped",
						});
						completeOnboarding("skipped");
					},
				},
			],
		);
	};

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			{/* Top bar: progress + skip */}
			<View style={styles.topBar}>
				{showProgress ? (
					<View style={styles.progressContainer}>
						<View style={styles.progressHeader}>
							<Text style={styles.stepText}>
								Step {progress.current} of {progress.total}
							</Text>
							<Text style={styles.percentText}>
								{Math.round(progress.percentage)}%
							</Text>
						</View>
						<ProgressBar
							progress={progress.percentage / 100}
							height={4}
							color="bg-primary"
						/>
					</View>
				) : (
					<View style={styles.progressPlaceholder} />
				)}

				<TouchableOpacity
					style={styles.skipButton}
					onPress={handleSkip}
					activeOpacity={0.7}
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					accessibilityRole="button"
					accessibilityLabel="Skip onboarding"
				>
					<Text style={styles.skipText}>Skip</Text>
				</TouchableOpacity>
			</View>

			<Animated.View
				entering={FadeIn.duration(350)}
				exiting={FadeOut.duration(200)}
				style={styles.content}
				key={currentStep}
			>
				{children}
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: ONBOARDING_COLORS.background,
	},
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		paddingRight: 20,
		zIndex: 10,
	},
	progressContainer: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 12,
		paddingBottom: 8,
	},
	progressPlaceholder: {
		flex: 1,
		height: 12,
	},
	progressHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
	},
	stepText: {
		color: ONBOARDING_COLORS.textMuted,
		fontSize: 12,
		fontWeight: "600",
		letterSpacing: 0.5,
		textTransform: "uppercase",
	},
	percentText: {
		color: ONBOARDING_COLORS.accent,
		fontSize: 12,
		fontWeight: "700",
	},
	skipButton: {
		paddingVertical: 12,
		paddingHorizontal: 12,
	},
	skipText: {
		color: ONBOARDING_COLORS.textSubtle,
		fontSize: 14,
		fontWeight: "700",
		letterSpacing: 0.3,
	},
	content: {
		flex: 1,
	},
});
