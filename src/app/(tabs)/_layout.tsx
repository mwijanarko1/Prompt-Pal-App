import { SubscriptionAccessGuard } from "@/components/SubscriptionAccessGuard";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import { useOnboardingStore } from "@/features/onboarding/store";
import { PreOnboardingFlow } from "@/features/pre-onboarding/PreOnboardingFlow";
import { usePreOnboardingStore } from "@/features/pre-onboarding/store";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	DynamicColorIOS,
	Platform,
	Text,
	useColorScheme,
	View,
} from "react-native";

const TAB_CONTENT_STYLE = { backgroundColor: "transparent" } as const;

function iosDynamicColor(light: string, dark: string) {
	if (Platform.OS !== "ios") {
		return undefined;
	}

	return DynamicColorIOS({ light, dark });
}

function TabShellFallback({ message }: { message: string }) {
	return (
		<View className="flex-1 items-center justify-center bg-background px-6">
			<View className="mb-6 flex-row items-center">
				<Text className="text-primary text-4xl font-bold">Prompt</Text>
				<Text className="text-secondary text-4xl font-bold">Pal</Text>
			</View>
			<ActivityIndicator size="large" color="#FF6B00" />
			<Text className="mt-4 text-center text-base text-onSurfaceVariant">
				{message}
			</Text>
		</View>
	);
}

function NativeTabShell() {
	const scheme = useColorScheme();
	const navigationTheme = scheme === "dark" ? DarkTheme : DefaultTheme;

	return (
		<ThemeProvider value={navigationTheme}>
			<Tabs
				screenOptions={{
					headerShown: false,
					tabBarActiveTintColor: "#58CC02",
					tabBarInactiveTintColor: "#8E8E93",
					tabBarStyle: {
						backgroundColor: "#FFFFFF",
						borderTopWidth: 1,
						borderTopColor: "#E5E5E5",
						height: Platform.OS === "ios" ? 88 : 68,
						paddingBottom: Platform.OS === "ios" ? 30 : 10,
					},
					tabBarLabelStyle: {
						fontFamily: "DIN Round Pro",
						fontWeight: "700",
						fontSize: 12,
					},
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						tabBarLabel: "Quests",
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons
								name={focused ? "compass" : "compass-outline"}
								size={size ?? 24}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name="ranking"
					options={{
						tabBarLabel: "Rank",
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons
								name={focused ? "trophy" : "trophy-outline"}
								size={size ?? 24}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name="cart"
					options={{
						tabBarLabel: "Store",
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons
								name={focused ? "bag" : "bag-outline"}
								size={size ?? 24}
								color={color}
							/>
						),
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						tabBarLabel: "Profile",
						tabBarIcon: ({ color, focused, size }) => (
							<Ionicons
								name={focused ? "person" : "person-outline"}
								size={size ?? 24}
								color={color}
							/>
						),
					}}
				/>
				{/* Hidden tabs */}
				<Tabs.Screen
					name="library"
					options={{
						href: null,
					}}
				/>
			</Tabs>
		</ThemeProvider>
	);
}

function TabsNavigator() {
	// Pre-onboarding state
	const hasCompletedPreOnboarding = usePreOnboardingStore(
		(state) => state.hasCompletedPreOnboarding,
	);
	const showNewUI = usePreOnboardingStore((state) => state.showNewUI);
	const forceSkipOnboarding = usePreOnboardingStore((state) => state.forceSkipOnboarding);
	const [hasPreHydrated, setHasPreHydrated] = useState(() =>
		usePreOnboardingStore.persist.hasHydrated(),
	);

	useEffect(() => {
		const syncPreHydration = () => {
			setHasPreHydrated(usePreOnboardingStore.persist.hasHydrated());
		};
		syncPreHydration();
		const unsub =
			usePreOnboardingStore.persist.onFinishHydration(syncPreHydration);
		return unsub;
	}, []);

	useEffect(() => {
		if (hasPreHydrated) {
			// Keep the imported UI flow enabled if persisted flags drift out of sync.
			if (hasCompletedPreOnboarding && (!showNewUI || !forceSkipOnboarding)) {
				usePreOnboardingStore.getState().finishPreOnboarding();
			}
		}
	}, [hasPreHydrated, hasCompletedPreOnboarding, showNewUI]);

	// Existing onboarding state
	const hasCompletedOnboarding = useOnboardingStore(
		(state) => state.hasCompletedOnboarding,
	);
	const [hasHydrated, setHasHydrated] = useState(() =>
		useOnboardingStore.persist.hasHydrated(),
	);

	useEffect(() => {
		const syncHydrationState = () => {
			setHasHydrated(useOnboardingStore.persist.hasHydrated());
		};
		syncHydrationState();
		const unsubscribe =
			useOnboardingStore.persist.onFinishHydration(syncHydrationState);
		return unsubscribe;
	}, []);

	// Wait for both stores to hydrate
	if (!hasPreHydrated || !hasHydrated) {
		return <TabShellFallback message="Restoring your learning space..." />;
	}

	// Show pre-onboarding first (new screens)
	if (!hasCompletedPreOnboarding) {
		return <PreOnboardingFlow />;
	}

	// Then show gamified onboarding
	if (!hasCompletedOnboarding && !forceSkipOnboarding) {
		return <OnboardingFlow />;
	}

	return (
		<SubscriptionAccessGuard>
			<NativeTabShell />
		</SubscriptionAccessGuard>
	);
}

function TabLayoutWithAuth() {
	const { isSignedIn, isLoaded } = useAuth();

	if (!isLoaded) {
		return <TabShellFallback message="Checking your account..." />;
	}

	if (!isSignedIn) {
		return <Redirect href="/(auth)/sign-in" />;
	}

	return <TabsNavigator />;
}

export default function TabLayout() {
	const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
	const isClerkConfigured =
		!!publishableKey && publishableKey !== "your_clerk_publishable_key_here";
	return !isClerkConfigured ? <TabsNavigator /> : <TabLayoutWithAuth />;
}
