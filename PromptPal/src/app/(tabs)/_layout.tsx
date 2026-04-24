import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import { useOnboardingStore } from "@/features/onboarding/store";
import { SubscriptionAccessGuard } from "@/components/SubscriptionAccessGuard";

const TabsShell =
	Platform.OS === "web"
		? // eslint-disable-next-line @typescript-eslint/no-var-requires
			require("./TabsShell").TabsShell
		: // eslint-disable-next-line @typescript-eslint/no-var-requires
			require("./TabsShell.native").TabsShell;

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

function TabsNavigator() {
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

	if (!hasHydrated) {
		return <TabShellFallback message="Restoring your learning space..." />;
	}

	if (!hasCompletedOnboarding) {
		return <OnboardingFlow />;
	}

	return (
		<SubscriptionAccessGuard>
			<TabsShell />
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
