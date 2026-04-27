import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ImageSourcePropType } from "react-native";

// ─── Step Configuration Types ────────────────────────────────────────
export type PreOnboardingStepType =
	| "options"
	| "notification"
	| "achievement"
	| "subscription"
	| "streak"
	| "success-reaction"
	| "quest-complete"
	| "quest-summary"
	| "challenge-intro"
	| "learning-journey";

export interface OptionItem {
	id: number;
	label: string;
	icon?: ImageSourcePropType;
	iconName?: string; // for MaterialCommunityIcons
	rightLabel?: string; // e.g. "Casual", "Regular"
}

export interface StepConfig {
	id: string;
	type: PreOnboardingStepType;
	title: string;
	progress: number; // 0-100 for progress bar
	options?: OptionItem[];
	buttonText?: string;
	showBackButton?: boolean;
}

// ─── Step Configs ────────────────────────────────────────────────────
export const PRE_ONBOARDING_STEPS: StepConfig[] = [
	{
		id: "reason",
		type: "options",
		title: "What's your reason for learning AI?",
		progress: 5,
		showBackButton: false,
		buttonText: "CONTINUE",
		options: [
			{ id: 1, label: "Advance my career" },
			{ id: 2, label: "Make more money" },
			{ id: 3, label: "Build apps / startups" },
			{ id: 4, label: "Automate my work" },
			{ id: 5, label: "Learn something new" },
			{ id: 6, label: "Stay ahead of the future" },
		],
	},
	{
		id: "experience",
		type: "options",
		title: "How much AI\ndo you know?",
		progress: 15,
		showBackButton: true,
		buttonText: "CONTINUE",
		options: [
			{
				id: 1,
				label: "Beginner (I've never used AI tools)",
				iconName: "signal-cellular-1",
			},
			{
				id: 2,
				label: "Basic (I've tried ChatGPT or similar)",
				iconName: "signal-cellular-2",
			},
			{
				id: 3,
				label: "Intermediate (I use AI regularly)",
				iconName: "signal-cellular-3",
			},
			{
				id: 4,
				label: "Advanced (I build with AI)",
				iconName: "signal-cellular-outline",
			},
		],
	},
	{
		id: "commitment",
		type: "options",
		title: "How much time can\nyou commit?",
		progress: 25,
		showBackButton: true,
		buttonText: "CONTINUE",
		options: [
			{ id: 1, label: "5 min / day", rightLabel: "Casual" },
			{ id: 2, label: "10 min / day", rightLabel: "Regular" },
			{ id: 3, label: "15 min / day", rightLabel: "Serious" },
			{ id: 4, label: "20 min / day", rightLabel: "Intense" },
		],
	},
	{
		id: "notifications",
		type: "notification",
		title: "Stay on track with\nreminders",
		progress: 35,
		showBackButton: true,
		buttonText: "REMIND ME TO PRACTICE",
	},
	{
		id: "achievements",
		type: "achievement",
		title: "Here's where you'll\nbe in 6 weeks",
		progress: 45,
		showBackButton: true,
		buttonText: "CONTINUE",
		options: [
			{ id: 1, label: "Understand AI basics" },
			{ id: 2, label: "Use AI tools confidently" },
			{ id: 3, label: "Automate simple tasks" },
			{ id: 4, label: "Advanced workflows" },
			{ id: 5, label: "Real-world application" },
		],
	},
	{
		id: "subscription",
		type: "subscription",
		title: "Unlock your full AI potential",
		progress: 85,
		showBackButton: true,
		buttonText: "GET FULL ACCESS",
	},
	{
		id: "streak",
		type: "streak",
		title: "Streak",
		progress: 87,
		showBackButton: true,
		buttonText: "CONTINUE",
	},
	{
		id: "success-reaction",
		type: "success-reaction",
		title: "You're on a roll!",
		progress: 100, // Updated to 100 since it is now the last step
		showBackButton: false,
		buttonText: "CONTINUE",
	},
];

// ─── Store ───────────────────────────────────────────────────────────
interface PreOnboardingState {
	currentStepIndex: number;
	hasCompletedPreOnboarding: boolean;
	answers: Record<string, number>; // stepId -> selectedOptionId
	userId: string | null;
	showNewUI: boolean;
	forceSkipOnboarding: boolean;

	// Actions
	setUserId: (userId: string | null) => void;
	goToNextStep: () => void;
	goToPreviousStep: () => void;
	setAnswer: (stepId: string, optionId: number) => void;
	completePreOnboarding: () => void;
	resetPreOnboarding: () => void;
	goToLastStep: () => void;
	setShowNewUI: (show: boolean) => void;
	finishPreOnboarding: () => void;
}

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

export const usePreOnboardingStore = create<PreOnboardingState>()(
	persist(
		(set, get) => ({
			currentStepIndex: 0,
			hasCompletedPreOnboarding: false,
			answers: {},
			userId: null,
			showNewUI: false,
			forceSkipOnboarding: false,

			setUserId: (userId) => set({ userId }),

			goToNextStep: () => {
				const { currentStepIndex } = get();
				if (currentStepIndex < PRE_ONBOARDING_STEPS.length - 1) {
					set({ currentStepIndex: currentStepIndex + 1 });
				} else {
					// Last step -> mark complete
					get().finishPreOnboarding();
				}
			},

			goToPreviousStep: () => {
				const { currentStepIndex } = get();
				if (currentStepIndex > 0) {
					set({ currentStepIndex: currentStepIndex - 1 });
				}
			},

			setAnswer: (stepId, optionId) =>
				set((state) => ({
					answers: { ...state.answers, [stepId]: optionId },
				})),

			completePreOnboarding: () =>
				get().finishPreOnboarding(),

			finishPreOnboarding: () =>
				set({
					hasCompletedPreOnboarding: true,
					showNewUI: true,
					forceSkipOnboarding: true,
				}),

			resetPreOnboarding: () =>
				set({
					currentStepIndex: 0,
					hasCompletedPreOnboarding: false,
					answers: {},
					showNewUI: false,
					forceSkipOnboarding: false,
				}),

			goToLastStep: () =>
				set({
					currentStepIndex: PRE_ONBOARDING_STEPS.length - 1,
					hasCompletedPreOnboarding: false,
				}),
			setShowNewUI: (show) => set({ showNewUI: show }),
		}),
		{
			name: "promptpal-pre-onboarding-storage",
			storage: createJSONStorage(() => secureStorage),
		},
	),
);
