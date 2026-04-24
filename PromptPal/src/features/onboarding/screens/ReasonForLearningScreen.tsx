import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import * as Haptics from "expo-haptics";
import { useOnboardingStore } from "../store";
import { OnboardingScreenWrapper } from "../components/OnboardingScreenWrapper";
import { BackArrowIcon, ProgressBarBackground } from "@/components/Icons";

const OPTIONS = [
	{
		id: 1,
		label: "Advance my career",
		icon: require("../../../../assets/images/Rectangle 2.png"),
	},
	{
		id: 2,
		label: "Make more money",
		icon: require("../../../../assets/images/Rectangle 2-1.png"),
	},
	{
		id: 3,
		label: "Build apps / startups",
		icon: require("../../../../assets/images/Rectangle 2-2.png"),
	},
	{
		id: 4,
		label: "Automate my work",
		icon: require("../../../../assets/images/Rectangle 2-3.png"),
	},
	{
		id: 5,
		label: "Learn something new",
		icon: require("../../../../assets/images/Rectangle 2-4.png"),
	},
	{
		id: 6,
		label: "Stay ahead of the future",
		icon: require("../../../../assets/images/Rectangle 2-5.png"),
	},
];

export function ReasonForLearningScreen() {
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const { goToNextStep } = useOnboardingStore();

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		goToNextStep();
	};

	return (
		<OnboardingScreenWrapper showProgress={false}>
			<View style={styles.container}>
				{/* Header */}
				<View style={styles.header}>
					{/* No back button on first screen */}
					<View style={styles.backButtonPlaceholder} />
					<View style={styles.progressBarContainer}>
						<ProgressBarBackground progress={5} />
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
						What's your reason for learning AI?
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
								<Image
									source={option.icon}
									style={{ width: 24, height: 24, marginRight: 16 }}
									resizeMode="contain"
								/>
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
	backButtonPlaceholder: {
		width: 24,
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
		fontSize: 26,
		fontWeight: "700",
		color: "#3C3C3C",
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
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "bold",
		letterSpacing: 1,
	},
	continueButtonTextDisabled: {
		color: "#A0A0A0",
	},
});
