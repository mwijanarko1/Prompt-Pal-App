export type SubscriptionTier = "free" | "pro";

type CustomerInfoLike = {
	entitlements?: {
		active?: Record<string, unknown>;
	};
};

type RevenueCatSubscriberEntitlement = {
	expires_date?: string | null;
} | null;

export function tierFromEntitlementFlag(isEntitled: boolean): SubscriptionTier {
	return isEntitled ? "pro" : "free";
}

export function getTierFromCustomerInfo(
	customerInfo: CustomerInfoLike | null | undefined,
	entitlementKey: string,
): SubscriptionTier {
	const activeEntitlements = customerInfo?.entitlements?.active;
	return tierFromEntitlementFlag(Boolean(activeEntitlements?.[entitlementKey]));
}

export function getTierFromRevenueCatSubscriber(
	entitlements:
		| Record<string, RevenueCatSubscriberEntitlement>
		| null
		| undefined,
	entitlementKey: string,
	now = Date.now(),
): SubscriptionTier {
	const entitlement = entitlements?.[entitlementKey];
	if (!entitlement) {
		return "free";
	}

	const expiresAt = entitlement.expires_date;
	if (!expiresAt) {
		return "pro";
	}

	const parsedExpiry = Date.parse(expiresAt);
	if (Number.isNaN(parsedExpiry)) {
		return "pro";
	}

	return tierFromEntitlementFlag(parsedExpiry > now);
}
