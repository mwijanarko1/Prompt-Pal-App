import { usePreOnboardingStore } from "./store";
import { PreOnboardingScreen } from "./PreOnboardingScreen";

/**
 * Pre-onboarding flow wrapper.
 * Shows the data-driven pre-onboarding screens before
 * the gamified onboarding begins.
 *
 * Returns null if pre-onboarding is already complete.
 */
export function PreOnboardingFlow() {
	const hasCompleted = usePreOnboardingStore(
		(state) => state.hasCompletedPreOnboarding,
	);

	if (hasCompleted) {
		return null;
	}

	return <PreOnboardingScreen />;
}
