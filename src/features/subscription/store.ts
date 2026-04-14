import { create } from "zustand";
import type { SubscriptionTier } from "@/lib/subscriptionShared";

type SubscriptionStatusInput = {
	tier: SubscriptionTier;
	managementUrl?: string | null;
};

interface SubscriptionState {
	tier: SubscriptionTier;
	isLoading: boolean;
	managementUrl: string | null;
	lastSyncedAt: number | null;
	syncError: string | null;
	beginSync: () => void;
	applyStatus: (status: SubscriptionStatusInput) => void;
	markSyncError: (message: string) => void;
	resetForSignedOut: () => void;
}

const initialState = {
	tier: "free" as SubscriptionTier,
	isLoading: false,
	managementUrl: null,
	lastSyncedAt: null,
	syncError: null,
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
	...initialState,
	beginSync: () =>
		set({
			isLoading: true,
			syncError: null,
		}),
	applyStatus: (status) =>
		set({
			tier: status.tier,
			managementUrl: status.managementUrl ?? null,
			isLoading: false,
			lastSyncedAt: Date.now(),
			syncError: null,
		}),
	markSyncError: (message) =>
		set({
			isLoading: false,
			syncError: message,
		}),
	resetForSignedOut: () => set(initialState),
}));
