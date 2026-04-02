import { describe, expect, it } from "@jest/globals";
import {
	getTierFromCustomerInfo,
	getTierFromRevenueCatSubscriber,
	tierFromEntitlementFlag,
} from "@/lib/subscriptionShared";

describe("subscriptionShared", () => {
	it("maps boolean entitlement flags into subscription tiers", () => {
		expect(tierFromEntitlementFlag(true)).toBe("pro");
		expect(tierFromEntitlementFlag(false)).toBe("free");
	});

	it("reads active entitlements from RevenueCat customer info", () => {
		expect(
			getTierFromCustomerInfo(
				{
					entitlements: {
						active: {
							"PromptPal Pro": {},
						},
					},
				},
				"PromptPal Pro",
			),
		).toBe("pro");

		expect(
			getTierFromCustomerInfo(
				{
					entitlements: {
						active: {},
					},
				},
				"PromptPal Pro",
			),
		).toBe("free");
	});

	it("treats future REST entitlement expiry dates as active", () => {
		expect(
			getTierFromRevenueCatSubscriber(
				{
					"PromptPal Pro": {
						expires_date: "2099-01-01T00:00:00Z",
					},
				},
				"PromptPal Pro",
				Date.parse("2026-01-01T00:00:00Z"),
			),
		).toBe("pro");
	});

	it("treats past REST entitlement expiry dates as inactive", () => {
		expect(
			getTierFromRevenueCatSubscriber(
				{
					"PromptPal Pro": {
						expires_date: "2025-01-01T00:00:00Z",
					},
				},
				"PromptPal Pro",
				Date.parse("2026-01-01T00:00:00Z"),
			),
		).toBe("free");
	});
});
