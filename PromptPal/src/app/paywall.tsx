import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Linking,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useSubscriptionStore } from "@/features/subscription/store";
import {
	logPaywallHit,
	logPricingPageViewed,
	logSubscriptionStarted,
	logTrialStarted,
} from "@/lib/analytics";
import {
	configureRevenueCat,
	getCustomerInfo,
	getLegalUrls,
	getManagementUrl,
	getSubscriptionPackageOptions,
	isProEntitled,
	isRunningInExpoGo,
	isSubscriptionFeatureAvailable,
	purchaseSubscriptionPackage,
	restorePurchases,
	syncCurrentUserSubscription,
	type SubscriptionPackageOption,
} from "@/lib/subscriptions";

function getUnsupportedPlatformCopy() {
	if (Platform.OS === "ios" && isRunningInExpoGo()) {
		return {
			title: "Subscriptions need a development build",
			body: "PromptPal Pro purchases are not available inside Expo Go. Use a development build or RevenueCat Test Store to test subscription flows.",
		};
	}

	return {
		title: "Subscriptions are currently available on iOS",
		body: "PromptPal Pro purchases are only wired up for iPhone right now. You can still use the free plan on this device.",
	};
}

function getPurchaseFailureMessage(error: unknown): string {
	if (
		error &&
		typeof error === "object" &&
		"userCancelled" in error &&
		(error as { userCancelled?: boolean }).userCancelled
	) {
		return "Purchase cancelled.";
	}

	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}

	return "Unable to complete purchase right now.";
}

export default function PaywallScreen() {
	const router = useRouter();
	const { userId } = useAuth();
	const params = useLocalSearchParams<{ required?: string }>();
	const isRequired = params.required === "1";
	const { termsOfUseUrl, privacyPolicyUrl } = getLegalUrls();
	const subscriptionAvailable = isSubscriptionFeatureAvailable();
	const applyStatus = useSubscriptionStore((state) => state.applyStatus);
	const subscriptionTier = useSubscriptionStore((state) => state.tier);
	const managementUrl = useSubscriptionStore((state) => state.managementUrl);

	const [packageOptions, setPackageOptions] = useState<SubscriptionPackageOption[]>(
		[],
	);
	const [isLoadingPackages, setIsLoadingPackages] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [processingIdentifier, setProcessingIdentifier] = useState<string | null>(
		null,
	);

	const unsupportedCopy = useMemo(getUnsupportedPlatformCopy, []);

	useEffect(() => {
		logPricingPageViewed({ required: isRequired });
		logPaywallHit({
			trigger: isRequired ? "subscription_required" : "upgrade_screen",
		});
	}, [isRequired]);

	const goAfterEntitlement = useCallback(() => {
		if (isRequired) {
			router.replace("/(tabs)");
			return;
		}

		if (router.canGoBack()) {
			router.back();
			return;
		}

		router.replace("/(tabs)");
	}, [isRequired, router]);

	const syncAfterPurchaseChange = useCallback(async () => {
		const status = await syncCurrentUserSubscription();
		applyStatus(status);
		return status;
	}, [applyStatus]);

	useEffect(() => {
		if (!subscriptionAvailable) {
			setPackageOptions([]);
			setLoadError(null);
			return;
		}

		let cancelled = false;

		const loadOfferings = async () => {
			setIsLoadingPackages(true);
			setLoadError(null);

			try {
				await configureRevenueCat(userId);
				const offerings = await getSubscriptionPackageOptions();
				if (!cancelled) {
					setPackageOptions(offerings);
				}
			} catch (error) {
				if (!cancelled) {
					setLoadError(getPurchaseFailureMessage(error));
				}
			} finally {
				if (!cancelled) {
					setIsLoadingPackages(false);
				}
			}
		};

		void loadOfferings();

		return () => {
			cancelled = true;
		};
	}, [subscriptionAvailable, userId]);

	const openExternalUrl = useCallback(async (url: string) => {
		const canOpen = await Linking.canOpenURL(url);
		if (!canOpen) {
			Alert.alert("Link unavailable", "Unable to open that link right now.");
			return;
		}

		await Linking.openURL(url);
	}, []);

	const handleManageSubscription = useCallback(async () => {
		if (managementUrl) {
			await openExternalUrl(managementUrl);
			return;
		}

		Alert.alert(
			"Manage subscription unavailable",
			"Open the App Store subscriptions page from an active subscription session to manage your plan.",
		);
	}, [managementUrl, openExternalUrl]);

	const handlePurchase = useCallback(
		async (packageIdentifier: string) => {
			setProcessingIdentifier(packageIdentifier);
			const selectedOption = packageOptions.find(
				(option) => option.identifier === packageIdentifier,
			);

			try {
				await purchaseSubscriptionPackage(packageIdentifier);
				const status = await syncAfterPurchaseChange();

				if (status.tier === "pro") {
					logSubscriptionStarted({
						packageIdentifier,
						source: "paywall",
					});
					if (
						/\b(trial|free)\b/i.test(
							[
								selectedOption?.identifier,
								selectedOption?.title,
								selectedOption?.description,
							]
								.filter(Boolean)
								.join(" "),
						)
					) {
						logTrialStarted({ productId: packageIdentifier });
					}
					Alert.alert("Success", "Your subscription is active.", [
						{ text: "OK", onPress: goAfterEntitlement },
					]);
					return;
				}

				Alert.alert(
					"Purchase pending",
					"Purchase finished, but the entitlement is not active yet.",
				);
			} catch (error) {
				const customerInfo = await getCustomerInfo().catch(() => null);
				if (customerInfo && isProEntitled(customerInfo)) {
					applyStatus({
						tier: "pro",
						managementUrl: getManagementUrl(customerInfo),
					});
					logSubscriptionStarted({
						packageIdentifier,
						source: "paywall_local_customer_info",
					});
					Alert.alert(
						"Purchase complete",
						"Your subscription is active on this device. Backend syncing will retry the next time the app connects.",
						[{ text: "OK", onPress: goAfterEntitlement }],
					);
				} else {
					Alert.alert("Purchase failed", getPurchaseFailureMessage(error));
				}
			} finally {
				setProcessingIdentifier(null);
			}
		},
		[applyStatus, goAfterEntitlement, packageOptions, syncAfterPurchaseChange],
	);

	const handleRestorePurchases = useCallback(async () => {
		setProcessingIdentifier("restore");

		try {
			await restorePurchases();
			const status = await syncAfterPurchaseChange();

			Alert.alert(
				"Restore complete",
				status.tier === "pro"
					? "Your Pro access has been restored."
					: "No active subscription was found.",
				[
					status.tier === "pro"
						? { text: "OK", onPress: goAfterEntitlement }
						: { text: "OK" },
				],
			);
		} catch (error) {
			const customerInfo = await getCustomerInfo().catch(() => null);
			if (customerInfo && isProEntitled(customerInfo)) {
				applyStatus({
					tier: "pro",
					managementUrl: getManagementUrl(customerInfo),
				});
				Alert.alert("Restore complete", "Your Pro access is active on this device.", [
					{ text: "OK", onPress: goAfterEntitlement },
				]);
			} else {
				Alert.alert("Restore failed", getPurchaseFailureMessage(error));
			}
		} finally {
			setProcessingIdentifier(null);
		}
	}, [applyStatus, goAfterEntitlement, syncAfterPurchaseChange]);

	return (
		<SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
			<Stack.Screen options={{ gestureEnabled: !isRequired }} />

			<View className="flex-row items-center justify-between px-6 py-4">
				{isRequired ? (
					<View className="h-10 w-10" />
				) : (
					<Pressable
						onPress={() => {
							if (router.canGoBack()) {
								router.back();
								return;
							}
							router.replace("/(tabs)");
						}}
						className="h-10 w-10 items-center justify-center rounded-full bg-surface"
					>
						<Ionicons name="chevron-back" size={22} color="#F9FAFB" />
					</Pressable>
				)}
				<Text className="text-onSurface text-lg font-black uppercase tracking-[2px]">
					{subscriptionTier === "pro" ? "Manage Plan" : "Upgrade"}
				</Text>
				<View className="h-10 w-10" />
			</View>

			<ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
				<View className="mb-6 rounded-3xl border border-primary/30 bg-primary/10 p-5">
					<Text className="text-primary text-xs font-black uppercase tracking-widest mb-2">
						PromptPal Pro
					</Text>
					<Text className="text-onSurface text-2xl font-black mb-2">
						Unlock full access
					</Text>
					<Text className="text-onSurfaceVariant text-sm">
						Upgrade your quota limits and unlock subscription-only access when full-app gating is enabled.
					</Text>
				</View>

				{!subscriptionAvailable ? (
					<View className="rounded-3xl border border-outline/30 bg-surface p-5">
						<Text className="text-onSurface text-lg font-black mb-2">
							{unsupportedCopy.title}
						</Text>
						<Text className="text-onSurfaceVariant text-sm leading-6">
							{unsupportedCopy.body}
						</Text>
					</View>
				) : isLoadingPackages ? (
					<View className="items-center py-12">
						<ActivityIndicator color="#FF6B00" size="large" />
						<Text className="mt-4 text-onSurfaceVariant text-sm">
							Loading subscription options...
						</Text>
					</View>
				) : loadError ? (
					<View className="rounded-3xl border border-red-500/40 bg-red-500/10 p-5">
						<Text className="text-onSurface text-base font-black mb-2">
							Unable to load subscription options
						</Text>
						<Text className="text-onSurfaceVariant text-sm leading-6">
							{loadError}
						</Text>
					</View>
				) : packageOptions.length === 0 ? (
					<View className="rounded-3xl border border-outline/30 bg-surface p-5">
						<Text className="text-onSurface text-base font-black mb-2">
							No current offering is configured
						</Text>
						<Text className="text-onSurfaceVariant text-sm leading-6">
							Add packages to the current RevenueCat offering, then reopen this screen.
						</Text>
					</View>
				) : (
					<View className="gap-4">
						{packageOptions.map((option) => {
							const isProcessing = processingIdentifier === option.identifier;
							const badge =
								option.packageType === "annual"
									? "Best Value"
									: option.packageType === "monthly"
										? "Most Flexible"
										: null;

							return (
								<Pressable
									key={option.identifier}
									onPress={() => void handlePurchase(option.identifier)}
									disabled={Boolean(processingIdentifier)}
									className={`rounded-3xl border border-outline/30 bg-surface p-5 ${
										isProcessing ? "opacity-70" : ""
									}`}
								>
									<View className="mb-2 flex-row items-center justify-between">
										<Text className="text-onSurface text-base font-black">
											{option.title}
										</Text>
										{badge ? (
											<View className="rounded-full bg-secondary/20 px-3 py-1">
												<Text className="text-secondary text-[10px] font-black uppercase tracking-wider">
													{badge}
												</Text>
											</View>
										) : null}
									</View>
									<Text className="text-onSurface text-xl font-black mb-1">
										{option.price}
									</Text>
									{option.description ? (
										<Text className="text-onSurfaceVariant text-xs leading-5">
											{option.description}
										</Text>
									) : null}
								</Pressable>
							);
						})}
					</View>
				)}

				{subscriptionTier === "pro" && managementUrl ? (
					<Pressable
						onPress={() => void handleManageSubscription()}
						disabled={Boolean(processingIdentifier)}
						className="mt-6 h-12 rounded-2xl border border-primary/40 items-center justify-center bg-primary/10"
					>
						<Text className="text-primary text-xs font-black uppercase tracking-widest">
							Manage Subscription
						</Text>
					</Pressable>
				) : null}

				{subscriptionAvailable ? (
					<Pressable
						onPress={() => void handleRestorePurchases()}
						disabled={Boolean(processingIdentifier)}
						className={`mt-6 h-12 rounded-2xl border border-outline/30 items-center justify-center ${
							processingIdentifier === "restore" ? "opacity-70" : ""
						}`}
					>
						{processingIdentifier === "restore" ? (
							<ActivityIndicator color="#F9FAFB" />
						) : (
							<Text className="text-onSurface text-xs font-black uppercase tracking-widest">
								Restore Purchases
							</Text>
						)}
					</Pressable>
				) : null}

				<View className="mt-6 gap-3">
					<Text className="text-onSurfaceVariant text-[10px] leading-4 opacity-80">
						Subscriptions auto-renew unless canceled at least 24 hours before renewal. You can manage or cancel in Apple ID settings.
					</Text>
					<View className="flex-row flex-wrap gap-4">
						<Pressable onPress={() => void openExternalUrl(termsOfUseUrl)}>
							<Text className="text-primary text-[11px] font-black uppercase tracking-widest">
								Terms of Use
							</Text>
						</Pressable>
						{privacyPolicyUrl ? (
							<Pressable
								onPress={() => void openExternalUrl(privacyPolicyUrl)}
							>
								<Text className="text-primary text-[11px] font-black uppercase tracking-widest">
									Privacy Policy
								</Text>
							</Pressable>
						) : null}
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
