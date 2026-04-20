import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ClerkProviderWrapper, useAuth } from "@/lib/clerk";
import { validateEnvironment } from "@/lib/env";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { clearAuth, refreshAuth } from "@/lib/convex-client";
import {
	initializeAnalytics,
	logSessionEnded,
	logSessionStarted,
} from "@/lib/analytics";
import { useSubscriptionStore } from "@/features/subscription/store";
import {
	configureRevenueCat,
	getCustomerInfo,
	getEntitlementKey,
	getManagementUrl,
	isProEntitled,
	isSubscriptionFeatureAvailable,
	syncCurrentUserSubscription,
} from "@/lib/subscriptions";
import { trackRevenueLifecycle, trackUsageLimitApproachingOnce } from "@/lib/revenueAnalytics";
import { useUsage } from "@/lib/usage";
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
	const applySubscriptionStatus = useSubscriptionStore(
		(state) => state.applyStatus,
	);
	const markSubscriptionSyncError = useSubscriptionStore(
		(state) => state.markSyncError,
	);
	const resetSubscriptionForSignedOut = useSubscriptionStore(
		(state) => state.resetForSignedOut,
	);
	const usage = useUsage();
	const sessionStartRef = useRef<number | null>(null);
	const hasStartedSessionRef = useRef(false);

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
			applySubscriptionStatus({
				tier: "free",
				managementUrl: null,
			});
			return;
		}

		let cancelled = false;

		const syncSubscription = async () => {
			beginSubscriptionSync();

			try {
				await refreshAuth();
				await configureRevenueCat(userId);
				const customerInfo = await getCustomerInfo().catch(() => null);
				await trackRevenueLifecycle(customerInfo, getEntitlementKey());
				const status = await syncCurrentUserSubscription();
				if (!cancelled) {
					applySubscriptionStatus(status);
				}
			} catch (error) {
				const localCustomerInfo = await getCustomerInfo().catch(() => null);
				if (cancelled) {
					return;
				}

				if (localCustomerInfo) {
					applySubscriptionStatus({
						tier: isProEntitled(localCustomerInfo) ? "pro" : "free",
						managementUrl: getManagementUrl(localCustomerInfo),
					});
					return;
				}

				markSubscriptionSyncError(
					error instanceof Error
						? error.message
						: "Failed to sync subscription status.",
				);
				applySubscriptionStatus({
					tier: "free",
					managementUrl: null,
				});
			}
		};

		void syncSubscription();

		return () => {
			cancelled = true;
		};
	}, [
		applySubscriptionStatus,
		beginSubscriptionSync,
		isLoaded,
		isSignedIn,
		markSubscriptionSyncError,
		resetSubscriptionForSignedOut,
		userId,
	]);

	useEffect(() => {
		void trackUsageLimitApproachingOnce(usage);
	}, [usage]);

	// Validate environment variables on app startup (non-blocking in development)
	useEffect(() => {
		try {
			validateEnvironment();
		} catch (error) {
			// Avoid hard-aborting startup from environment validation in release builds.
			console.error("[Environment]", error);
		}
	}, []);

	useEffect(() => {
		initializeAnalytics();
	}, []);

	useEffect(() => {
		if (!hasStartedSessionRef.current) {
			hasStartedSessionRef.current = true;
			sessionStartRef.current = Date.now();
			logSessionStarted({ source: "app_launch" });
		}

		const subscription = AppState.addEventListener("change", (nextState) => {
			if (nextState === "active") {
				sessionStartRef.current = Date.now();
				logSessionStarted({ source: "app_foreground" });
				return;
			}

			if (sessionStartRef.current) {
				logSessionEnded({
					durationSeconds: Math.max(
						1,
						Math.round((Date.now() - sessionStartRef.current) / 1000),
					),
					reason: nextState,
				});
				sessionStartRef.current = null;
			}
		});

		return () => {
			subscription.remove();
		};
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
