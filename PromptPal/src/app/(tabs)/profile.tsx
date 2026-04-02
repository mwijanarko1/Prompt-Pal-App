import { useCallback, memo, useEffect, useMemo, useState } from "react";
import {
	View,
	Text,
	ScrollView,
	Pressable,
	Dimensions,
	ActivityIndicator,
	Alert,
	Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useClerk, useUser } from "@clerk/clerk-expo";
import { clearAuth, convexHttpClient, refreshAuth } from "@/lib/convex-client";
import { useUserProgressStore } from "@/features/user/store";
import { useOnboardingStore } from "@/features/onboarding/store";
import { api } from "../../../convex/_generated/api.js";
import Svg, { Circle } from "react-native-svg";
import { StatCard } from "@/components/ui";
import type { UsageStats } from "@/lib/usage";
import { useSubscriptionStore } from "@/features/subscription/store";
import {
	isExpoGoRuntime,
	isSubscriptionFeatureAvailable,
} from "@/lib/subscriptions";

const { width } = Dimensions.get("window");

// Circular progress component for usage quota
interface CircularProgressProps {
	size?: number;
	strokeWidth?: number;
	percentage?: number;
	label?: string;
	subLabel?: string;
	color?: string;
	isDark?: boolean;
}

const CircularProgress = memo(function CircularProgress({
	size = 100,
	strokeWidth = 8,
	percentage = 0,
	label = "",
	subLabel = "",
	color = "#FF6B00",
	isDark = true,
}: CircularProgressProps) {
	// Guard against invalid percentage
	const safePercentage =
		isNaN(percentage) || !isFinite(percentage)
			? 0
			: Math.min(100, Math.max(0, percentage));
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const strokeDashoffset =
		circumference - (safePercentage / 100) * circumference;
	const bgStroke = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

	return (
		<View style={{ width: size, alignItems: "center" }}>
			<View
				style={{
					width: size,
					height: size,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<Svg
					width={size}
					height={size}
					style={{ transform: [{ rotate: "-90deg" }] }}
				>
					{/* Background Circle */}
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke={bgStroke}
						strokeWidth={strokeWidth}
						fill="none"
					/>
					{/* Progress Circle */}
					<Circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						stroke={color}
						strokeWidth={strokeWidth}
						strokeDasharray={circumference}
						strokeDashoffset={strokeDashoffset}
						strokeLinecap="round"
						fill="none"
					/>
				</Svg>
				<View style={{ position: "absolute" }}>
					<Text className="text-onSurface text-xl font-black">
						{Math.round(safePercentage)}%
					</Text>
				</View>
			</View>
			<Text className="text-onSurface font-bold mt-3 text-sm">{label}</Text>
			<Text className="text-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest">
				{subLabel}
			</Text>
		</View>
	);
});

interface AchievementBadgeProps {
	icon: string;
	label: string;
	color: string;
	isLocked?: boolean;
}

const AchievementBadge = memo(function AchievementBadge({
	icon,
	label,
	color,
	isLocked = false,
}: AchievementBadgeProps) {
	return (
		<View className="items-center mr-6">
			<View
				className={`w-16 h-16 rounded-full items-center justify-center mb-3 ${isLocked ? "bg-surfaceVariant/10" : ""}`}
				style={{
					borderWidth: 1,
					borderColor: isLocked ? "rgba(255,255,255,0.1)" : color,
					backgroundColor: isLocked ? "transparent" : `${color}15`,
				}}
			>
				<Text style={{ fontSize: 24 }}>{icon}</Text>
			</View>
			<Text
				className={`text-[8px] font-black uppercase tracking-widest text-center ${isLocked ? "text-gray-600" : "text-onSurface"}`}
				numberOfLines={1}
				style={{ width: 64 }}
			>
				{label}
			</Text>
		</View>
	);
});

export default function ProfileScreen() {
	const { user } = useUser();
	const { isLoaded, isSignedIn } = useAuth();
	const { signOut } = useClerk();
	const router = useRouter();
	const colorScheme = useColorScheme();
	const isDark = colorScheme === "dark";
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);

	const { level } = useUserProgressStore();
	const canQueryProfile = isLoaded && isSignedIn;
	const [achievements, setAchievements] = useState<any[]>([]);
	const [userResults, setUserResults] = useState<{
		taskResults: Array<{ score?: number }>;
	}>({ taskResults: [] });
	const [usage, setUsage] = useState<UsageStats | null>(null);
	const [isProfileLoading, setIsProfileLoading] = useState(true);
	const subscriptionTier = useSubscriptionStore((state) => state.tier);
	const managementUrl = useSubscriptionStore((state) => state.managementUrl);

	useEffect(() => {
		if (!canQueryProfile) {
			setAchievements([]);
			setUserResults({ taskResults: [] });
			setUsage(null);
			setIsProfileLoading(true);
			return;
		}

		let isCancelled = false;

		const loadProfileData = async () => {
			setIsProfileLoading(true);

			try {
				await refreshAuth();
			} catch {
				// Continue with best-effort Convex queries.
			}

			try {
				const [achievementsResult, resultsResult, usageResult] =
					await Promise.allSettled([
						convexHttpClient.query(api.queries.getUserAchievements, {}),
						convexHttpClient.query(api.queries.getUserResults, {
							appId: "prompt-pal",
						}),
						convexHttpClient.query(api.queries.getUserUsage, {
							appId: "prompt-pal",
						}),
					]);

				if (isCancelled) {
					return;
				}

				setAchievements(
					achievementsResult.status === "fulfilled"
						? (achievementsResult.value ?? [])
						: [],
				);
				setUserResults(
					resultsResult.status === "fulfilled"
						? (resultsResult.value ?? { taskResults: [] })
						: { taskResults: [] },
				);
				setUsage(
					usageResult.status === "fulfilled" && usageResult.value
						? usageResult.value
						: {
								tier: "free",
								used: {
									textCalls: 0,
									imageCalls: 0,
									audioSummaries: 0,
								},
								limits: {
									textCalls: 0,
									imageCalls: 0,
									audioSummaries: 0,
								},
								periodStart: Date.now(),
								periodEnd: Date.now(),
							},
				);
			} catch (error) {
				if (!isCancelled) {
					console.error("Failed to load profile data:", error);
				}
			} finally {
				if (!isCancelled) {
					setIsProfileLoading(false);
				}
			}
		};

		void loadProfileData();

		return () => {
			isCancelled = true;
		};
	}, [canQueryProfile]);

	const isLoading = !isLoaded || isProfileLoading || usage === null;

	const totalPrompts = userResults?.taskResults?.length || 0;
	const avgAccuracy = useMemo(() => {
		if (!userResults?.taskResults?.length) return "0";
		const sum = userResults.taskResults.reduce(
			(acc, curr) => acc + (curr.score || 0),
			0,
		);
		return (sum / userResults.taskResults.length).toFixed(1);
	}, [userResults]);

	// Usage progress calculations
	const textUsagePercent =
		usage && usage.limits.textCalls > 0
			? (usage.used.textCalls / usage.limits.textCalls) * 100
			: 0;

	const isPro = usage?.tier === "pro" || subscriptionTier === "pro";
	const planName = isPro ? "Premium Pro" : "Explorer Free";
	const tierTitle = isPro ? "PROMPT MASTER" : "PROMPT NOVICE";
	const subscriptionAvailable = isSubscriptionFeatureAvailable();

	const renderAchievementItem = useCallback(
		({ item }: { item: any }) => (
			<AchievementBadge
				icon={item.icon}
				label={item.title}
				color="#FF6B00"
				isLocked={false}
			/>
		),
		[],
	);

	const deleteAccount = useCallback(async () => {
		if (!user || isDeletingAccount) {
			return;
		}

		setIsDeletingAccount(true);
		try {
			await convexHttpClient.mutation(api.mutations.deleteCurrentUserData, {});
			await user.delete();
			try {
				await signOut();
				clearAuth();
			} catch {
				// User deletion usually invalidates the session; explicit sign-out can fail safely.
			}
			router.replace("/");
		} catch (error) {
			console.error("Failed to delete account:", error);
			Alert.alert(
				"Delete Failed",
				"We could not delete your account right now. Please try again in a moment.",
			);
		} finally {
			setIsDeletingAccount(false);
		}
	}, [isDeletingAccount, router, signOut, user]);

	const handlePlanPress = useCallback(async () => {
		if (isPro && managementUrl) {
			const canOpen = await Linking.canOpenURL(managementUrl);
			if (canOpen) {
				await Linking.openURL(managementUrl);
				return;
			}
		}

		if (!subscriptionAvailable) {
			Alert.alert(
				"Unavailable on this device",
				isExpoGoRuntime()
					? "PromptPal Pro purchases need a development build or RevenueCat Test Store inside Expo Go."
					: "PromptPal Pro purchases are currently available on iPhone only.",
			);
			return;
		}

		router.push("/paywall");
	}, [isPro, managementUrl, router, subscriptionAvailable]);

	const confirmDeleteAccount = useCallback(() => {
		Alert.alert(
			"Delete Account",
			"This permanently deletes your PromptPal account and all associated app data. This action cannot be undone.",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: () => {
						void deleteAccount();
					},
				},
			],
		);
	}, [deleteAccount]);

	if (isLoading) {
		return (
			<SafeAreaView
				collapsable={false}
				className="flex-1 bg-background items-center justify-center"
				edges={["top", "left", "right"]}
			>
				<ActivityIndicator color="#FF6B00" size="large" />
				<Text className="text-onSurface mt-4 font-black">
					Scanning your trajectory…
				</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			collapsable={false}
			className="flex-1 bg-background"
			edges={["top", "left", "right"]}
		>
			{/* Fixed Header */}
			<View className="flex-row justify-center items-center px-6 pt-4 pb-4">
				<Text className="text-onSurface text-lg font-black uppercase tracking-[3px]">
					Profile
				</Text>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingBottom: 100 }}
			>
				<View className="items-center px-6">
					{/* Avatar Section */}
					<View className="mb-6 relative">
						<View className="w-32 h-32 rounded-full border-4 border-primary shadow-glow items-center justify-center p-1">
							<View className="w-full h-full rounded-full overflow-hidden bg-surfaceVariant">
								{user?.imageUrl ? (
									<Image
										source={{ uri: user.imageUrl }}
										style={{ width: "100%", height: "100%" }}
										contentFit="cover"
									/>
								) : (
									<View className="w-full h-full items-center justify-center">
										<Ionicons name="person" size={60} color="#9CA3AF" />
									</View>
								)}
							</View>
						</View>
						<View className="absolute bottom-0 right-0 bg-primary px-3 py-1 rounded-full border-2 border-background">
							<Text className="text-white text-xs font-black">Lv. {level}</Text>
						</View>
					</View>

					{/* User Info */}
					<Text className="text-onSurface text-3xl font-black mb-1">
						{user?.fullName || "Architect"}
					</Text>
					<View className="flex-row items-center mb-1">
						<Ionicons name="checkmark-circle" size={16} color="#FF6B00" />
						<Text className="text-primary text-[10px] font-black uppercase tracking-widest ml-1">
							{tierTitle}
						</Text>
					</View>
					<Text className="text-onSurfaceVariant text-[10px] font-bold uppercase tracking-widest opacity-60">
						Member since{" "}
						{new Date(user?.createdAt || Date.now()).toLocaleDateString(
							"en-US",
							{ month: "short", year: "numeric" },
						)}
					</Text>

					<View className="w-full mt-8 mb-6 rounded-3xl border border-primary/30 bg-primary/10 p-5">
						<View className="flex-row items-center justify-between">
							<View className="flex-1 pr-4">
								<Text className="text-primary text-[10px] font-black uppercase tracking-widest mb-1">
									Current Plan
								</Text>
								<Text className="text-onSurface text-lg font-black">
									{planName}
								</Text>
								<Text className="text-onSurfaceVariant text-xs mt-1">
									{subscriptionAvailable
										? isPro
											? "Manage your subscription or restore purchases."
											: "Upgrade on iPhone to unlock PromptPal Pro."
										: isExpoGoRuntime()
											? "Open a development build or use RevenueCat Test Store to test purchases in Expo Go."
											: "Subscriptions are currently available on iPhone only."}
								</Text>
							</View>
							<Pressable
								onPress={() => void handlePlanPress()}
								className="h-11 rounded-full bg-primary px-5 items-center justify-center"
							>
								<Text className="text-white text-[10px] font-black uppercase tracking-widest">
									{isPro ? "Manage" : "Upgrade"}
								</Text>
							</Pressable>
						</View>
					</View>

					{/* Usage Quota Section */}
					<View className="w-full mb-10 mt-10">
						<Text className="text-onSurface text-2xl font-black mb-8 px-2">
							Usage Quota
						</Text>
						<View className="flex-row justify-center w-full">
							<CircularProgress
								size={width * 0.28}
								percentage={textUsagePercent}
								label="Text"
								subLabel={`${usage?.used.textCalls || 0}/${usage?.limits.textCalls || 0}`}
								color="#FF6B00"
								isDark={isDark}
							/>
							{/* Image quota hidden - will be implemented once image generation module is ready */}
						</View>
					</View>

					{/* Achievements Section */}
					<View className="w-full mb-10">
						<View className="flex-row justify-between items-end mb-8 px-2">
							<Text className="text-onSurface text-2xl font-black">
								Achievements
							</Text>
							<Pressable>
								<Text className="text-primary text-[10px] font-black uppercase tracking-widest">
									View All
								</Text>
							</Pressable>
						</View>

						{achievements && achievements.length > 0 ? (
							<FlashList
								data={achievements}
								renderItem={renderAchievementItem}
								keyExtractor={(item) => item.id}
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ paddingRight: 20 }}
							/>
						) : (
							<Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">
								No achievements yet
							</Text>
						)}
					</View>

					{/* Images Gallery Section - Hidden until image generation module is implemented */}

					{/* Statistics Section */}
					<View className="w-full mb-8">
						<Text className="text-onSurface text-2xl font-black mb-8 px-2">
							Statistics
						</Text>
						<View className="flex-row gap-4">
							<StatCard
								label="Total Prompts"
								value={totalPrompts.toLocaleString()}
								trend="Global Usage"
								color="#FF6B00"
								variant="featured"
							/>
							<StatCard
								label="Avg. Accuracy"
								value={`${avgAccuracy}%`}
								trend="Performance"
								color="#4151FF"
								isSecondary
								variant="featured"
							/>
						</View>
					</View>

					{/* Developer Tools */}
					<View className="w-full mb-8 border-t border-surfaceVariant/20 pt-8">
						<Text className="text-onSurface text-2xl font-black mb-3 px-2">
							Developer Tools
						</Text>
						<Text className="text-onSurfaceVariant text-[11px] font-bold uppercase tracking-widest px-2 mb-5 opacity-80">
							Debug utilities for testing the app experience.
						</Text>
						<Pressable
							onPress={() => {
								const { resetOnboarding } = useOnboardingStore.getState();
								resetOnboarding();
								Alert.alert(
									"Onboarding Reset",
									"The onboarding flow will appear on your next app navigation.",
								);
							}}
							className="rounded-2xl px-5 py-4 border bg-primary/10 border-primary/30 flex-row items-center justify-center"
						>
							<Ionicons name="refresh-outline" size={18} color="#FF6B00" />
							<Text className="text-primary text-center text-sm font-black uppercase tracking-widest ml-2">
								Replay Onboarding
							</Text>
						</Pressable>
					</View>

					<View className="w-full mb-8 border-t border-surfaceVariant/20 pt-8">
						<Text className="text-onSurface text-2xl font-black mb-3 px-2">
							Account
						</Text>
						<Text className="text-onSurfaceVariant text-[11px] font-bold uppercase tracking-widest px-2 mb-5 opacity-80">
							Delete account permanently removes your profile, progress, and app
							history.
						</Text>
						<Pressable
							onPress={confirmDeleteAccount}
							disabled={isDeletingAccount}
							className={`rounded-2xl px-5 py-4 border ${isDeletingAccount ? "bg-red-900/30 border-red-700/40" : "bg-red-600/20 border-red-500/60"}`}
						>
							<Text className="text-red-400 text-center text-sm font-black uppercase tracking-widest">
								{isDeletingAccount ? "Deleting Account..." : "Delete Account"}
							</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
