import { Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface WebViewerCloseButtonProps {
	onPress: () => void;
	top: number;
}

export function WebViewerCloseButton({
	onPress,
	top,
}: WebViewerCloseButtonProps) {
	return (
		<Pressable
			onPress={onPress}
			hitSlop={12}
			testID="web-viewer-close-button"
			className="absolute right-3 w-11 h-11 rounded-full items-center justify-center bg-surfaceElevated border border-outline/20 shadow-lg shadow-black/20"
			style={{
				top,
				zIndex: 100,
				elevation: Platform.OS === "android" ? 24 : 0,
			}}
			accessibilityRole="button"
			accessibilityLabel="Close full screen preview"
		>
			<Ionicons name="close" size={22} color="#6B7280" />
		</Pressable>
	);
}
