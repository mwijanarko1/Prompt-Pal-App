import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	DynamicColorIOS,
	Platform,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { OnboardingFlow } from "@/features/onboarding/OnboardingFlow";
import { useOnboardingStore } from "@/features/onboarding/store";
import { SubscriptionAccessGuard } from "@/components/SubscriptionAccessGuard";

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
			<NativeTabs
				backgroundColor="transparent"
				tintColor={iosDynamicColor("#111827", "#FFFFFF")}
				labelStyle={{
					default: {
						color: iosDynamicColor("#6B7280", "#94A3B8"),
						fontSize: 12,
					},
					selected: {
						color: iosDynamicColor("#111827", "#F9FAFB"),
						fontSize: 12,
						fontWeight: "600",
					},
				}}
			>
				<NativeTabs.Trigger name="index" contentStyle={TAB_CONTENT_STYLE}>
					<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "house", selected: "house.fill" }}
						md="home"
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger
					name="library"
					hidden
					contentStyle={TAB_CONTENT_STYLE}
				>
					<NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "book", selected: "book.fill" }}
						md="menu_book"
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger
					name="ranking"
					hidden
					contentStyle={TAB_CONTENT_STYLE}
				>
					<NativeTabs.Trigger.Label>Ranking</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "trophy", selected: "trophy.fill" }}
						md="emoji_events"
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="profile" contentStyle={TAB_CONTENT_STYLE}>
					<NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "person", selected: "person.fill" }}
						md="person"
					/>
				</NativeTabs.Trigger>
			</NativeTabs>
		</ThemeProvider>
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

	const tabContent = !hasCompletedOnboarding ? (
		<OnboardingFlow />
	) : (
		<NativeTabShell />
	);

	return (
		<SubscriptionAccessGuard>
			{tabContent}
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
