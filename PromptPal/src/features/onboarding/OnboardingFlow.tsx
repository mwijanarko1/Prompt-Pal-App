import { useEffect, useRef } from "react";
import { AppState, View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useOnboardingStore, ONBOARDING_STEP_ORDER } from "./store";
import { ONBOARDING_COLORS } from "./theme";
import {
	logOnboardingAbandoned,
	logOnboardingCompleted,
	logOnboardingStarted,
	logOnboardingStepCompleted,
} from "@/lib/analytics";

// Screens
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { StoryIntroScreen } from "./screens/StoryIntroScreen";
import { Concept1Screen } from "./screens/Concept1Screen";
import { Practice1Screen } from "./screens/Practice1Screen";
import { Concept2Screen } from "./screens/Concept2Screen";
import { Practice2Screen } from "./screens/Practice2Screen";
import { Concept3Screen } from "./screens/Concept3Screen";
import { Practice3Screen } from "./screens/Practice3Screen";
import { ChallengeScreen } from "./screens/ChallengeScreen";
import { GeneratingScreen } from "./screens/GeneratingScreen";
import { ResultsScreen } from "./screens/ResultsScreen";
import { CompleteScreen } from "./screens/CompleteScreen";

/**
 * Main onboarding flow component.
 * Renders the appropriate screen based on the current step
 * in the onboarding store.
 *
 * This replaces the old simple OnboardingOverlay with a full
 * story-driven, gamified onboarding experience.
 */
export function OnboardingFlow() {
	const {
		currentStep,
		hasCompletedOnboarding,
		lastCompletionReason,
		goToNextStep,
		goToPreviousStep,
	} = useOnboardingStore();
	const hasTrackedStartRef = useRef(false);
	const hasTrackedAbandonmentRef = useRef(false);
	const previousStepRef = useRef(currentStep);

	useEffect(() => {
		const stepIndex = ONBOARDING_STEP_ORDER.indexOf(currentStep) + 1;
		const totalSteps = ONBOARDING_STEP_ORDER.length;

		if (!hasTrackedStartRef.current) {
			hasTrackedStartRef.current = true;
			logOnboardingStarted({
				step: currentStep,
				stepIndex,
				totalSteps,
			});
			previousStepRef.current = currentStep;
			return;
		}

		if (previousStepRef.current !== currentStep) {
			const previousStepIndex =
				ONBOARDING_STEP_ORDER.indexOf(previousStepRef.current) + 1;
			logOnboardingStepCompleted({
				step: previousStepRef.current,
				stepIndex: previousStepIndex,
				totalSteps,
			});
			previousStepRef.current = currentStep;
		}
	}, [currentStep]);

	useEffect(() => {
		if (!hasCompletedOnboarding || lastCompletionReason !== "completed") {
			return;
		}

		hasTrackedAbandonmentRef.current = true;
		logOnboardingCompleted({
			step: "complete",
			stepIndex: ONBOARDING_STEP_ORDER.indexOf("complete") + 1,
			totalSteps: ONBOARDING_STEP_ORDER.length,
		});
	}, [hasCompletedOnboarding, lastCompletionReason]);

	useEffect(() => {
		const subscription = AppState.addEventListener("change", (nextAppState) => {
			if (
				nextAppState !== "active" &&
				!hasCompletedOnboarding &&
				!hasTrackedAbandonmentRef.current
			) {
				hasTrackedAbandonmentRef.current = true;
				logOnboardingAbandoned({
					step: previousStepRef.current,
					stepIndex: ONBOARDING_STEP_ORDER.indexOf(previousStepRef.current) + 1,
					totalSteps: ONBOARDING_STEP_ORDER.length,
					reason: "backgrounded",
				});
			}
		});

		return () => {
			subscription.remove();
		};
	}, [hasCompletedOnboarding]);

	// Don't render if onboarding is complete
	if (hasCompletedOnboarding) {
		return null;
	}

	const renderStep = () => {
		switch (currentStep) {
			case "welcome":
				return <WelcomeScreen />;
			case "story-intro":
				return <StoryIntroScreen />;
			case "concept-1":
				return <Concept1Screen />;
			case "practice-1":
				return <Practice1Screen />;
			case "concept-2":
				return <Concept2Screen />;
			case "practice-2":
				return <Practice2Screen />;
			case "concept-3":
				return <Concept3Screen />;
			case "practice-3":
				return <Practice3Screen />;
			case "challenge":
				return <ChallengeScreen />;
			case "generating":
				return <GeneratingScreen />;
			case "results":
				return <ResultsScreen />;
			case "complete":
				return <CompleteScreen />;
			default:
				return <WelcomeScreen />;
		}
	};

	return (
		<View style={styles.container}>
			{renderStep()}
			{__DEV__ && (
				<View style={styles.devNav}>
					<TouchableOpacity
						style={[styles.devButton, styles.devButtonLeft]}
						onPress={goToPreviousStep}
						accessibilityRole="button"
						accessibilityLabel="Onboarding previous slide"
					>
						<Text style={styles.devButtonText}>Prev</Text>
					</TouchableOpacity>

					<Text style={styles.devStepText}>{currentStep}</Text>

					<TouchableOpacity
						style={[styles.devButton, styles.devButtonRight]}
						onPress={goToNextStep}
						accessibilityRole="button"
						accessibilityLabel="Onboarding next slide"
					>
						<Text style={styles.devButtonText}>Next</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: ONBOARDING_COLORS.background,
		zIndex: 50,
	},
	devNav: {
		position: "absolute",
		bottom: 24,
		left: 16,
		right: 16,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderRadius: 14,
		backgroundColor: "rgba(0,0,0,0.35)",
		zIndex: 60,
	},
	devButton: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 10,
		backgroundColor: "rgba(255,255,255,0.14)",
	},
	devButtonLeft: {},
	devButtonRight: {},
	devButtonText: {
		color: "#FFFFFF",
		fontWeight: "800",
	},
	devStepText: {
		color: "#FFFFFF",
		fontWeight: "700",
		fontSize: 12,
		opacity: 0.95,
		flex: 1,
		textAlign: "center",
	},
});
