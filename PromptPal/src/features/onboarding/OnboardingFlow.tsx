import { View, StyleSheet } from 'react-native';
import { useOnboardingStore } from './store';

// Screens
import { WelcomeScreen } from './screens/WelcomeScreen';
import { StoryIntroScreen } from './screens/StoryIntroScreen';
import { Concept1Screen } from './screens/Concept1Screen';
import { Practice1Screen } from './screens/Practice1Screen';
import { Concept2Screen } from './screens/Concept2Screen';
import { Practice2Screen } from './screens/Practice2Screen';
import { Concept3Screen } from './screens/Concept3Screen';
import { Practice3Screen } from './screens/Practice3Screen';
import { ChallengeScreen } from './screens/ChallengeScreen';
import { GeneratingScreen } from './screens/GeneratingScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { ModuleSelectionScreen } from './screens/ModuleSelectionScreen';
import { CompleteScreen } from './screens/CompleteScreen';

/**
 * Main onboarding flow component.
 * Renders the appropriate screen based on the current step
 * in the onboarding store.
 *
 * This replaces the old simple OnboardingOverlay with a full
 * story-driven, gamified onboarding experience.
 */
export function OnboardingFlow() {
    const { currentStep, hasCompletedOnboarding } = useOnboardingStore();

    // Don't render if onboarding is complete
    if (hasCompletedOnboarding) {
        return null;
    }

    const renderStep = () => {
        switch (currentStep) {
            case 'welcome':
                return <WelcomeScreen />;
            case 'story-intro':
                return <StoryIntroScreen />;
            case 'concept-1':
                return <Concept1Screen />;
            case 'practice-1':
                return <Practice1Screen />;
            case 'concept-2':
                return <Concept2Screen />;
            case 'practice-2':
                return <Practice2Screen />;
            case 'concept-3':
                return <Concept3Screen />;
            case 'practice-3':
                return <Practice3Screen />;
            case 'challenge':
                return <ChallengeScreen />;
            case 'generating':
                return <GeneratingScreen />;
            case 'results':
                return <ResultsScreen />;
            case 'module-selection':
                return <ModuleSelectionScreen />;
            case 'complete':
                return <CompleteScreen />;
            default:
                return <WelcomeScreen />;
        }
    };

    return <View style={styles.container}>{renderStep()}</View>;
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0B1220',
        zIndex: 50,
    },
});
