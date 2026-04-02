import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ClerkProviderWrapper, useAuth } from "@/lib/clerk";
import { validateEnvironment } from "@/lib/env";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { clearAuth, refreshAuth } from "@/lib/convex-client";
import { useSubscriptionStore } from "@/features/subscription/store";
import {
	configureRevenueCat,
	getCustomerInfo,
	getManagementUrl,
	isProEntitled,
	isSubscriptionFeatureAvailable,
	syncCurrentUserSubscription,
} from "@/lib/subscriptions";
import "../app/global.css";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
	throw new Error(
		"EXPO_PUBLIC_CONVEX_URL is required. Set it via EAS: eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value <url>",
	);
}
const convex = new ConvexReactClient(convexUrl, {
	unsavedChangesWarning: false,
});

/**
 * Convex provider wrapper that uses Clerk's useAuth hook
 */
function ConvexProviderWrapper({ children }: { children: React.ReactNode }) {
	const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
	const isClerkConfigured =
		!!publishableKey && publishableKey !== "your_clerk_publishable_key_here";

	if (!isClerkConfigured) {
		return <ConvexProvider client={convex}>{children}</ConvexProvider>;
	}

	return (
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			{children}
		</ConvexProviderWithClerk>
	);
}

/**
 * Component that handles app initialization after Clerk provider is set up
 */
function AppInitializer() {
	const { isLoaded, isSignedIn, userId } = useAuth();
	const beginSubscriptionSync = useSubscriptionStore(
		(state) => state.beginSync,
	);
	const hydrateSubscriptionFromCache = useSubscriptionStore(
		(state) => state.hydrateFromCache,
	);
	const applySubscriptionStatus = useSubscriptionStore(
		(state) => state.applyStatus,
	);
	const markSubscriptionSyncError = useSubscriptionStore(
		(state) => state.markSyncError,
	);
	const resetSubscriptionForSignedOut = useSubscriptionStore(
		(state) => state.resetForSignedOut,
	);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		if (isSignedIn) {
			refreshAuth().catch((err) =>
				console.error("Failed to refresh Convex auth", err),
			);
			return;
		}

		clearAuth();
		resetSubscriptionForSignedOut();
	}, [isLoaded, isSignedIn, resetSubscriptionForSignedOut]);

	useEffect(() => {
		if (!isLoaded) {
			return;
		}

		if (!isSignedIn || !userId) {
			resetSubscriptionForSignedOut();
			return;
		}

		if (!isSubscriptionFeatureAvailable()) {
			void applySubscriptionStatus(
				{
					tier: "free",
					managementUrl: null,
				},
				{
					userId,
					markResolved: true,
				},
			);
			return;
		}

		let cancelled = false;

		const syncSubscription = async () => {
			await hydrateSubscriptionFromCache(userId);
			if (cancelled) {
				return;
			}

			beginSubscriptionSync();

			try {
				await refreshAuth();
				await configureRevenueCat(userId);
				const status = await syncCurrentUserSubscription();
				if (!cancelled) {
					await applySubscriptionStatus(status, {
						userId,
						markResolved: true,
					});
				}
			} catch (error) {
				const localCustomerInfo = await getCustomerInfo().catch(() => null);
				if (cancelled) {
					return;
				}

				if (localCustomerInfo) {
					await applySubscriptionStatus(
						{
							tier: isProEntitled(localCustomerInfo) ? "pro" : "free",
							managementUrl: getManagementUrl(localCustomerInfo),
						},
						{
							userId,
							markResolved: true,
						},
					);
					return;
				}

				markSubscriptionSyncError(
					error instanceof Error
						? error.message
						: "Failed to sync subscription status.",
				);
			}
		};

		void syncSubscription();

		return () => {
			cancelled = true;
		};
	}, [
		applySubscriptionStatus,
		beginSubscriptionSync,
		hydrateSubscriptionFromCache,
		isLoaded,
		isSignedIn,
		markSubscriptionSyncError,
		resetSubscriptionForSignedOut,
		userId,
	]);

	// Validate environment variables on app startup (non-blocking in development)
	useEffect(() => {
		try {
			validateEnvironment();
		} catch (error) {
			// Avoid hard-aborting startup from environment validation in release builds.
			console.error("[Environment]", error);
		}
	}, []);

	return (
		<SafeAreaProvider>
			<ErrorBoundary>
				<Stack
					screenOptions={{
						headerShown: false,
						animation: "none",
					}}
				>
					<Stack.Screen name="(tabs)" />
					<Stack.Screen name="(auth)" />
					<Stack.Screen name="paywall" />
					<Stack.Screen name="game" />
					<Stack.Screen name="library/[resourceId]" />
				</Stack>
				<StatusBar style="light" />
			</ErrorBoundary>
		</SafeAreaProvider>
	);
}

export default function NormalRoot() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ClerkProviderWrapper>
				<ConvexProviderWrapper>
					<AppInitializer />
				</ConvexProviderWrapper>
			</ClerkProviderWrapper>
		</GestureHandlerRootView>
	);
}
