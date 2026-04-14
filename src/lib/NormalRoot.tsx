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
import { useOnboardingStore } from "@/features/onboarding/store";
import { usePreOnboardingStore } from "@/features/pre-onboarding/store";
import { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
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
	const applySubscriptionStatus = useSubscriptionStore(
		(state) => state.applyStatus,
	);
	const markSubscriptionSyncError = useSubscriptionStore(
		(state) => state.markSyncError,
	);
	const resetSubscriptionForSignedOut = useSubscriptionStore(
		(state) => state.resetForSignedOut,
	);
	const resetOnboarding = useOnboardingStore((state) => state.resetOnboarding);
	const completeOnboarding = useOnboardingStore(
		(state) => state.completeOnboarding,
	);
	const setOnboardingUserId = useOnboardingStore((state) => state.setUserId);
	const onboardingUserId = useOnboardingStore((state) => state.userId);

	const resetPreOnboarding = usePreOnboardingStore(
		(state) => state.resetPreOnboarding,
	);
	const completePreOnboarding = usePreOnboardingStore(
		(state) => state.completePreOnboarding,
	);
	const setPreOnboardingUserId = usePreOnboardingStore(
		(state) => state.setUserId,
	);
	const preOnboardingUserId = usePreOnboardingStore((state) => state.userId);
	const convex = useConvex();

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
		resetOnboarding();
		resetPreOnboarding();
	}, [
		isLoaded,
		isSignedIn,
		resetSubscriptionForSignedOut,
		resetOnboarding,
		resetPreOnboarding,
	]);

	// New User / Returning User detection logic
	useEffect(() => {
		if (!isLoaded || !isSignedIn || !userId) {
			return;
		}

		// 1. Check for userId mismatch (different user on same device)
		if (userId !== onboardingUserId || userId !== preOnboardingUserId) {
			console.log("[Onboarding] User mismatch or first session for", userId);

			// 2. Check backend to see if this is actually a new user or returning user
			const syncUserState = async () => {
				try {
					const stats = await convex.query(api.queries.getMyUserStatistics);
					const isNewUser = !stats || stats.totalXp === 0;

					if (isNewUser) {
						console.log("[Onboarding] Detected NEW user. Resetting flow.");
						resetOnboarding();
						resetPreOnboarding();
					} else {
						console.log("[Onboarding] Detected RETURNING user. Skipping flow.");
						completeOnboarding();
						completePreOnboarding();
					}

					// Always set the current userId once checked
					setOnboardingUserId(userId);
					setPreOnboardingUserId(userId);
				} catch (error) {
					console.error("[Onboarding] Failed to sync user state", error);
				}
			};

			void syncUserState();
		}
	}, [
		isLoaded,
		isSignedIn,
		userId,
		onboardingUserId,
		preOnboardingUserId,
		resetOnboarding,
		resetPreOnboarding,
		completeOnboarding,
		completePreOnboarding,
		setOnboardingUserId,
		setPreOnboardingUserId,
		convex,
	]);

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
