import { beforeEach, describe, expect, it, jest } from "@jest/globals";

jest.mock("@/lib/subscriptionTierCache", () => ({
	readCachedSubscriptionStatus: jest.fn(),
	writeCachedSubscriptionStatus: jest.fn(),
}));

import { useSubscriptionStore } from "@/features/subscription/store";
import {
	readCachedSubscriptionStatus,
	writeCachedSubscriptionStatus,
} from "@/lib/subscriptionTierCache";

const mockedReadCachedSubscriptionStatus = jest.mocked(
	readCachedSubscriptionStatus,
);
const mockedWriteCachedSubscriptionStatus = jest.mocked(
	writeCachedSubscriptionStatus,
);

describe("subscription store", () => {
	beforeEach(() => {
		useSubscriptionStore.getState().resetForSignedOut();
		mockedReadCachedSubscriptionStatus.mockReset();
		mockedWriteCachedSubscriptionStatus.mockReset();
	});

	it("hydrates cached status without resolving the initial guard", async () => {
		mockedReadCachedSubscriptionStatus.mockResolvedValue({
			tier: "pro",
			managementUrl: "https://example.com/manage",
		});

		await useSubscriptionStore.getState().hydrateFromCache("user_123");

		expect(useSubscriptionStore.getState()).toMatchObject({
			tier: "pro",
			managementUrl: "https://example.com/manage",
			hasResolvedSubscription: false,
			isLoading: false,
		});
	});

	it("persists status updates and resolves subscription access", async () => {
		await useSubscriptionStore.getState().applyStatus(
			{
				tier: "pro",
				managementUrl: "https://example.com/manage",
			},
			{ userId: "user_123" },
		);

		expect(mockedWriteCachedSubscriptionStatus).toHaveBeenCalledWith(
			"user_123",
			{
				tier: "pro",
				managementUrl: "https://example.com/manage",
			},
		);
		expect(useSubscriptionStore.getState()).toMatchObject({
			tier: "pro",
			managementUrl: "https://example.com/manage",
			hasResolvedSubscription: true,
			isLoading: false,
			syncError: null,
		});
		expect(useSubscriptionStore.getState().lastSyncedAt).not.toBeNull();
	});

	it("marks sync errors as resolved without downgrading the cached tier", () => {
		useSubscriptionStore.setState({
			tier: "pro",
			isLoading: true,
			hasResolvedSubscription: false,
			managementUrl: "https://example.com/manage",
			lastSyncedAt: null,
			syncError: null,
		});

		useSubscriptionStore.getState().markSyncError("sync failed");

		expect(useSubscriptionStore.getState()).toMatchObject({
			tier: "pro",
			isLoading: false,
			hasResolvedSubscription: true,
			managementUrl: "https://example.com/manage",
			syncError: "sync failed",
		});
	});
});
