import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
	FadeInUp,
	FadeInDown,
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { useOnboardingStore } from "../store";
import { ONBOARDING_COLORS } from "../theme";

export function StoryIntroScreen() {
	const { goToNextStep } = useOnboardingStore();
	const pulseScale = useSharedValue(1);

	React.useEffect(() => {
		pulseScale.value = withRepeat(
			withSequence(
				withTiming(1.05, { duration: 1200 }),
				withTiming(1, { duration: 1200 }),
			),
			-1,
			true,
		);
	}, [pulseScale.value]);

	const buttonPulse = useAnimatedStyle(() => ({
		transform: [{ scale: pulseScale.value }],
	}));

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		goToNextStep();
	};

	return (
		<OnboardingScreenWrapper showProgress={true}>
			<View style={styles.container}>
				<View style={styles.iconContainer}>
					<Animated.View entering={FadeInDown.duration(600).delay(200)}>
						<Image
							source={require("../../../../assets/avatar-hi.png")}
							style={styles.avatarIcon}
							resizeMode="contain"
							accessibilityRole="image"
							accessibilityLabel="PromptPal avatar"
						/>
					</Animated.View>
				</View>

				<Animated.View
					entering={FadeInUp.duration(500).delay(400)}
					style={styles.textContainer}
				>
					<Text style={styles.title}>The Secret of Great Prompts</Text>

					<Text style={styles.description}>
						Every amazing AI creation starts with a great prompt. But what makes
						a prompt great?
					</Text>

					<Text style={styles.highlight}>
						Let's discover the three magic ingredients... ✨
					</Text>
				</Animated.View>

				<View style={styles.spacer} />

				<Animated.View
					entering={FadeInUp.duration(500).delay(800)}
					style={styles.buttonContainer}
				>
					<Animated.View style={buttonPulse}>
						<TouchableOpacity
							style={styles.button}
							onPress={handleContinue}
							activeOpacity={0.85}
						>
							<Text style={styles.buttonText}>Continue</Text>
							<Ionicons
								name="arrow-forward"
								size={20}
								color="#FFFFFF"
								style={{ marginLeft: 8 }}
							/>
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
		paddingHorizontal: 32,
		paddingTop: 40,
	},
	iconContainer: {
		marginBottom: 16,
		backgroundColor: "transparent",
		padding: 0,
		borderRadius: 0,
	},
	avatarIcon: {
		width: 260,
		height: 260,
		borderRadius: 0,
	},
	textContainer: {
		alignItems: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: ONBOARDING_COLORS.textPrimary,
		marginBottom: 24,
		textAlign: "center",
	},
	description: {
		fontSize: 18,
		color: ONBOARDING_COLORS.textSecondary,
		textAlign: "center",
		lineHeight: 28,
		marginBottom: 32,
	},
	highlight: {
		fontSize: 18,
		color: ONBOARDING_COLORS.accent,
		fontWeight: "700",
		textAlign: "center",
	},
	spacer: {
		flex: 1,
	},
	buttonContainer: {
		width: "100%",
		paddingBottom: 32,
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
