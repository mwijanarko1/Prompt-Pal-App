import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
	logLandingPageViewed,
	logSuperpromptHomeGenerateTapped,
	logSuperpromptHomeTrainTapped,
} from "@/lib/analytics";
import { useEffect } from "react";

function MainLanding() {
	const router = useRouter();

	useEffect(() => {
		logLandingPageViewed({ route: "/" });
	}, []);

	return (
		<SafeAreaView
			className="flex-1 bg-background"
			edges={["top", "left", "right"]}
		>
			<View className="flex-1 px-6 pt-14 pb-10 justify-center">
				<Text className="text-onSurface text-4xl font-black tracking-tight mb-10">
					PromptPal
				</Text>
				<Text className="text-onSurfaceVariant text-base font-semibold leading-6 mb-8">
					Start in Train for your dashboard, quests, modules, XP, and streaks.
					Use Generate when you only need a finished prompt.
				</Text>

				<Pressable
					onPress={() => {
						logSuperpromptHomeTrainTapped();
						router.push("/train");
					}}
					className="rounded-[28px] border border-outline/15 bg-surface p-6 mb-5 active:opacity-90"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-4">
							<Text className="text-onSurface text-2xl font-black mb-2">Train</Text>
							<Text className="text-onSurfaceVariant text-sm font-medium leading-5">
								Open the full learning dashboard with quests, modules, XP, and
								streaks.
							</Text>
						</View>
						<View className="w-12 h-12 rounded-full bg-primary/15 items-center justify-center">
							<Ionicons name="school-outline" size={26} color="#FF6B00" />
						</View>
					</View>
				</Pressable>

				<Pressable
					onPress={() => {
						logSuperpromptHomeGenerateTapped();
						router.push("/generate");
					}}
					className="rounded-[28px] border border-outline/15 bg-surface p-6 active:opacity-90"
				>
					<View className="flex-row items-center justify-between">
						<View className="flex-1 pr-4">
							<Text className="text-onSurface text-2xl font-black mb-2">
								Generate
							</Text>
							<Text className="text-onSurfaceVariant text-sm font-medium leading-5">
								Turn an idea into a ready-to-use prompt.
							</Text>
						</View>
						<View className="w-12 h-12 rounded-full bg-secondary/15 items-center justify-center">
							<Ionicons name="sparkles-outline" size={26} color="#4151FF" />
						</View>
					</View>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

function IndexWithAuth() {
	const { isLoaded, isSignedIn } = useAuth();

	// Show loading state while auth is being determined (returning null causes white screen)
	if (!isLoaded) {
		return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#0B1220",
				}}
			>
				<Text
					style={{
						color: "#FF6B00",
						fontSize: 32,
						fontWeight: "bold",
						marginBottom: 16,
					}}
				>
					Prompt
				</Text>
				<Text
					style={{
						color: "#4F46E5",
						fontSize: 32,
						fontWeight: "bold",
						marginBottom: 24,
					}}
				>
					Pal
				</Text>
				<ActivityIndicator size="large" color="#FF6B00" />
				<Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 16 }}>
					Loading...
				</Text>
			</View>
		);
	}

	// Redirect authenticated users to the home page (tabs layout)
	if (isSignedIn) {
		return <MainLanding />;
	}

	// Redirect unauthenticated users to sign-in
	return <Redirect href="/(auth)/sign-in" />;
}

export default function IndexScreen() {
	const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
	const isClerkConfigured =
		!!publishableKey && publishableKey !== "your_clerk_publishable_key_here";

	if (!isClerkConfigured) {
		return <MainLanding />;
	}

	return <IndexWithAuth />;
}
