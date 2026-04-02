import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
	Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../../convex/_generated/api";
import { convexHttpClient } from "@/lib/convex-client";
import { getModuleThumbnail } from "@/lib/thumbnails";

import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { useOnboardingStore } from "../store";
import { ONBOARDING_COLORS } from "../theme";

const MODULES = [
	{
		id: "coding-logic",
		title: "Coding",
		description: "Generate functional code with precise AI instructions",
		color: "#4151FF",
		gradient: "rgba(65, 81, 255, 0.08)",
		borderColor: "rgba(65, 81, 255, 0.2)",
	},
	{
		id: "copywriting",
		title: "Copywriting",
		description: "Write persuasive marketing copy that matches brand voice",
		color: "#FF6B00",
		gradient: "rgba(255, 107, 0, 0.08)",
		borderColor: "rgba(255, 107, 0, 0.2)",
	},
];

export function ModuleSelectionScreen() {
	const { goToNextStep, setSelectedModule } = useOnboardingStore();

	const handleSelectModule = async (moduleId: string) => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setSelectedModule(moduleId);
		try {
			await convexHttpClient.mutation(api.mutations.updateUserPreferences, {
				favoriteModule: moduleId,
			});
		} catch {
			// Keep local onboarding progress even if backend sync retries later.
		}
		goToNextStep();
	};

	return (
		<OnboardingScreenWrapper>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.topSpace} />

				{/* Title */}
				<Animated.View
					entering={FadeInUp.duration(500).delay(400)}
					style={styles.titleContainer}
				>
					<Text style={styles.title}>Choose Your Path</Text>
					<Text style={styles.subtitle}>
						You've mastered the basics! Now choose{"\n"}a module to continue
						your journey.
					</Text>
				</Animated.View>

				{/* Module cards */}
				<View style={styles.modulesContainer}>
					{MODULES.map((module, index) => (
						<Animated.View
							key={module.id}
							entering={FadeInUp.duration(500).delay(600 + index * 150)}
						>
							<TouchableOpacity
								style={[
									styles.moduleCard,
									{
										backgroundColor: module.gradient,
										borderColor: module.borderColor,
									},
								]}
								onPress={() => {
									void handleSelectModule(module.id);
								}}
								activeOpacity={0.85}
								accessibilityRole="button"
								accessibilityLabel={`Choose ${module.title} module`}
							>
								<View style={styles.moduleHeader}>
									<View
										style={[
											styles.moduleIcon,
											{ backgroundColor: module.color + "15" },
										]}
									>
										<Image
											source={getModuleThumbnail(
												module.title,
												module.id,
												module.description,
											)}
											style={styles.moduleThumb}
											resizeMode="cover"
											accessibilityRole="image"
											accessibilityLabel={`${module.title} thumbnail`}
										/>
									</View>
									<View style={styles.moduleInfo}>
										<Text style={styles.moduleTitle}>{module.title}</Text>
										<Text style={styles.moduleDescription}>
											{module.description}
										</Text>
									</View>
								</View>

								<View
									style={[
										styles.moduleButton,
										{ backgroundColor: module.color },
									]}
								>
									<Text style={styles.moduleButtonText}>Start Module</Text>
									<Ionicons
										name="arrow-forward"
										size={16}
										color={ONBOARDING_COLORS.textOnAccent}
									/>
								</View>
							</TouchableOpacity>
						</Animated.View>
					))}
				</View>

				{/* Tip */}
				<Animated.View
					entering={FadeInUp.duration(500).delay(1200)}
					style={styles.tipCard}
				>
					<Ionicons
						name="sparkles"
						size={16}
						color={ONBOARDING_COLORS.accentWarm}
					/>
					<Text style={styles.tipText}>
						Each module teaches different prompt skills. Try them all to become
						a master!
					</Text>
				</Animated.View>

				<View style={{ height: 32 }} />
			</ScrollView>
		</OnboardingScreenWrapper>
	);
}

const styles = StyleSheet.create({
	scrollView: { flex: 1 },
	scrollContent: {
		paddingHorizontal: 24,
		paddingBottom: 32,
	},
	topSpace: { height: 8 },
	center: { alignItems: "center" },
	titleContainer: {
		alignItems: "center",
		marginTop: 12,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		color: ONBOARDING_COLORS.textMuted,
		textAlign: "center",
		lineHeight: 20,
		marginTop: 6,
		fontWeight: "500",
	},
	modulesContainer: {
		marginTop: 24,
		gap: 14,
	},
	moduleCard: {
		borderRadius: 20,
		padding: 18,
		borderWidth: 1.5,
	},
	moduleHeader: {
		flexDirection: "row",
		gap: 14,
		marginBottom: 14,
	},
	moduleIcon: {
		width: 48,
		height: 48,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	moduleThumb: {
		width: 48,
		height: 48,
		borderRadius: 16,
	},
	moduleInfo: {
		flex: 1,
	},
	moduleTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: ONBOARDING_COLORS.textPrimary,
		marginBottom: 4,
	},
	moduleDescription: {
		fontSize: 13,
		color: ONBOARDING_COLORS.textMuted,
		lineHeight: 18,
		fontWeight: "500",
	},
	moduleButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		borderRadius: 14,
		height: 42,
	},
	moduleButtonText: {
		color: ONBOARDING_COLORS.textOnAccent,
		fontSize: 14,
		fontWeight: "800",
	},
	tipCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "rgba(245, 158, 11, 0.08)",
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 12,
		marginTop: 20,
		borderWidth: 1,
		borderColor: "rgba(245, 158, 11, 0.15)",
	},
	tipText: {
		fontSize: 13,
		color: ONBOARDING_COLORS.textSecondary,
		fontWeight: "500",
		flex: 1,
		lineHeight: 18,
	},
});
