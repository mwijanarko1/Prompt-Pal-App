import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type {
	CustomerInfo,
	PurchasesEntitlementInfo,
} from "react-native-purchases";
import {
	logSubscriptionCancelled,
	logSubscriptionStarted,
	logTrialDayX,
	logTrialExpired,
	logTrialStarted,
	logUsageLimitApproaching,
} from "@/lib/analytics";
import type { UsageStats } from "@/lib/usage";

const STORAGE_KEY = "promptpal_revenue_analytics_state";
const MILLIS_PER_DAY = 24 * 60 * 60 * 1000;

type RevenueAnalyticsState = {
	lastTrialStartedAt: string | null;
	lastTrialDayTracked: number | null;
	lastTrialExpirationDate: string | null;
	lastTrialExpiredAt: string | null;
	lastSubscriptionStartedAt: string | null;
	lastUnsubscribeDetectedAt: string | null;
	lastUsageLimitPeriodKey: string | null;
	lastUsageLimitKinds: string[];
};

const defaultState: RevenueAnalyticsState = {
	lastTrialStartedAt: null,
	lastTrialDayTracked: null,
	lastTrialExpirationDate: null,
	lastTrialExpiredAt: null,
	lastSubscriptionStartedAt: null,
	lastUnsubscribeDetectedAt: null,
	lastUsageLimitPeriodKey: null,
	lastUsageLimitKinds: [],
};

async function getStorageItem(name: string) {
	try {
		if (Platform.OS === "web" && typeof window !== "undefined") {
			return window.localStorage.getItem(name);
		}
		return await SecureStore.getItemAsync(name);
	} catch {
		return null;
	}
}

async function setStorageItem(name: string, value: string) {
	try {
		if (Platform.OS === "web" && typeof window !== "undefined") {
			window.localStorage.setItem(name, value);
			return;
		}
		await SecureStore.setItemAsync(name, value);
	} catch {}
}

async function loadState(): Promise<RevenueAnalyticsState> {
	const raw = await getStorageItem(STORAGE_KEY);
	if (!raw) {
		return { ...defaultState };
	}

	try {
		return {
			...defaultState,
			...(JSON.parse(raw) as Partial<RevenueAnalyticsState>),
		};
	} catch {
		return { ...defaultState };
	}
}

async function saveState(state: RevenueAnalyticsState) {
	await setStorageItem(STORAGE_KEY, JSON.stringify(state));
}

function getPrimaryEntitlement(
	customerInfo: CustomerInfo | null,
	entitlementKey: string,
): PurchasesEntitlementInfo | null {
	return customerInfo?.entitlements?.all?.[entitlementKey] ?? null;
}

export async function trackRevenueLifecycle(
	customerInfo: CustomerInfo | null,
	entitlementKey: string,
) {
	const state = await loadState();
	const entitlement = getPrimaryEntitlement(customerInfo, entitlementKey);
	const nextState = { ...state };

	if (entitlement?.isActive && entitlement.periodType === "TRIAL") {
		if (state.lastTrialStartedAt !== entitlement.originalPurchaseDate) {
			logTrialStarted({
				productId: entitlement.productIdentifier,
				expirationDate: entitlement.expirationDate || undefined,
			});
			nextState.lastTrialStartedAt = entitlement.originalPurchaseDate;
			nextState.lastTrialDayTracked = null;
		}

		const trialStartMillis = entitlement.originalPurchaseDateMillis;
		if (trialStartMillis > 0) {
			const trialDay =
				Math.floor((Date.now() - trialStartMillis) / MILLIS_PER_DAY) + 1;
			if (state.lastTrialDayTracked !== trialDay) {
				logTrialDayX({
					day: trialDay,
					productId: entitlement.productIdentifier,
				});
				nextState.lastTrialDayTracked = trialDay;
			}
		}

		nextState.lastTrialExpirationDate = entitlement.expirationDate;
	} else if (
		state.lastTrialStartedAt &&
		state.lastTrialExpirationDate &&
		state.lastTrialExpiredAt !== state.lastTrialExpirationDate
	) {
		const expiredAtMillis = Date.parse(state.lastTrialExpirationDate);
		if (!Number.isNaN(expiredAtMillis) && expiredAtMillis <= Date.now()) {
			logTrialExpired({
				expirationDate: state.lastTrialExpirationDate,
			});
			nextState.lastTrialExpiredAt = state.lastTrialExpirationDate;
		}
	}

	if (
		entitlement?.isActive &&
		entitlement.periodType !== "TRIAL" &&
		state.lastSubscriptionStartedAt !== entitlement.latestPurchaseDate
	) {
		logSubscriptionStarted({
			productId: entitlement.productIdentifier,
			periodType: entitlement.periodType,
			priceId: entitlement.productPlanIdentifier || undefined,
		});
		nextState.lastSubscriptionStartedAt = entitlement.latestPurchaseDate;
	}

	if (
		entitlement?.unsubscribeDetectedAt &&
		state.lastUnsubscribeDetectedAt !== entitlement.unsubscribeDetectedAt
	) {
		logSubscriptionCancelled({
			productId: entitlement.productIdentifier,
			cancelledAt: entitlement.unsubscribeDetectedAt,
		});
		nextState.lastUnsubscribeDetectedAt = entitlement.unsubscribeDetectedAt;
	}

	await saveState(nextState);
}

export async function trackUsageLimitApproachingOnce(usage: UsageStats | null) {
	if (!usage) {
		return;
	}

	const kinds: string[] = [];
	const textUsageRatio =
		usage.limits.textCalls > 0 ? usage.used.textCalls / usage.limits.textCalls : 0;
	const imageUsageRatio =
		usage.limits.imageCalls > 0
			? usage.used.imageCalls / usage.limits.imageCalls
			: 0;

	if (textUsageRatio >= 0.8) {
		kinds.push("text");
	}
	if (imageUsageRatio >= 0.8) {
		kinds.push("image");
	}

	if (kinds.length === 0) {
		return;
	}

	const state = await loadState();
	const periodKey = `${usage.periodStart}-${usage.periodEnd}`;
	const previouslyTrackedKinds =
		state.lastUsageLimitPeriodKey === periodKey ? state.lastUsageLimitKinds : [];
	const newKinds = kinds.filter((kind) => !previouslyTrackedKinds.includes(kind));

	if (newKinds.length === 0) {
		return;
	}

	for (const kind of newKinds) {
		const percentage =
			kind === "text" ? Math.round(textUsageRatio * 100) : Math.round(imageUsageRatio * 100);
		logUsageLimitApproaching({
			kind,
			percentage,
			tier: usage.tier,
		});
	}

	await saveState({
		...state,
		lastUsageLimitPeriodKey: periodKey,
		lastUsageLimitKinds: Array.from(
			new Set([...previouslyTrackedKinds, ...newKinds]),
		),
	});
}
