import { useAction } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/convexApi";
import { isAppAIErrorData } from "@/lib/aiErrors";
import { learningModuleIdForCategory } from "@/features/superprompts/categoryModuleMap";
import type {
	GenerateCategory,
	RefineMode,
} from "@/features/superprompts/types";
import {
	logSuperpromptCopied,
	logSuperpromptGenerateFailed,
	logSuperpromptGenerateSubmitted,
	logSuperpromptGenerateSucceeded,
	logSuperpromptQuotaBlocked,
	logSuperpromptRefineTapped,
	logSuperpromptTrainNudgeTapped,
	logUsageLimitApproaching,
} from "@/lib/analytics";

const CATEGORIES: { id: GenerateCategory; label: string }[] = [
	{ id: "image", label: "Image" },
	{ id: "copy", label: "Copy" },
	{ id: "code", label: "Code" },
];

const REFINE_CHIPS: { mode: RefineMode; label: string }[] = [
	{ mode: "more_detailed", label: "Make it more detailed" },
	{ mode: "simplify", label: "Simplify it" },
	{ mode: "change_tone", label: "Change the tone" },
];

export default function GenerateTab() {
	const router = useRouter();
	const generatePromptAction = useAction(api.ai.generatePrompt);

	const [category, setCategory] = useState<GenerateCategory>("image");
	const [idea, setIdea] = useState("");
	const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [inlineError, setInlineError] = useState<string | null>(null);
	const [copyNudgeVisible, setCopyNudgeVisible] = useState(false);
	const [quotaExceeded, setQuotaExceeded] = useState(false);
	const [usageHint, setUsageHint] = useState<{
		remaining: number;
		limit: number;
		tier: "free" | "pro";
	} | null>(null);

	const ideaTrimmed = idea.trim();
	const canGenerate = ideaTrimmed.length > 0 && !loading;

	useEffect(() => {
		if (!usageHint || usageHint.remaining > 3 || usageHint.remaining <= 0) {
			return;
		}

		logUsageLimitApproaching({
			remaining: usageHint.remaining,
			limit: usageHint.limit,
			tier: usageHint.tier,
			category,
		});
	}, [category, usageHint]);

	const runGenerate = useCallback(
		async (input: {
			category: GenerateCategory;
			idea: string;
			existingPrompt?: string;
			refineMode?: RefineMode;
		}) => {
			setLoading(true);
			setInlineError(null);
			setQuotaExceeded(false);
			setCopyNudgeVisible(false);
			logSuperpromptGenerateSubmitted({
				category: input.category,
				refine_mode: input.refineMode,
			});

			try {
				const res = await generatePromptAction({
					category: input.category,
					idea: input.idea,
					existingPrompt: input.existingPrompt,
					refineMode: input.refineMode,
				});

				if (isAppAIErrorData(res.error)) {
					logSuperpromptGenerateFailed({
						category: input.category,
						refine_mode: input.refineMode,
						tier: res.tier,
						remaining_quota: res.remainingQuota,
					});
					if (res.error.code === "APP_QUOTA_EXCEEDED") {
						logSuperpromptQuotaBlocked({
							category: input.category,
							tier: res.tier,
							remaining_quota: res.remainingQuota,
						});
						setQuotaExceeded(true);
					}
					setInlineError(res.error.message);
					return;
				}

				if (!res.prompt?.trim()) {
					setInlineError("No prompt returned. Try again.");
					logSuperpromptGenerateFailed({
						category: input.category,
						refine_mode: input.refineMode,
						tier: res.tier,
						remaining_quota: res.remainingQuota,
					});
					return;
				}

				setGeneratedPrompt(res.prompt);
				if (
					res.remainingQuota !== undefined &&
					res.limit !== undefined &&
					res.tier
				) {
					setUsageHint({
						remaining: res.remainingQuota,
						limit: res.limit,
						tier: res.tier,
					});
				}
				logSuperpromptGenerateSucceeded({
					category: input.category,
					refine_mode: input.refineMode,
					tier: res.tier,
					remaining_quota: res.remainingQuota,
				});
			} catch {
				setInlineError("Something went wrong. Try again.");
				logSuperpromptGenerateFailed({
					category: input.category,
					refine_mode: input.refineMode,
				});
			} finally {
				setLoading(false);
			}
		},
		[generatePromptAction],
	);

	const onGenerate = useCallback(() => {
		if (!canGenerate) return;
		void runGenerate({ category, idea: ideaTrimmed });
	}, [canGenerate, category, ideaTrimmed, runGenerate]);

	const onRefine = useCallback(
		(mode: RefineMode) => {
			if (!generatedPrompt?.trim() || loading) return;
			logSuperpromptRefineTapped({
				category,
				refine_mode: mode,
				tier: usageHint?.tier,
				remaining_quota: usageHint?.remaining,
			});
			void runGenerate({
				category,
				idea: ideaTrimmed,
				existingPrompt: generatedPrompt,
				refineMode: mode,
			});
		},
		[
			category,
			generatedPrompt,
			ideaTrimmed,
			loading,
			runGenerate,
			usageHint?.remaining,
			usageHint?.tier,
		],
	);

	const onCopy = useCallback(async () => {
		if (!generatedPrompt?.trim()) return;
		try {
			await Clipboard.setStringAsync(generatedPrompt);
			setCopyNudgeVisible(true);
			logSuperpromptCopied({
				category,
				tier: usageHint?.tier,
				remaining_quota: usageHint?.remaining,
			});
		} catch {
			setInlineError("Could not copy. Try again.");
		}
	}, [category, generatedPrompt, usageHint?.remaining, usageHint?.tier]);

	const onCategoryChange = useCallback((next: GenerateCategory) => {
		setCategory(next);
		setGeneratedPrompt(null);
		setCopyNudgeVisible(false);
		setInlineError(null);
		setQuotaExceeded(false);
	}, []);

	const nearLimitBanner = useMemo(() => {
		if (!usageHint || usageHint.remaining > 3 || usageHint.remaining <= 0) {
			return null;
		}
		return (
			<View className="mx-6 mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
				<Text className="text-onSurface text-sm font-medium">
					{usageHint.remaining} text generations left this month (
					{usageHint.tier === "pro" ? "Pro" : "Free"} plan).
				</Text>
			</View>
		);
	}, [usageHint]);

	const modulePath = `/game/levels/${learningModuleIdForCategory(category)}`;

	return (
		<SafeAreaView
			className="flex-1 bg-background"
			edges={["top", "left", "right"]}
		>
			<View className="px-6 pt-3 pb-4 flex-row items-center justify-between">
				<Pressable
					onPress={() => router.back()}
					className="w-10 h-10 rounded-full bg-surfaceVariant/50 items-center justify-center"
					hitSlop={8}
				>
					<Ionicons name="chevron-back" size={22} color="#6B7280" />
				</Pressable>
				<Text className="text-onSurface text-lg font-black">Generate</Text>
				<View className="w-10" />
			</View>

			<ScrollView
				className="flex-1"
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{ paddingBottom: 120 }}
			>
				<Text className="px-6 text-onSurfaceVariant text-sm font-medium leading-5 mb-4">
					Describe what you want. We will turn it into a prompt you can paste
					into any AI tool.
				</Text>

				<View className="px-6 mb-4">
					<View className="flex-row flex-wrap gap-2">
						{CATEGORIES.map((c) => {
							const selected = c.id === category;
							return (
								<Pressable
									key={c.id}
									onPress={() => onCategoryChange(c.id)}
									className={`px-4 py-2.5 rounded-full border ${
										selected
											? "bg-primary border-primary"
											: "bg-surfaceVariant/40 border-outline/20"
									}`}
								>
									<Text
										className={`text-sm font-black uppercase tracking-wide ${
											selected ? "text-white" : "text-onSurface"
										}`}
									>
										{c.label}
									</Text>
								</Pressable>
							);
						})}
					</View>
				</View>

				{nearLimitBanner}

				<View className="px-6 mb-4">
					<TextInput
						className="min-h-[120px] rounded-2xl border border-outline/20 bg-surface px-4 py-3 text-onSurface text-base"
						placeholder="Describe what you want in a few words..."
						placeholderTextColor="#9CA3AF"
						multiline
						textAlignVertical="top"
						value={idea}
						onChangeText={setIdea}
						editable={!loading}
					/>
				</View>

				<View className="px-6 mb-6">
					<Pressable
						onPress={onGenerate}
						disabled={!canGenerate}
						className={`rounded-2xl py-4 items-center ${
							canGenerate ? "bg-primary" : "bg-outline/30"
						}`}
					>
						<Text
							className={`text-base font-black uppercase tracking-widest ${
								canGenerate ? "text-white" : "text-onSurfaceVariant"
							}`}
						>
							Generate
						</Text>
					</Pressable>
				</View>

				{(loading || generatedPrompt || inlineError) && (
					<View className="px-6 mb-6">
						<Text className="text-onSurface text-[10px] font-black uppercase tracking-[2px] mb-2">
							{loading
								? "Working on it"
								: inlineError
									? "Could not generate"
									: "Ready to copy"}
						</Text>
						<View className="rounded-2xl border border-outline/15 bg-surface p-4 min-h-[100px]">
							{loading ? (
								<View className="py-8 items-center justify-center">
									<ActivityIndicator size="small" color="#FF6B00" />
									<Text className="text-onSurfaceVariant text-sm mt-3">
										Building your prompt…
									</Text>
								</View>
							) : inlineError ? (
								<View>
									<Text className="text-onSurface text-sm leading-5 mb-4">
										{inlineError}
									</Text>
									{quotaExceeded ? (
										<Pressable
											onPress={() => router.push("/paywall")}
											className="rounded-xl bg-primary py-3 items-center"
										>
											<Text className="text-white font-black text-sm uppercase tracking-widest">
												View plans
											</Text>
										</Pressable>
									) : (
										<Pressable
											onPress={onGenerate}
											disabled={!canGenerate}
											className="rounded-xl border border-primary py-3 items-center"
										>
											<Text className="text-primary font-black text-sm uppercase tracking-widest">
												Retry
											</Text>
										</Pressable>
									)}
								</View>
							) : (
								<Text className="text-onSurface text-base leading-6">
									{generatedPrompt}
								</Text>
							)}
						</View>

						{!loading && generatedPrompt && !inlineError ? (
							<>
								<Pressable
									onPress={onCopy}
									className="mt-4 rounded-2xl bg-surfaceVariant py-4 items-center border border-outline/10"
								>
									<Text className="text-onSurface font-black text-base uppercase tracking-widest">
										Copy
									</Text>
								</Pressable>

								<View className="flex-row flex-wrap gap-2 mt-5">
									{REFINE_CHIPS.map((chip) => (
										<Pressable
											key={chip.mode}
											onPress={() => onRefine(chip.mode)}
											disabled={loading}
											className="px-3 py-2 rounded-full bg-surfaceVariant/60 border border-outline/15"
										>
											<Text className="text-onSurface text-xs font-bold">
												{chip.label}
											</Text>
										</Pressable>
									))}
								</View>
							</>
						) : null}
					</View>
				)}

				{copyNudgeVisible && generatedPrompt && !inlineError ? (
					<View className="mx-6 mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-5">
						<Text className="text-onSurface text-lg font-black mb-1">
							Want to learn how to write this yourself?
						</Text>
						<Text className="text-onSurfaceVariant text-sm mb-4">
							It takes about 3 minutes.
						</Text>
						<Pressable
							onPress={() => {
								logSuperpromptTrainNudgeTapped({
									category,
									tier: usageHint?.tier,
									remaining_quota: usageHint?.remaining,
								});
								router.push(modulePath);
							}}
							className="rounded-xl bg-primary py-3.5 items-center"
						>
							<Text className="text-white font-black text-sm uppercase tracking-widest">
								Go to Train
							</Text>
						</Pressable>
					</View>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}
