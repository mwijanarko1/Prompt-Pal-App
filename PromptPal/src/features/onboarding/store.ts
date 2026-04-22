import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
	logOnboardingAbandoned,
	logOnboardingCompleted,
	logOnboardingStepCompleted,
	logQuizAnswerSubmitted,
} from "@/lib/analytics";

export type OnboardingStep =
	| "welcome"
	| "story-intro"
	| "concept-1"
	| "practice-1"
	| "concept-2"
	| "practice-2"
	| "concept-3"
	| "practice-3"
	| "challenge"
	| "generating"
	| "results"
	| "complete";

export interface OnboardingState {
	// Navigation
	currentStep: OnboardingStep;
	hasCompletedOnboarding: boolean;

	// User inputs
	userPrompt: string;
	selectedStyle: string;
	selectedContext: string[];
	selectedModule: string | null;

	// Challenge results (copywriting flow)
	generatedCopy: string | null;
	copyFeedback: string[];
	generatedImageUrl: string | null;
	score: number | null;

	// Gamification
	badges: string[];
	xpEarned: number;

	// Quiz answers
	concept1Answer: string | null;
	concept2Matches: Record<string, string>;

	// Actions
	setCurrentStep: (step: OnboardingStep) => void;
	goToNextStep: () => void;
	goToPreviousStep: () => void;
	completeOnboarding: () => void;
	abandonOnboarding: (reason?: string) => void;
	setUserPrompt: (prompt: string) => void;
	setSelectedStyle: (style: string) => void;
	setSelectedModule: (moduleId: string | null) => void;
	toggleContext: (context: string) => void;
	setGeneratedCopy: (copy: string | null) => void;
	setCopyFeedback: (feedback: string[]) => void;
	setGeneratedImage: (url: string | null) => void;
	setScore: (score: number) => void;
	addBadge: (badge: string) => void;
	addXp: (amount: number) => void;
	setConcept1Answer: (answer: string | null) => void;
	setConcept2Match: (style: string, description: string) => void;
	resetOnboarding: () => void;
}

const STEP_ORDER: OnboardingStep[] = [
	"welcome",
	"story-intro",
	"concept-1",
	"practice-1",
	"concept-2",
	"practice-2",
	"concept-3",
	"practice-3",
	"challenge",
	"generating",
	"results",
	"complete",
];

function logStepCompleted(step: OnboardingStep) {
	const progress = getStepProgress(step);
	logOnboardingStepCompleted({
		stepName: step,
		stepNumber: progress.current,
		totalSteps: progress.total,
	});
}

// Use SecureStore on native, localStorage on web (expo-secure-store is not available on web)
const secureStorage = {
	getItem: async (name: string): Promise<string | null> => {
		try {
			if (Platform.OS === "web" && typeof window !== "undefined") {
				return window.localStorage.getItem(name);
			}
			return await SecureStore.getItemAsync(name);
		} catch {
			return null;
		}
	},
	setItem: async (name: string, value: string): Promise<void> => {
		try {
			if (Platform.OS === "web" && typeof window !== "undefined") {
				window.localStorage.setItem(name, value);
			} else {
				await SecureStore.setItemAsync(name, value);
			}
		} catch {}
	},
	removeItem: async (name: string): Promise<void> => {
		try {
			if (Platform.OS === "web" && typeof window !== "undefined") {
				window.localStorage.removeItem(name);
			} else {
				await SecureStore.deleteItemAsync(name);
			}
		} catch {}
	},
};

export const useOnboardingStore = create<OnboardingState>()(
	persist(
		(set, get) => ({
			currentStep: "welcome",
			hasCompletedOnboarding: false,
			userPrompt: "",
			selectedStyle: "",
			selectedContext: [],
			selectedModule: null,
			generatedCopy: null,
			copyFeedback: [],
			generatedImageUrl: null,
			score: null,
			badges: [],
			xpEarned: 0,
			concept1Answer: null,
			concept2Matches: {},

			setCurrentStep: (step) => {
				const { currentStep } = get();
				const currentIndex = STEP_ORDER.indexOf(currentStep);
				const nextIndex = STEP_ORDER.indexOf(step);

				if (nextIndex > currentIndex) {
					logStepCompleted(currentStep);
				}

				set({ currentStep: step });
			},

			goToNextStep: () => {
				const { currentStep } = get();
				const currentIndex = STEP_ORDER.indexOf(currentStep);
				if (currentIndex < STEP_ORDER.length - 1) {
					logStepCompleted(currentStep);
					set({ currentStep: STEP_ORDER[currentIndex + 1] });
				}
			},

			goToPreviousStep: () => {
				const { currentStep } = get();
				const currentIndex = STEP_ORDER.indexOf(currentStep);
				if (currentIndex > 0) {
					set({ currentStep: STEP_ORDER[currentIndex - 1] });
				}
			},

			completeOnboarding: () => {
				const { selectedModule, xpEarned } = get();
				logOnboardingCompleted({
					stepsCompleted: STEP_ORDER.length,
					totalSteps: STEP_ORDER.length,
					selectedModule,
					xpEarned,
				});
				set({ hasCompletedOnboarding: true, currentStep: "complete" });
			},

			abandonOnboarding: (reason = "skip") => {
				const { currentStep } = get();
				const progress = getStepProgress(currentStep);
				logOnboardingAbandoned({
					stepName: currentStep,
					stepNumber: progress.current,
					totalSteps: progress.total,
					reason,
				});
				set({ hasCompletedOnboarding: true, currentStep: "complete" });
			},

			setUserPrompt: (prompt) => set({ userPrompt: prompt }),
			setSelectedStyle: (style) => set({ selectedStyle: style }),
			setSelectedModule: (selectedModule) => set({ selectedModule }),

			toggleContext: (context) =>
				set((state) => ({
					selectedContext: state.selectedContext.includes(context)
						? state.selectedContext.filter((c) => c !== context)
						: [...state.selectedContext, context],
				})),

			setGeneratedCopy: (copy) => set({ generatedCopy: copy }),
			setCopyFeedback: (feedback) => set({ copyFeedback: feedback }),
			setGeneratedImage: (url) => set({ generatedImageUrl: url }),
			setScore: (score) => set({ score }),

			addBadge: (badge) =>
				set((state) => ({
					badges: [...new Set([...state.badges, badge])],
				})),

			addXp: (amount) =>
				set((state) => ({
					xpEarned: state.xpEarned + amount,
				})),

			setConcept1Answer: (answer) => {
				logQuizAnswerSubmitted({
					lessonId: "onboarding",
					lessonType: "onboarding",
					questionId: "concept-1",
					answerLength: answer?.length,
				});
				set({ concept1Answer: answer });
			},

			setConcept2Match: (style, description) => {
				logQuizAnswerSubmitted({
					lessonId: "onboarding",
					lessonType: "onboarding",
					questionId: `concept-2-${style}`,
					answerLength: description.length,
				});
				set((state) => ({
					concept2Matches: { ...state.concept2Matches, [style]: description },
				}));
			},

			resetOnboarding: () =>
				set({
					currentStep: "welcome",
					hasCompletedOnboarding: false,
					userPrompt: "",
					selectedStyle: "",
					selectedContext: [],
					selectedModule: null,
					generatedCopy: null,
					copyFeedback: [],
					generatedImageUrl: null,
					score: null,
					badges: [],
					xpEarned: 0,
					concept1Answer: null,
					concept2Matches: {},
				}),
		}),
		{
			name: "promptpal-onboarding-storage",
			storage: createJSONStorage(() => secureStorage),
		},
	),
);

/**
 * Returns the current step index (0-based) and total step count.
 */
export function getStepProgress(step: OnboardingStep) {
	const index = STEP_ORDER.indexOf(step);
	return {
		current: index + 1,
		total: STEP_ORDER.length,
		percentage: ((index + 1) / STEP_ORDER.length) * 100,
	};
}
