import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { SubscriptionTier } from "@/lib/subscriptionShared";

const SUBSCRIPTION_CACHE_PREFIX = "promptpal-subscription-status";

export type CachedSubscriptionStatus = {
	tier: SubscriptionTier;
	managementUrl: string | null;
};

function getSubscriptionCacheKey(userId: string): string {
	return `${SUBSCRIPTION_CACHE_PREFIX}:${userId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isSubscriptionTier(value: unknown): value is SubscriptionTier {
	return value === "free" || value === "pro";
}

async function getStoredValue(key: string): Promise<string | null> {
	if (Platform.OS === "web" && typeof window !== "undefined") {
		return window.localStorage.getItem(key);
	}

	return SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string): Promise<void> {
	if (Platform.OS === "web" && typeof window !== "undefined") {
		window.localStorage.setItem(key, value);
		return;
	}

	await SecureStore.setItemAsync(key, value);
}

export async function readCachedSubscriptionStatus(
	userId: string,
): Promise<CachedSubscriptionStatus | null> {
	try {
		const rawValue = await getStoredValue(getSubscriptionCacheKey(userId));
		if (!rawValue) {
			return null;
		}

		const parsed = JSON.parse(rawValue) as unknown;
		if (!isRecord(parsed) || !isSubscriptionTier(parsed.tier)) {
			return null;
		}

		return {
			tier: parsed.tier,
			managementUrl:
				typeof parsed.managementUrl === "string" ? parsed.managementUrl : null,
		};
	} catch {
		return null;
	}
}

export async function writeCachedSubscriptionStatus(
	userId: string,
	status: CachedSubscriptionStatus,
): Promise<void> {
	try {
		await setStoredValue(getSubscriptionCacheKey(userId), JSON.stringify(status));
	} catch {
		// Cache persistence failures should not block the live subscription state.
	}
}
