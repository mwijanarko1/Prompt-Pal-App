import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getTierFromRevenueCatSubscriber } from "../src/lib/subscriptionShared";

const REVENUECAT_API_BASE_URL = "https://api.revenuecat.com/v1";
const REVENUECAT_API_KEY =
	process.env.REVENUECAT_API_KEY?.trim() ??
	process.env.REVENUECAT_PUBLIC_API_KEY?.trim() ??
	"";
const REVENUECAT_ENTITLEMENT_KEY =
	process.env.REVENUECAT_ENTITLEMENT_KEY?.trim() ?? "PromptPal Pro";

type RevenueCatSubscriberResponse = {
	subscriber?: {
		entitlements?: Record<
			string,
			{
				expires_date?: string | null;
			}
		>;
		management_url?: string | null;
	};
};

type SubscriptionSyncResult = {
	tier: "free" | "pro";
	isEntitled: boolean;
	managementUrl: string | null;
	source: "backend" | "not_found" | "unconfigured";
};

export const syncCurrentUserSubscription = action({
	args: {
		appId: v.string(),
	},
	handler: async (ctx, args): Promise<SubscriptionSyncResult> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error("Not authenticated");
		}

		const userId = identity.subject;

		if (!REVENUECAT_API_KEY) {
			const existingTier = (await ctx.runQuery(
				internal.queries.getUserPlanTier,
				{
					userId,
					appId: args.appId,
				},
			)) as "free" | "pro";

			return {
				tier: existingTier,
				isEntitled: existingTier === "pro",
				managementUrl: null,
				source: "unconfigured" as const,
			};
		}

		const response = await fetch(
			`${REVENUECAT_API_BASE_URL}/subscribers/${encodeURIComponent(userId)}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${REVENUECAT_API_KEY}`,
					"Content-Type": "application/json",
				},
			},
		);

		if (response.status === 404) {
			await ctx.runMutation(internal.mutations.updateUserPlan, {
				userId,
				appId: args.appId,
				tier: "free",
			});

			return {
				tier: "free" as const,
				isEntitled: false,
				managementUrl: null,
				source: "not_found" as const,
			};
		}

		if (!response.ok) {
			throw new Error(
				`RevenueCat subscriber lookup failed (${response.status})`,
			);
		}

		const payload =
			(await response.json()) as RevenueCatSubscriberResponse | null;
		const tier = getTierFromRevenueCatSubscriber(
			payload?.subscriber?.entitlements,
			REVENUECAT_ENTITLEMENT_KEY,
		);

		await ctx.runMutation(internal.mutations.updateUserPlan, {
			userId,
			appId: args.appId,
			tier,
		});

		return {
			tier,
			isEntitled: tier === "pro",
			managementUrl:
				typeof payload?.subscriber?.management_url === "string"
					? payload.subscriber.management_url
					: null,
			source: "backend" as const,
		};
	},
});
