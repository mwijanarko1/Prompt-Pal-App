import { NativeModules, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import Purchases, {
	LOG_LEVEL,
	type PurchasesPackage,
} from "react-native-purchases";
import { convexHttpClient } from "@/lib/convex-client";
import { api } from "../../convex/_generated/api.js";
import {
	getTierFromCustomerInfo,
	type SubscriptionTier,
} from "@/lib/subscriptionShared";

const APP_ID = "prompt-pal";
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim() ?? "";
const ENTITLEMENT_KEY =
	process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_KEY?.trim() || "PromptPal Pro";
const TERMS_OF_USE_URL =
	process.env.EXPO_PUBLIC_TERMS_OF_USE_URL?.trim() ||
	"https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const PRIVACY_POLICY_URL =
	process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() || null;

let isConfigured = false;
let configuredAppUserId: string | null = null;
let hasLoggedExpoGoFallback = false;

/**
 * Expo Go is StoreClient without expo-dev-client. `appOwnership` may be null on newer SDKs,
 * which would incorrectly allow RevenueCat.configure and produce "Invalid API key" noise.
 */
export function isRunningInExpoGo(): boolean {
	if (Constants.appOwnership === "expo") {
		return true;
	}
	const isStoreClient =
		Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
	const hasDevLauncher = Boolean(
		(NativeModules as { EXDevLauncher?: unknown }).EXDevLauncher,
	);
	return isStoreClient && !hasDevLauncher;
}

type CustomerInfoLike = {
	entitlements?: {
		active?: Record<string, unknown>;
	};
	managementURL?: string | null;
};

type SubscriptionSyncResponse = {
	tier: SubscriptionTier;
	isEntitled: boolean;
	managementUrl: string | null;
	source: "backend" | "not_found" | "unconfigured";
};

type StoreProductLike = {
	title?: string;
	description?: string;
	priceString?: string;
};

export type SubscriptionPackageOption = {
	identifier: string;
	title: string;
	description: string | null;
	price: string;
	packageType: "weekly" | "monthly" | "annual" | "lifetime" | "unknown";
	isFeatured: boolean;
};

export function getLegalUrls() {
	return {
		termsOfUseUrl: TERMS_OF_USE_URL,
		privacyPolicyUrl: PRIVACY_POLICY_URL,
	};
}

export function isSubscriptionFeatureAvailable(): boolean {
	// Expo Go cannot use native store billing; dev / prod builds use standalone or bare.
	return Platform.OS === "ios" && Boolean(IOS_API_KEY) && !isRunningInExpoGo();
}

export function isSubscriptionGateEnabled(): boolean {
	return (
		process.env.EXPO_PUBLIC_REQUIRE_SUBSCRIPTION === "1" &&
		isSubscriptionFeatureAvailable()
	);
}

export async function configureRevenueCat(
	appUserId?: string | null,
): Promise<boolean> {
	if (!isSubscriptionFeatureAvailable()) {
		if (
			Platform.OS === "ios" &&
			Boolean(IOS_API_KEY) &&
			isRunningInExpoGo() &&
			!hasLoggedExpoGoFallback
		) {
			console.info(
				"[RevenueCat] Expo Go detected. Skipping native RevenueCat configuration. Use a development build or Test Store key to test purchases.",
			);
			hasLoggedExpoGoFallback = true;
		}
		return false;
	}

	if (!isConfigured) {
		Purchases.setLogLevel(LOG_LEVEL.WARN);
		try {
			await Purchases.configure({
				apiKey: IOS_API_KEY,
				appUserID: appUserId || undefined,
			});
		} catch (error) {
			console.warn(
				"[RevenueCat] configure failed (invalid key or unsupported runtime).",
				error,
			);
			return false;
		}
		isConfigured = true;
		configuredAppUserId = appUserId ?? null;
		return true;
	}

	if (appUserId && configuredAppUserId !== appUserId) {
		try {
			await Purchases.logIn(appUserId);
			configuredAppUserId = appUserId;
		} catch (error) {
			console.warn("[RevenueCat] Failed to log in app user", error);
		}
	}

	return true;
}

export async function getCustomerInfo(): Promise<CustomerInfoLike | null> {
	if (!isConfigured) {
		return null;
	}

	return (await Purchases.getCustomerInfo()) as CustomerInfoLike;
}

export function isProEntitled(
	customerInfo: CustomerInfoLike | null | undefined,
): boolean {
	return getTierFromCustomerInfo(customerInfo, ENTITLEMENT_KEY) === "pro";
}

export function getManagementUrl(
	customerInfo: CustomerInfoLike | null | undefined,
): string | null {
	return typeof customerInfo?.managementURL === "string"
		? customerInfo.managementURL
		: null;
}

export async function syncCurrentUserSubscription(): Promise<SubscriptionSyncResponse> {
	return (await convexHttpClient.action(
		api.subscriptions.syncCurrentUserSubscription,
		{
			appId: APP_ID,
		},
	)) as SubscriptionSyncResponse;
}

function inferPackageType(
	identifier: string,
): SubscriptionPackageOption["packageType"] {
	const normalizedIdentifier = identifier.toLowerCase();

	if (normalizedIdentifier.includes("week")) {
		return "weekly";
	}
	if (
		normalizedIdentifier.includes("annual") ||
		normalizedIdentifier.includes("year")
	) {
		return "annual";
	}
	if (
		normalizedIdentifier.includes("month") ||
		normalizedIdentifier.includes("monthly")
	) {
		return "monthly";
	}
	if (normalizedIdentifier.includes("lifetime")) {
		return "lifetime";
	}
	return "unknown";
}

function getPackageLabel(
	identifier: string,
	productTitle?: string,
): string {
	if (productTitle?.trim()) {
		return productTitle.trim();
	}

	switch (inferPackageType(identifier)) {
		case "weekly":
			return "Weekly";
		case "monthly":
			return "Monthly";
		case "annual":
			return "Annual";
		case "lifetime":
			return "Lifetime";
		default:
			return "PromptPal Pro";
	}
}

async function getCurrentOfferingPackages(): Promise<PurchasesPackage[]> {
	if (!isConfigured) {
		throw new Error("RevenueCat is not configured");
	}

	const offerings = await Purchases.getOfferings();
	const current = offerings.current;
	return current?.availablePackages ?? [];
}

export async function getSubscriptionPackageOptions(): Promise<
	SubscriptionPackageOption[]
> {
	const packages = await getCurrentOfferingPackages();

	return packages
		.map((pkg) => {
			const product = (pkg.product ?? {}) as StoreProductLike;
			return {
				identifier: pkg.identifier,
				title: getPackageLabel(pkg.identifier, product.title),
				description: product.description?.trim() || null,
				price: product.priceString?.trim() || "",
				packageType: inferPackageType(pkg.identifier),
				isFeatured: pkg.identifier === "$rc_annual",
			};
		})
		.sort((left, right) => Number(right.isFeatured) - Number(left.isFeatured));
}

export async function purchaseSubscriptionPackage(
	packageIdentifier: string,
): Promise<CustomerInfoLike> {
	const packages = await getCurrentOfferingPackages();
	const targetPackage = packages.find(
		(candidate) => candidate.identifier === packageIdentifier,
	);

	if (!targetPackage) {
		throw new Error(`No package found for identifier: ${packageIdentifier}`);
	}

	const purchaseResult = await Purchases.purchasePackage(targetPackage);
	return purchaseResult.customerInfo as CustomerInfoLike;
}

export async function restorePurchases(): Promise<CustomerInfoLike> {
	if (!isConfigured) {
		throw new Error("RevenueCat is not configured");
	}

	return (await Purchases.restorePurchases()) as CustomerInfoLike;
}
