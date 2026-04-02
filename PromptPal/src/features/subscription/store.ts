import { create } from "zustand";
import type { SubscriptionTier } from "@/lib/subscriptionShared";
import {
	readCachedSubscriptionStatus,
	writeCachedSubscriptionStatus,
} from "@/lib/subscriptionTierCache";

type SubscriptionStatusInput = {
	tier: SubscriptionTier;
	managementUrl?: string | null;
};

type ApplyStatusOptions = {
	userId?: string | null;
	markResolved?: boolean;
};

interface SubscriptionState {
	tier: SubscriptionTier;
	isLoading: boolean;
	hasResolvedSubscription: boolean;
	managementUrl: string | null;
	lastSyncedAt: number | null;
	syncError: string | null;
	hydrateFromCache: (userId: string) => Promise<void>;
	beginSync: () => void;
	applyStatus: (
		status: SubscriptionStatusInput,
		options?: ApplyStatusOptions,
	) => Promise<void>;
	markSyncError: (message: string) => void;
	resetForSignedOut: () => void;
}

const initialState = {
	tier: "free" as SubscriptionTier,
	isLoading: false,
	hasResolvedSubscription: false,
	managementUrl: null,
	lastSyncedAt: null,
	syncError: null,
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
	...initialState,
	hydrateFromCache: async (userId) => {
		const cachedStatus = await readCachedSubscriptionStatus(userId);

		set({
			tier: cachedStatus?.tier ?? "free",
			managementUrl: cachedStatus?.managementUrl ?? null,
			isLoading: false,
			syncError: null,
		});
	},
	beginSync: () =>
		set({
			isLoading: true,
			syncError: null,
		}),
	applyStatus: async (status, options) => {
		if (options?.userId) {
			await writeCachedSubscriptionStatus(options.userId, {
				tier: status.tier,
				managementUrl: status.managementUrl ?? null,
			});
		}

		set({
			tier: status.tier,
			managementUrl: status.managementUrl ?? null,
			isLoading: false,
			hasResolvedSubscription: options?.markResolved ?? true,
			lastSyncedAt: Date.now(),
			syncError: null,
		});
	},
	markSyncError: (message) =>
		set({
			isLoading: false,
			hasResolvedSubscription: true,
			syncError: message,
		}),
	resetForSignedOut: () => set(initialState),
}));
