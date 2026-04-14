import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, type TextInputProps, View } from "react-native";

interface AuthFieldProps extends TextInputProps {
	label: string;
	icon: keyof typeof Ionicons.glyphMap;
	error?: string;
}

export function AuthField({
	label,
	icon,
	error,
	placeholder,
	placeholderTextColor = "#9CA3AF",
	...inputProps
}: AuthFieldProps) {
	const iconColor = error ? "#EF4444" : "#9CA3AF";

	return (
		<View>
			<Text className="mb-2 ml-1 text-[11px] font-bold uppercase tracking-[1.8px] text-onSurfaceVariant">
				{label}
			</Text>
			<View
				className={`h-16 flex-row items-center rounded-[20px] border bg-surfaceVariant/45 px-4 ${
					error ? "border-error" : "border-outline/25"
				}`}
			>
				<View className="w-6 items-center">
					<Ionicons name={icon} size={20} color={iconColor} />
				</View>
				<TextInput
					{...inputProps}
					placeholder={placeholder}
					placeholderTextColor={placeholderTextColor}
					className="ml-3 flex-1 py-0 text-[17px] font-semibold leading-6 text-onSurface"
				/>
			</View>
			{error ? (
				<Text className="mt-2 ml-1 text-[11px] font-semibold text-error">
					{error}
				</Text>
			) : null}
		</View>
	);
}
