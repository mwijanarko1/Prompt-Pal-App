import { useMemo, useState, useEffect } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Image,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { convexHttpClient } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api.js";
import { fetchLevelsFromApi } from "@/features/levels/data";
import { Card, ProgressBar } from "@/components/ui";
import { useGameStore } from "@/features/game/store";
import { useUserProgressStore } from "@/features/user/store";
import { Level } from "@/features/game/store";
import { logger } from "@/lib/logger";

export default function LevelsScreen() {
	const { moduleId } = useLocalSearchParams();
	const router = useRouter();
	const { completedLevels, unlockedLevels, syncFromBackend } = useGameStore();
	const { learningModules } = useUserProgressStore();
	const [levels, setLevels] = useState<Level[]>([]);
	const [backendCompletedIds, setBackendCompletedIds] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const module = useMemo(
		() => learningModules.find((m) => m.id === moduleId),
		[learningModules, moduleId],
	);

	// Merge backend (userProgress) + game store: userProgress is source of truth for module progress
	const effectiveCompletedLevels = useMemo(() => {
		const merged = new Set([...completedLevels, ...backendCompletedIds]);
		return Array.from(merged);
	}, [completedLevels, backendCompletedIds]);

	// Calculate actual progress based on completed levels (uses backend as source of truth)
	const actualProgress = useMemo(() => {
		if (levels.length === 0) return 0;

		const completedInModule = levels.filter((level) =>
			effectiveCompletedLevels.includes(level.id),
		).length;
		const progress = (completedInModule / levels.length) * 100;

		return Math.round(progress);
	}, [levels, effectiveCompletedLevels]);

	// Update module progress in user store when it changes significantly
	useEffect(() => {
		if (
			moduleId &&
			actualProgress !== module?.progress &&
			levels.length > 0 &&
			Math.abs(actualProgress - (module?.progress || 0)) >= 1
		) {
			useUserProgressStore
				.getState()
				.updateModuleProgress(moduleId as string, actualProgress);
		}
	}, [actualProgress, moduleId, module?.progress, levels.length]);

	useEffect(() => {
		const loadLevels = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const [apiLevels, completedIds] = await Promise.all([
					fetchLevelsFromApi(),
					convexHttpClient
						.query(api.queries.getCompletedLevelIds, { appId: "prompt-pal" })
						.catch(() => []),
				]);
				setBackendCompletedIds(Array.isArray(completedIds) ? completedIds : []);

				if (apiLevels.length > 0) {
					// Filter levels by module type - try moduleId first, fallback to type mapping
					let moduleLevels = apiLevels.filter(
						(level) => level.moduleId === moduleId,
					);

					// If no levels found by moduleId, try filtering by type
					if (moduleLevels.length === 0) {
						const expectedType =
							moduleId === "image-generation"
								? "image"
								: moduleId === "coding-logic"
									? "code"
									: moduleId === "copywriting"
										? "copywriting"
										: moduleId;
						moduleLevels = apiLevels.filter(
							(level) => level.type === expectedType,
						);
					}

					if (moduleLevels.length === 0) {
						setError("No levels found for this module");
						return;
					}

					setLevels(moduleLevels as Level[]);
				} else {
					setLevels([]);
					setError(
						"No levels available. Run the seed to populate the database.",
					);
				}
			} catch (error) {
				logger.error("LevelsScreen", error, {
					operation: "loadLevels",
					moduleId,
				});
				setError(
					"Failed to load levels. Please check your connection and try again.",
				);
			} finally {
				setIsLoading(false);
			}
		};

		if (moduleId) {
			loadLevels();
		}
	}, [moduleId]);

	// Sync game store when backend has more completed levels (fixes stale local state)
	useEffect(() => {
		if (backendCompletedIds.length === 0) return;
		const missing = backendCompletedIds.filter(
			(id) => !completedLevels.includes(id),
		);
		if (missing.length > 0) {
			const merged = [...new Set([...completedLevels, ...backendCompletedIds])];
			syncFromBackend({ completedLevels: merged });
			useGameStore
				.getState()
				.syncToBackend?.()
				.catch(() => {});
		}
	}, [backendCompletedIds, completedLevels, syncFromBackend]);

	const renderLevelCard = (level: any, index: number) => {
		const isCompleted = effectiveCompletedLevels.includes(level.id);
		// All module levels are browsable from the level picker; completion still tracks progress.
		const isUnlocked = true;

		return (
			<TouchableOpacity
				key={level.id}
				onPress={() => isUnlocked && router.push(`/game/${level.id}`)}
				disabled={!isUnlocked}
				className="mb-4"
			>
				<Card
					className={`p-5 rounded-[24px] border-0 flex-row items-center ${isUnlocked ? "bg-surface" : "bg-surfaceVariant/20 opacity-60"}`}
				>
					<View
						className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${isCompleted ? "bg-success/20" : isUnlocked ? "bg-primary/10" : "bg-surfaceVariant"}`}
					>
						{isCompleted ? (
							<Ionicons name="checkmark-circle" size={24} color="#10B981" />
						) : isUnlocked ? (
							<Text className="text-primary font-black text-lg">
								{index + 1}
							</Text>
						) : (
							<Ionicons name="lock-closed" size={20} color="#6B7280" />
						)}
					</View>

					<View className="flex-1">
						<Text className="text-onSurface text-base font-black mb-1">
							{level.title}
						</Text>
						<Text className="text-onSurfaceVariant text-xs uppercase tracking-widest font-bold">
							{level.type} Challenge • {level.passingScore}% to pass
						</Text>
					</View>

					{isUnlocked && (
						<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
					)}
				</Card>
			</TouchableOpacity>
		);
	};

	if (!module) {
		return (
			<SafeAreaView className="flex-1 bg-background items-center justify-center px-6">
				<Text className="text-onSurface text-xl font-black mb-4">
					Module not found
				</Text>
				<TouchableOpacity
					className="bg-primary px-8 py-4 rounded-full"
					onPress={() => router.back()}
				>
					<Text className="text-white font-black">Go Back</Text>
				</TouchableOpacity>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-background">
			<View className="px-6 pt-4 pb-2">
				<View className="flex-row items-center mb-6 relative">
					{/* Back button fixed on the left so the title group doesn't get squeezed */}
					<TouchableOpacity
						onPress={() => router.back()}
						className="absolute left-0 w-10 h-10 items-center justify-center rounded-full bg-surfaceVariant/50"
					>
						<Ionicons name="arrow-back" size={24} color="#6B7280" />
					</TouchableOpacity>

					{/* Centered title group: thumbnail stuck to the title */}
					<View className="flex-1 items-center">
						<View className="flex-row items-center gap-3">
							<View className="w-10 h-10 rounded-xl overflow-hidden">
								{module.thumbnail ? (
									<Image
										source={module.thumbnail}
										style={{ width: "100%", height: "100%" }}
										resizeMode="cover"
									/>
								) : (
									<View
										className={`w-full h-full items-center justify-center ${module.accentColor}`}
									>
										<Text className="text-lg">{module.icon}</Text>
									</View>
								)}
							</View>

							<Text
								className="text-onSurface text-xl font-black text-center"
								numberOfLines={1}
								style={{ flexShrink: 1 }}
							>
								{module.title}
							</Text>
						</View>
					</View>

					{/* Right spacer to balance absolute back */}
					<View className="w-10" />
				</View>

				<View className="bg-surfaceVariant/20 p-5 rounded-[32px] mb-8 border border-outline/10">
					<View className="flex-row justify-between items-center mb-2">
						<Text className="text-onSurfaceVariant text-xs font-bold uppercase tracking-widest">
							Module Progress
						</Text>
						<Text className="text-primary font-black">{actualProgress}%</Text>
					</View>
					<ProgressBar progress={actualProgress / 100} height={8} />
				</View>

				<Text className="text-onSurfaceVariant text-[10px] font-black uppercase tracking-widest mb-4">
					Learning Path
				</Text>
			</View>

			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#FF6B00" />
					<Text className="text-onSurface mt-4 font-black">
						Loading Levels…
					</Text>
				</View>
			) : error ? (
				<View className="flex-1 items-center justify-center px-6">
					<Ionicons name="cloud-offline-outline" size={64} color="#9CA3AF" />
					<Text className="text-onSurface text-xl font-black mt-4 mb-2">
						Unable to Load Levels
					</Text>
					<Text className="text-onSurfaceVariant text-center font-medium leading-5 mb-6">
						{error}
					</Text>
					<TouchableOpacity
						className="bg-primary px-8 py-4 rounded-full"
						onPress={() => {
							// Trigger reload by updating moduleId dependency
							const currentModuleId = moduleId;
							setError(null);
							// Force re-run of useEffect
							if (currentModuleId) {
								// This will trigger the useEffect again
								setLevels([]);
							}
						}}
					>
						<Text className="text-white font-black">Try Again</Text>
					</TouchableOpacity>
				</View>
			) : (
				<ScrollView
					className="flex-1 px-6"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 40 }}
				>
					{levels.map(renderLevelCard)}

					{levels.length === 0 && (
						<View className="items-center py-20">
							<Ionicons name="construct-outline" size={64} color="#9CA3AF" />
							<Text className="text-onSurfaceVariant text-center mt-4 font-bold">
								No levels available for this module.
							</Text>
						</View>
					)}
				</ScrollView>
			)}
		</SafeAreaView>
	);
}
