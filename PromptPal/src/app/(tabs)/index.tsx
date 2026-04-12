import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
	logSuperpromptHomeGenerateTapped,
	logSuperpromptHomeTrainTapped,
} from "@/lib/analytics";

export default function HomeScreen() {
	const router = useRouter();

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
							<Text className="text-onSurface text-2xl font-black mb-2">
								Train
							</Text>
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

				<Text className="text-onSurfaceVariant text-xs font-medium text-center mt-10 leading-5 px-2">
					Train is the long-term path. Generate is the shortcut.
				</Text>
			</View>
		</SafeAreaView>
	);
}
