import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useOnboardingStore } from "../store";
import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { BackArrowIcon, ProgressBarBackground } from "@/components/Icons";

const OPTIONS = [
	{
		id: 1,
		label: "Beginner (I've never used AI tools)",
		icon: "signal-cellular-1" as const,
	},
	{
		id: 2,
		label: "Basic (I've tried ChatGPT or similar)",
		icon: "signal-cellular-2" as const,
	},
	{
		id: 3,
		label: "Intermediate (I use AI regularly)",
		icon: "signal-cellular-3" as const,
	},
	{
		id: 4,
		label: "Advanced (I build with AI)",
		icon: "signal-cellular-outline" as const,
	},
];

export function ExperienceScreen() {
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const { goToNextStep, goToPreviousStep } = useOnboardingStore();

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		goToNextStep();
	};

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		goToPreviousStep();
	};

	return (
		<OnboardingScreenWrapper showProgress={false}>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<BackArrowIcon />
					</TouchableOpacity>
					<View style={styles.progressBarContainer}>
						<ProgressBarBackground progress={15} />
					</View>
				</View>

				{/* Mascot and Title */}
				<View style={styles.titleSection}>
					<View style={styles.mascotContainer}>
						<Image
							source={require("../../../../assets/images/simplification.png")}
							style={{ width: 80, height: 80 }}
							resizeMode="contain"
						/>
					</View>
					<Text style={styles.titleText}>
						How much AI{"\n"}do you know?
					</Text>
				</View>

				{/* Options List */}
				<View style={styles.optionsList}>
					{OPTIONS.map((option) => {
						const isSelected = selectedOption === option.id;
						return (
							<TouchableOpacity
								key={option.id}
								style={[
									styles.optionButton,
									isSelected && styles.optionButtonSelected,
								]}
								onPress={() => setSelectedOption(option.id)}
								activeOpacity={0.7}
							>
								<View style={styles.optionIconContainer}>
									<MaterialCommunityIcons
										name={option.icon as any}
										size={24}
										color="#FFC107"
									/>
								</View>
								<Text
									style={[
										styles.optionLabel,
										isSelected && styles.optionLabelSelected,
									]}
								>
									{option.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Footer Button */}
				<View style={styles.footer}>
					<TouchableOpacity
						style={[
							styles.continueButton,
							!selectedOption && styles.continueButtonDisabled,
						]}
						disabled={!selectedOption}
						onPress={handleContinue}
					>
						<Text
							style={[
								styles.continueButtonText,
								!selectedOption && styles.continueButtonTextDisabled,
							]}
						>
							CONTINUE
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</OnboardingScreenWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F7",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		marginTop: 10,
		marginBottom: 25,
	},
	backButton: {
		marginRight: 20,
	},
	progressBarContainer: {
		flex: 1,
		height: 19,
		justifyContent: "center",
	},
	titleSection: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		marginBottom: 35,
		height: 80,
	},
	mascotContainer: {
		marginRight: 20,
	},
	titleText: {
		fontSize: 30,
		fontWeight: "700",
		color: "#3C3C3C",
		lineHeight: 36,
		flexShrink: 1,
	},
	optionsList: {
		paddingHorizontal: 20,
	},
	optionButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 13,
		borderWidth: 2,
		borderBottomWidth: 4,
		borderColor: "#E5E5E5",
		height: 66,
		paddingHorizontal: 20,
		marginBottom: 10,
	},
	optionButtonSelected: {
		borderColor: "#5CD615",
		backgroundColor: "#EFFCE6",
		borderBottomWidth: 4,
	},
	optionIconContainer: {
		width: 30,
		height: 30,
		justifyContent: "center",
		alignItems: "flex-start",
		marginRight: 10,
	},
	optionLabel: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#3C3C3C",
	},
	optionLabelSelected: {
		color: "#5CD615",
	},
	footer: {
		marginTop: "auto",
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	continueButton: {
		backgroundColor: "#5CD615",
		height: 52,
		borderRadius: 13,
		borderBottomWidth: 4,
		borderBottomColor: "#46A310",
		alignItems: "center",
		justifyContent: "center",
	},
	continueButtonDisabled: {
		backgroundColor: "#E5E5E5",
		borderBottomColor: "#D3D3D3",
	},
	continueButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "bold",
		letterSpacing: 1,
	},
	continueButtonTextDisabled: {
		color: "#A0A0A0",
	},
});
