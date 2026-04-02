import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { useOnboardingStore } from "../store";
import { ONBOARDING_COLORS } from "../theme";

export function Concept3Screen() {
	const { goToNextStep } = useOnboardingStore();

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		goToNextStep();
	};

	return (
		<OnboardingScreenWrapper showProgress={true}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.container}>
					<Animated.View
						entering={FadeInDown.duration(600).delay(200)}
						style={styles.iconContainer}
					>
						<Ionicons name="bug" size={64} color="#FFD700" />
					</Animated.View>

					<Animated.View
						entering={FadeInUp.duration(500).delay(400)}
						style={styles.textContainer}
					>
						<Text style={styles.title}>Ingredient 3: Guardrails</Text>

						<Text style={styles.description}>
							Fixing bugs requires precise instructions and "guardrails" to
							prevent breaking existing code.
						</Text>

						<View style={styles.bulletPoints}>
							<View style={styles.bulletRow}>
								<Ionicons
									name="search"
									size={24}
									color={ONBOARDING_COLORS.success}
								/>
								<Text style={styles.bulletText}>
									Precision: Where is the bug?
								</Text>
							</View>
							<View style={styles.bulletRow}>
								<Ionicons
									name="shield-checkmark"
									size={24}
									color={ONBOARDING_COLORS.success}
								/>
								<Text style={styles.bulletText}>
									Guardrails: What should stay the same?
								</Text>
							</View>
							<View style={styles.bulletRow}>
								<Ionicons
									name="git-compare"
									size={24}
									color={ONBOARDING_COLORS.success}
								/>
								<Text style={styles.bulletText}>
									Expected: What is the fix?
								</Text>
							</View>
						</View>

						<View style={styles.exampleBox}>
							<Text style={styles.exampleTitle}>Hard Level Goal</Text>
							<Text style={styles.exampleGood}>
								"Fix the add button to block empty inputs, but keep the current
								styling exactly as is."
							</Text>
						</View>
					</Animated.View>

					<View style={styles.spacer} />

					<Animated.View
						entering={FadeInUp.duration(500).delay(800)}
						style={styles.buttonContainer}
					>
						<TouchableOpacity
							style={styles.button}
							onPress={handleContinue}
							activeOpacity={0.85}
						>
							<Text style={styles.buttonText}>Try Hard Level</Text>
							<Ionicons
								name="arrow-forward"
								size={20}
								color="#FFFFFF"
								style={{ marginLeft: 8 }}
							/>
						</TouchableOpacity>
					</Animated.View>
				</View>
			</ScrollView>
		</OnboardingScreenWrapper>
	);
}

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingTop: 20,
		paddingBottom: 32,
	},
	container: {
		flex: 1,
		width: "100%",
		maxWidth: 520,
		alignSelf: "center",
		alignItems: "center",
	},
	iconContainer: {
		marginBottom: 24,
		backgroundColor: "rgba(255, 215, 0, 0.1)",
		padding: 24,
		borderRadius: 50,
	},
	textContainer: {
		alignItems: "center",
		width: "100%",
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
		marginBottom: 16,
		textAlign: "center",
	},
	description: {
		fontSize: 18,
		color: ONBOARDING_COLORS.textSecondary,
		textAlign: "center",
		lineHeight: 28,
		marginBottom: 24,
	},
	bulletPoints: {
		width: "100%",
		marginBottom: 30,
	},
	bulletRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		marginBottom: 16,
		backgroundColor: "rgba(0,0,0,0.05)",
		padding: 12,
		borderRadius: 12,
	},
	bulletText: {
		flex: 1,
		color: ONBOARDING_COLORS.textPrimary,
		fontSize: 16,
		lineHeight: 22,
		marginLeft: 12,
		fontWeight: "500",
	},
	exampleBox: {
		width: "100%",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		padding: 20,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.08)",
	},
	exampleTitle: {
		color: ONBOARDING_COLORS.textMuted,
		textTransform: "uppercase",
		fontWeight: "700",
		fontSize: 12,
		marginBottom: 12,
		letterSpacing: 1,
	},
	exampleGood: {
		color: ONBOARDING_COLORS.success,
		fontSize: 18,
		lineHeight: 26,
		fontWeight: "600",
		marginBottom: 8,
	},
	spacer: {
		flex: 1,
	},
	buttonContainer: {
		width: "100%",
		paddingTop: 24,
	},
	button: {
		backgroundColor: ONBOARDING_COLORS.accent,
		borderRadius: 28,
		height: 60,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		shadowColor: ONBOARDING_COLORS.accent,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.4,
		shadowRadius: 16,
		elevation: 8,
	},
	buttonText: {
		color: "#FFFFFF",
		fontSize: 18,
		fontWeight: "800",
		letterSpacing: 0.5,
	},
});
