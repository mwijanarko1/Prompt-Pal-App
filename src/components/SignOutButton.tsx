import { useClerk } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import { Text, TouchableOpacity, Alert } from "react-native";
import { clearAuth } from "@/lib/convex-client";
import { logger } from "@/lib/logger";

interface SignOutButtonProps {
	className?: string;
	textClassName?: string;
}

export const SignOutButton = ({
	className = "",
	textClassName = "",
}: SignOutButtonProps = {}) => {
	const { signOut } = useClerk();

	const handleSignOut = async () => {
		Alert.alert("Sign Out", "Are you sure you want to sign out?", [
			{ text: "Cancel", style: "cancel" },
			{
				text: "Sign Out",
				style: "destructive",
				onPress: async () => {
					try {
						await signOut();
						clearAuth();
						Linking.openURL(Linking.createURL("/"));
					} catch (err) {
						logger.error("SignOutButton", err);
						Alert.alert("Error", "Failed to sign out. Please try again.");
					}
				},
			},
		]);
	};

	return (
		<TouchableOpacity
			onPress={handleSignOut}
			className={`bg-error px-4 py-2 rounded-xl active:bg-red-600 ${className}`.trim()}
		>
			<Text
				className={`text-onPrimary text-sm font-semibold ${textClassName}`.trim()}
			>
				Sign Out
			</Text>
		</TouchableOpacity>
	);
};
