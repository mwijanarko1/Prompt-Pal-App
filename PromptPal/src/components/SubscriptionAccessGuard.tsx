import type { ReactNode } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";
import { useSubscriptionStore } from "@/features/subscription/store";
import { isSubscriptionGateEnabled } from "@/lib/subscriptions";

function GateLoading() {
	return (
		<View className="flex-1 items-center justify-center bg-background px-6">
			<View className="mb-6 flex-row items-center">
				<Text className="text-primary text-4xl font-bold">Prompt</Text>
				<Text className="text-secondary text-4xl font-bold">Pal</Text>
			</View>
			<ActivityIndicator size="large" color="#FF6B00" />
			<Text className="mt-4 text-center text-base text-onSurfaceVariant">
				Checking your subscription...
			</Text>
		</View>
	);
}

export function SubscriptionAccessGuard({
	children,
}: {
	children: ReactNode;
}) {
	const gateEnabled = isSubscriptionGateEnabled();
	const tier = useSubscriptionStore((state) => state.tier);
	const isLoading = useSubscriptionStore((state) => state.isLoading);
	const hasResolvedSubscription = useSubscriptionStore(
		(state) => state.hasResolvedSubscription,
	);

	if (!gateEnabled) {
		return <>{children}</>;
	}

	if (isLoading || !hasResolvedSubscription) {
		return <GateLoading />;
	}

	if (tier !== "pro") {
		return <Redirect href="/paywall?required=1" />;
	}

	return <>{children}</>;
}
