import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
	FadeInUp,
	ZoomIn,
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { useOnboardingStore } from "../store";
import { ONBOARDING_COLORS } from "../theme";

const BADGE_ICON_MAP: Record<
	string,
	{ icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
	"prompt-apprentice": { icon: "school-outline", label: "Prompt Apprentice" },
	"onboarding-complete": {
		icon: "trophy-outline",
		label: "Onboarding Complete",
	},
	subject: { icon: "locate-outline", label: "Subject" },
	style: { icon: "color-palette-outline", label: "Style" },
	context: { icon: "bulb-outline", label: "Context" },
	coding: { icon: "code-slash-outline", label: "Code Prompt" },
};

export function CompleteScreen() {
	const { completeOnboarding, xpEarned, badges, addBadge } =
		useOnboardingStore();
	const pulseScale = useSharedValue(1);

	useEffect(() => {
		addBadge("onboarding-complete");
		void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

		pulseScale.value = withRepeat(
			withSequence(
				withTiming(1.04, { duration: 1500 }),
				withTiming(1, { duration: 1500 }),
			),
			-1,
			true,
		);
	}, [pulseScale.value, addBadge]);

	const buttonPulse = useAnimatedStyle(() => ({
		transform: [{ scale: pulseScale.value }],
	}));

	const handleStart = () => {
		void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		completeOnboarding();
	};

	const earnedBadges =
		badges.length > 0 ? badges : ["prompt-apprentice", "onboarding-complete"];

	return (
		<OnboardingScreenWrapper showProgress={false}>
			<View style={styles.container}>
				<View style={styles.topSpace} />

				{/* Fireworks / confetti emoji decoration */}
				<Animated.View
					entering={ZoomIn.duration(600).delay(200)}
					style={styles.fireworksRow}
				>
					<Ionicons
						name="star"
						size={24}
						color={ONBOARDING_COLORS.accentWarm}
					/>
					<Ionicons
						name="sparkles"
						size={28}
						color={ONBOARDING_COLORS.accent}
					/>
					<Ionicons
						name="star"
						size={24}
						color={ONBOARDING_COLORS.accentWarm}
					/>
				</Animated.View>

				{/* Title */}
				<Animated.View
					entering={FadeInUp.duration(500).delay(700)}
					style={styles.titleContainer}
				>
					<Text style={styles.title}>You're Ready!</Text>
					<Text style={styles.subtitle}>
						You've completed your onboarding!{"\n"}Welcome to PromptPal!
					</Text>
				</Animated.View>

				{/* Stats */}
				<Animated.View
					entering={FadeInUp.duration(500).delay(1000)}
					style={styles.statsCard}
				>
					<Text style={styles.statsTitle}>Your Progress</Text>
					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Ionicons
								name="trophy-outline"
								size={22}
								color={ONBOARDING_COLORS.accentWarm}
								style={{ marginBottom: 6 }}
							/>
							<Text style={styles.statValue}>Level 1</Text>
							<Text style={styles.statLabel}>Achieved</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statItem}>
							<Ionicons
								name="star-outline"
								size={22}
								color={ONBOARDING_COLORS.accentWarm}
								style={{ marginBottom: 6 }}
							/>
							<Text style={styles.statValue}>{xpEarned || 100}</Text>
							<Text style={styles.statLabel}>XP Earned</Text>
						</View>
						<View style={styles.statDivider} />
						<View style={styles.statItem}>
							<Ionicons
								name="flame-outline"
								size={22}
								color={ONBOARDING_COLORS.accent}
								style={{ marginBottom: 6 }}
							/>
							<Text style={styles.statValue}>1</Text>
							<Text style={styles.statLabel}>Day Streak</Text>
						</View>
					</View>
				</Animated.View>

				{/* Badges earned */}
				<Animated.View
					entering={FadeInUp.duration(500).delay(1200)}
					style={styles.badgesContainer}
				>
					<Text style={styles.badgesTitle}>Badges Earned</Text>
					<View style={styles.badgesRow}>
						{earnedBadges.map((badgeId) => {
							const badge = BADGE_ICON_MAP[badgeId] ?? {
								icon: "ribbon-outline" as const,
								label: badgeId.replace(/-/g, " "),
							};

							return (
								<View
									key={badgeId}
									style={styles.badgeChip}
									accessibilityLabel={badge.label}
								>
									<Ionicons
										name={badge.icon}
										size={18}
										color={ONBOARDING_COLORS.accentWarm}
									/>
								</View>
							);
						})}
					</View>
				</Animated.View>

				{/* farewell */}
				<Animated.View
					entering={FadeInUp.duration(500).delay(1500)}
					style={styles.messageCard}
				>
					<Text style={styles.messageText}>
						"We'll be here whenever you need help.{"\n"}Let's master prompts
						together!"
					</Text>
					<Text style={styles.messageSender}>— The PromptPal Team</Text>
				</Animated.View>

				<View style={styles.spacer} />

				{/* Start button */}
				<Animated.View
					entering={FadeInUp.duration(500).delay(1800)}
					style={styles.buttonContainer}
				>
					<Animated.View style={buttonPulse}>
						<TouchableOpacity
							style={styles.startButton}
							onPress={handleStart}
							activeOpacity={0.85}
							accessibilityRole="button"
							accessibilityLabel="Finish onboarding and start playing"
						>
							<Ionicons
								name="game-controller"
								size={22}
								color={ONBOARDING_COLORS.textOnAccent}
							/>
							<Text style={styles.startText}>Start Playing</Text>
						</TouchableOpacity>
					</Animated.View>
				</Animated.View>
			</View>
		</OnboardingScreenWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		paddingHorizontal: 24,
	},
	topSpace: { flex: 0.02 },
	center: { alignItems: "center" },
	fireworksRow: {
		flexDirection: "row",
		gap: 16,
		marginBottom: 4,
		alignItems: "center",
	},
	titleContainer: {
		alignItems: "center",
		marginTop: 16,
	},
	title: {
		fontSize: 30,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 15,
		color: ONBOARDING_COLORS.textMuted,
		textAlign: "center",
		lineHeight: 22,
		marginTop: 8,
		fontWeight: "500",
	},
	statsCard: {
		backgroundColor: "rgba(0, 0, 0, 0.04)",
		borderRadius: 22,
		padding: 20,
		marginTop: 20,
		width: "100%",
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.12)",
	},
	statsTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: ONBOARDING_COLORS.textSubtle,
		textTransform: "uppercase",
		letterSpacing: 2,
		textAlign: "center",
		marginBottom: 16,
	},
	statsRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
	},
	statItem: {
		alignItems: "center",
		flex: 1,
	},

	statValue: {
		fontSize: 20,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
	},
	statLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: ONBOARDING_COLORS.textSubtle,
		marginTop: 2,
	},
	statDivider: {
		width: 1,
		height: 40,
		backgroundColor: "rgba(0, 0, 0, 0.06)",
	},
	badgesContainer: {
		marginTop: 18,
		alignItems: "center",
	},
	badgesTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: ONBOARDING_COLORS.accentWarm,
		textTransform: "uppercase",
		letterSpacing: 2,
		marginBottom: 10,
	},
	badgesRow: {
		flexDirection: "row",
		gap: 8,
	},
	badgeChip: {
		width: 44,
		height: 44,
		borderRadius: 14,
		backgroundColor: "rgba(245, 158, 11, 0.08)",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(245, 158, 11, 0.15)",
	},

	messageCard: {
		backgroundColor: "rgba(187, 134, 252, 0.06)",
		borderRadius: 18,
		padding: 16,
		marginTop: 18,
		borderWidth: 1,
		borderColor: "rgba(187, 134, 252, 0.12)",
		alignItems: "center",
	},
	messageText: {
		fontSize: 14,
		color: ONBOARDING_COLORS.textSecondary,
		fontStyle: "italic",
		textAlign: "center",
		lineHeight: 20,
		fontWeight: "500",
	},
	messageSender: {
		fontSize: 12,
		color: "#BB86FC",
		fontWeight: "700",
		marginTop: 6,
	},
	spacer: { flex: 1 },
	buttonContainer: {
		width: "100%",
		paddingBottom: 32,
	},
	startButton: {
		backgroundColor: "#FF6B00",
		borderRadius: 28,
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		shadowColor: "#FF6B00",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.5,
		shadowRadius: 20,
		elevation: 10,
	},
	startText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "900",
		letterSpacing: 0.5,
	},
});
