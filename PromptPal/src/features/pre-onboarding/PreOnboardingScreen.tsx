import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
	Image,
	Modal,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BackArrowIcon, ProgressBarBackground } from "@/components/Icons";
import Svg, { Path } from "react-native-svg";
import {
	PRE_ONBOARDING_STEPS,
	StepConfig,
	usePreOnboardingStore,
} from "./store";

// Map step id -> require() for mascot icon per option screen
const OPTION_ICONS: Record<string, any> = {
	reason: {
		1: require("../../../assets/images/Rectangle 2.png"),
		2: require("../../../assets/images/Rectangle 2-1.png"),
		3: require("../../../assets/images/Rectangle 2-2.png"),
		4: require("../../../assets/images/Rectangle 2-3.png"),
		5: require("../../../assets/images/Rectangle 2-4.png"),
		6: require("../../../assets/images/Rectangle 2-5.png"),
	},
};

const mascotImage = require("../../../assets/images/simplification.png");

const ACHIEVEMENT_ICONS: any[] = [
	require("../../../assets/onboard45.png"),
	require("../../../assets/onboard46.png"),
	require("../../../assets/onboard41.png"),
	require("../../../assets/onboard42.png"),
	require("../../../assets/onboard43.png"),
];

// ─── Streak Icons ───────────────────────────────────────────────────
const LargeFireIcon = () => (
	<Image source={require("../../../assets/Group 17.png")} style={{ width: 74, height: 108 }} resizeMode="contain" />
);

const FreezeIcon = () => (
	<Image source={require("../../../assets/Icons.png")} style={{ width: 30, height: 35 }} resizeMode="contain" />
);

const ShareIcon = () => (
	<Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
		<Path d="M14 2.33331V17.5M14 2.33331L18.6666 6.99998M14 2.33331L9.33329 6.99998M4.66663 14V23.3333C4.66663 23.9522 4.91246 24.5456 5.35004 24.9832C5.78763 25.4208 6.38112 25.6666 6.99996 25.6666H21C21.6188 25.6666 22.2123 25.4208 22.6499 24.9832C23.0875 24.5456 23.3333 23.9522 23.3333 23.3333V14" stroke="#3C3C3C" strokeWidth={2.33333} strokeLinecap="round" strokeLinejoin="round" />
	</Svg>
);

const SmallFireIcon = () => (
	<Image source={require("../../../assets/Group 17.png")} style={{ width: 24, height: 35 }} resizeMode="contain" />
);


// ─── Options Screen ──────────────────────────────────────────────────
function OptionsScreen({ config }: { config: StepConfig }) {
	const { goToNextStep, goToPreviousStep, setAnswer, answers } =
		usePreOnboardingStore();
	const [selectedOption, setSelectedOption] = useState<number | null>(
		answers[config.id] ?? null,
	);

	const handleContinue = () => {
		if (selectedOption == null) return;
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setAnswer(config.id, selectedOption);
		goToNextStep();
	};

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		goToPreviousStep();
	};

	const icons = OPTION_ICONS[config.id];

	return (
		<View style={styles.innerContainer}>
			{/* Header */}
			<View style={styles.header}>
				{config.showBackButton ? (
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<BackArrowIcon />
					</TouchableOpacity>
				) : (
					<View style={styles.backButtonPlaceholder} />
				)}
				<View style={styles.progressBarContainer}>
					<ProgressBarBackground progress={config.progress} />
				</View>
			</View>

			{/* Mascot and Title */}
			<View style={styles.titleSection}>
				<View style={styles.mascotContainer}>
					<Image
						source={mascotImage}
						style={{ width: 80, height: 80 }}
						resizeMode="contain"
					/>
				</View>
				<Text style={styles.titleText}>{config.title}</Text>
			</View>

			{/* Options List */}
			<View style={styles.optionsList}>
				{config.options?.map((option) => {
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
							{/* Icon: image, material icon, or none */}
							{icons?.[option.id] && (
								<Image
									source={icons[option.id]}
									style={{ width: 24, height: 24, marginRight: 16 }}
									resizeMode="contain"
								/>
							)}
							{option.iconName && (
								<View style={styles.optionIconContainer}>
									<MaterialCommunityIcons
										name={option.iconName as any}
										size={24}
										color="#FFC107"
									/>
								</View>
							)}

							<Text
								style={[
									styles.optionLabel,
									isSelected && styles.optionLabelSelected,
									{ flex: 1 },
								]}
							>
								{option.label}
							</Text>

							{option.rightLabel && (
								<Text
									style={[
										styles.rightLabel,
										isSelected && styles.rightLabelSelected,
									]}
								>
									{option.rightLabel}
								</Text>
							)}
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
						{config.buttonText ?? "CONTINUE"}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

// ─── Notification Screen ─────────────────────────────────────────────
function NotificationScreen({ config }: { config: StepConfig }) {
	const { goToNextStep, goToPreviousStep } = usePreOnboardingStore();
	const [isModalVisible, setIsModalVisible] = useState(false);

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		goToPreviousStep();
	};

	return (
		<View style={styles.innerContainer}>
			{/* Header */}
			<View style={styles.header}>
				{config.showBackButton ? (
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<BackArrowIcon />
					</TouchableOpacity>
				) : (
					<View style={styles.backButtonPlaceholder} />
				)}
				<View style={styles.progressBarContainer}>
					<ProgressBarBackground progress={config.progress} />
				</View>
			</View>

			{/* Mascot and Title */}
			<View style={styles.titleSection}>
				<View style={styles.mascotContainer}>
					<Image
						source={mascotImage}
						style={{ width: 80, height: 80 }}
						resizeMode="contain"
					/>
				</View>
				<Text style={styles.titleText}>{config.title}</Text>
			</View>

			{/* Notification illustration area */}
			<View style={styles.notificationArea}>
				<View style={styles.notificationCard}>
					<Ionicons name="notifications" size={40} color="#5CD615" />
					<Text style={styles.notificationTitle}>
						Daily practice reminders
					</Text>
					<Text style={styles.notificationSubtitle}>
						We'll send you a gentle nudge to keep your streak going
					</Text>
				</View>
			</View>

			{/* Footer Button */}
			<View style={styles.footer}>
				<TouchableOpacity
					style={styles.continueButton}
					onPress={() => setIsModalVisible(true)}
				>
					<Text style={styles.continueButtonText}>
						{config.buttonText ?? "REMIND ME TO PRACTICE"}
					</Text>
				</TouchableOpacity>
			</View>

			{/* Custom iOS-like Alert Modal */}
			<Modal transparent visible={isModalVisible} animationType="fade">
				<View style={styles.modalBackdrop}>
					<View style={styles.modalBox}>
						<View style={styles.modalContent}>
							<Text style={styles.modalTitle}>
								“PromptPal” Would Like To Send You Notifications
							</Text>
							<Text style={styles.modalBody}>
								Notifications may include alerts, sounds, and icon badges. These
								can be configured in settings
							</Text>
						</View>
						<View style={styles.modalHorizontalDivider} />
						<View style={styles.modalButtonContainer}>
							<Pressable
								style={styles.modalButton}
								onPress={() => {
									setIsModalVisible(false);
									goToNextStep();
								}}
							>
								<Text style={styles.modalButtonText}>Don't Allow</Text>
							</Pressable>
							<View style={styles.modalVerticalDivider} />
							<Pressable
								style={styles.modalButton}
								onPress={() => {
									setIsModalVisible(false);
									goToNextStep();
								}}
							>
								<Text style={[styles.modalButtonText, styles.modalButtonPrimary]}>
									Allow
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</View>
	);
}

// ─── Achievement Screen ──────────────────────────────────────────────
function AchievementScreen({ config }: { config: StepConfig }) {
	const { goToNextStep, goToPreviousStep } = usePreOnboardingStore();

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		goToPreviousStep();
	};

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		goToNextStep();
	};

	return (
		<View style={styles.innerContainer}>
			{/* Header */}
			<View style={styles.header}>
				{config.showBackButton ? (
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<BackArrowIcon />
					</TouchableOpacity>
				) : (
					<View style={styles.backButtonPlaceholder} />
				)}
				<View style={styles.progressBarContainer}>
					<ProgressBarBackground progress={config.progress} />
				</View>
			</View>

			{/* Mascot and Title */}
			<View style={styles.titleSection}>
				<View style={styles.mascotContainer}>
					<Image
						source={mascotImage}
						style={{ width: 80, height: 80 }}
						resizeMode="contain"
					/>
				</View>
				<Text style={styles.titleText}>{config.title}</Text>
			</View>

			{/* Achievement List */}
			<View style={styles.optionsList}>
				{config.options?.map((option, index) => (
					<View key={option.id} style={styles.achievementRow}>
						<View style={styles.achievementIcon}>
							<Image
								source={ACHIEVEMENT_ICONS[index] || ACHIEVEMENT_ICONS[0]}
								style={{ width: 24, height: 24 }}
								resizeMode="contain"
							/>
						</View>
						<Text style={[styles.achievementLabel, { flex: 1 }]}>
							{option.label}
						</Text>
					</View>
				))}
			</View>

			{/* Footer Button */}
			<View style={styles.footer}>
				<TouchableOpacity
					style={styles.continueButton}
					onPress={handleContinue}
				>
					<Text style={styles.continueButtonText}>
						{config.buttonText ?? "CONTINUE"}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

// ─── Subscription Screen ─────────────────────────────────────────────
function SubscriptionScreen({ config }: { config: StepConfig }) {
	const { goToPreviousStep, goToNextStep } = usePreOnboardingStore();

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		goToPreviousStep();
	};

	const handlePremium = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		// Logic for premium subscription would go here
		goToNextStep();
	};

	const handleFree = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		goToNextStep();
	};

	return (
		<View style={styles.innerContainer}>
			{/* Header */}
			<View style={styles.header}>
				{config.showBackButton ? (
					<TouchableOpacity style={styles.backButton} onPress={handleBack}>
						<BackArrowIcon />
					</TouchableOpacity>
				) : (
					<View style={styles.backButtonPlaceholder} />
				)}
				<View style={styles.progressBarContainer}>
					<ProgressBarBackground progress={config.progress} />
				</View>
			</View>

			{/* Mascot and Title */}
			<View style={styles.subscriptionTitleSection}>
				<View style={styles.mascotContainer}>
					<Image
						source={mascotImage} // Replace with owl_mascot.png when available
						style={{ width: 80, height: 80 }}
						resizeMode="contain"
					/>
				</View>
				<Text style={styles.subscriptionTitleText}>{config.title}</Text>
			</View>

			{/* Plan Cards */}
			<View style={styles.plansContainer}>
				{/* Premium Card */}
				<View style={styles.planCard}>
					<Text style={styles.planLabel}>Premium</Text>
					<View style={styles.priceRow}>
						<Text style={styles.priceValue}>$69</Text>
						<Text style={styles.priceUnit}> /month</Text>
					</View>

					<View style={styles.featuresList}>
						<View style={styles.featureRow}>
							<Ionicons name="checkmark" size={18} color="#5CD615" />
							<Text style={styles.featureText}>Full course access</Text>
						</View>
						<View style={styles.featureRow}>
							<Ionicons name="checkmark" size={18} color="#5CD615" />
							<Text style={styles.featureText}>Advanced AI tools</Text>
						</View>
						<View style={styles.featureRow}>
							<Ionicons name="checkmark" size={18} color="#5CD615" />
							<Text style={styles.featureText}>Projects + templates</Text>
						</View>
						<View style={styles.featureRow}>
							<Ionicons name="checkmark" size={18} color="#5CD615" />
							<Text style={styles.featureText}>Faster progress</Text>
						</View>
					</View>

					<TouchableOpacity style={styles.planButton} onPress={handlePremium}>
						<Text style={styles.planButtonText}>GET FULL ACCESS</Text>
					</TouchableOpacity>
				</View>

				{/* Free Card */}
				<View style={styles.planCard}>
					<Text style={styles.planLabel}>Free</Text>
					<View style={styles.priceRow}>
						<Text style={styles.priceValue}>$0</Text>
						<Text style={styles.priceUnit}> /month</Text>
					</View>

					<View style={styles.featuresList}>
						<View style={styles.featureRow}>
							<Ionicons name="checkmark" size={18} color="#5CD615" />
							<Text style={styles.featureText}>Limited lessons</Text>
						</View>
						<View style={styles.featureRow}>
							<Ionicons name="checkmark" size={18} color="#5CD615" />
							<Text style={styles.featureText}>Basic tools</Text>
						</View>
					</View>

					<TouchableOpacity style={styles.planButton} onPress={handleFree}>
						<Text style={styles.planButtonText}>CONTINUE FREE</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

// ─── Streak Screen ───────────────────────────────────────────────────
function StreakScreen({ config: _config }: { config: StepConfig }) {
	const { goToNextStep } = usePreOnboardingStore();
	const insets = useSafeAreaInsets();

	const today = new Date();
	const [displayMonth, setDisplayMonth] = useState(today.getMonth());
	const [displayYear, setDisplayYear] = useState(today.getFullYear());
	const [activeTab, setActiveTab] = useState("PERSONAL");

	const MONTH_NAMES = [
		"January","February","March","April","May","June",
		"July","August","September","October","November","December",
	];
	const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sat", "Su"];

	const getDaysInMonth = (month: number, year: number) =>
		new Date(year, month + 1, 0).getDate();

	const getFirstDayOfMonth = (month: number, year: number) => {
		const day = new Date(year, month, 1).getDay();
		return day === 0 ? 6 : day - 1; // Mon-based (0=Mon, 6=Sun)
	};

	const daysInMonth = getDaysInMonth(displayMonth, displayYear);
	const firstDay = getFirstDayOfMonth(displayMonth, displayYear);

	// Mark some days as completed
	const completedDays = new Set<number>();
	if (displayMonth === today.getMonth() && displayYear === today.getFullYear()) {
		completedDays.add(10); // Hardcoded to match screenshot
	}

	const calendarCells: (number | null)[] = [
		...Array(firstDay).fill(null),
		...Array.from({ length: daysInMonth }, (_, i) => i + 1),
	];

	const STREAK_COUNT = 472;

	const handlePrevMonth = () => {
		if (displayMonth === 0) {
			setDisplayMonth(11);
			setDisplayYear((y) => y - 1);
		} else {
			setDisplayMonth((m) => m - 1);
		}
	};

	const handleNextMonth = () => {
		if (displayMonth === 11) {
			setDisplayMonth(0);
			setDisplayYear((y) => y + 1);
		} else {
			setDisplayMonth((m) => m + 1);
		}
	};

	return (
		<View style={[styles.streakContainerAlternative, { paddingTop: insets.top }]}>
			{/* Top Bar */}
			<View style={styles.streakTopBar}>
				<TouchableOpacity onPress={goToNextStep}>
					<Ionicons name="close" size={32} color="#3C3C3C" />
				</TouchableOpacity>
				<Text style={styles.streakScreenTitle}>Streak</Text>
				<TouchableOpacity>
					<ShareIcon />
				</TouchableOpacity>
			</View>

			{/* Tabs */}
			<View style={styles.streakTabsContainer}>
				<TouchableOpacity 
					style={[styles.streakTab, activeTab === "PERSONAL" && styles.streakTabActive]}
					onPress={() => setActiveTab("PERSONAL")}
				>
					<Text style={[styles.streakTabText, activeTab === "PERSONAL" && styles.streakTabTextActive]}>PERSONAL</Text>
				</TouchableOpacity>
				<TouchableOpacity 
					style={[styles.streakTab, activeTab === "FRIENDS" && styles.streakTabActive]}
					onPress={() => setActiveTab("FRIENDS")}
				>
					<Text style={[styles.streakTabText, activeTab === "FRIENDS" && styles.streakTabTextActive]}>FRIENDS</Text>
				</TouchableOpacity>
			</View>

			<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.streakScrollContent}>
				{/* Green Banner */}
				<View style={styles.streakGreenBanner}>
					<View style={styles.streakGreenBannerContent}>
						<View>
							<Text style={styles.streakGiantNumber}>{STREAK_COUNT}</Text>
							<Text style={styles.streakGiantSub}>day streak!</Text>
						</View>
						<Image source={require("../../../assets/Group 17.png")} style={{ width: 85, height: 110 }} resizeMode="contain" />
					</View>
				</View>

				{/* Overlapping Info Card */}
				<View style={styles.overlapInfoCardContainer}>
					<View style={styles.overlapInfoCard}>
						<Image source={require("../../../assets/Group 17.png")} style={{ width: 20, height: 28, marginRight: 12 }} resizeMode="contain" />
						<Text style={styles.overlapInfoCardText}>Keep your Prefect Streak by doing a lesson every day!</Text>
					</View>
				</View>

				{/* Month Header */}
				<View style={styles.monthHeaderRow}>
					<Text style={styles.monthHeaderText}>{MONTH_NAMES[displayMonth]} {displayYear}</Text>
					<View style={styles.monthArrows}>
						<TouchableOpacity onPress={handlePrevMonth} style={styles.monthArrowBtn}>
							<Ionicons name="chevron-back" size={18} color="#8E8E93" />
						</TouchableOpacity>
						<TouchableOpacity onPress={handleNextMonth} style={styles.monthArrowBtn}>
							<Ionicons name="chevron-forward" size={18} color="#8E8E93" />
						</TouchableOpacity>
					</View>
				</View>

				{/* Stats Cards */}
				<View style={styles.statsCardsRow}>
					<View style={styles.statCardLeft}>
						<View style={styles.perfectBadge}>
							<Text style={styles.perfectBadgeText}>PERFECT</Text>
						</View>
						<View style={styles.statCardValueRow}>
							<Image source={require("../../../assets/Group 17.png")} style={{ width: 22, height: 30, marginRight: 8 }} resizeMode="contain" />
							<Text style={styles.statCardValueText}>10</Text>
						</View>
						<Text style={styles.statCardLabelText}>Days practiced</Text>
					</View>
					
					<View style={styles.statCardRight}>
						<View style={styles.statCardValueRow}>
							<Image source={require("../../../assets/Icons.png")} style={{ width: 26, height: 26, marginRight: 8 }} resizeMode="contain" />
							<Text style={styles.statCardValueText}>10</Text>
						</View>
						<Text style={styles.statCardLabelText}>Freezes used</Text>
					</View>
				</View>

				{/* Calendar Grid */}
				<View style={styles.calContainer}>
					<View style={styles.calDayLabelsRow}>
						{DAY_LABELS.map((d) => (
							<Text key={d} style={styles.calDayLabel}>{d}</Text>
						))}
					</View>

					<View style={styles.calGrid}>
						{calendarCells.map((day, idx) => {
							const isToday = day === 13; // Hardcoded to match screenshot
							const isCompleted = day === 10; // Hardcoded to match screenshot
							
							return (
								<View key={idx} style={styles.calCell}>
									{day !== null && (
										<View
											style={[
												styles.calDay,
												isCompleted && styles.calDayCompleted,
												isToday && styles.calDayToday,
											]}
										>
											<Text
												style={[
													styles.calDayText,
													isCompleted && styles.calDayTextCompleted,
													isToday && styles.calDayTextToday,
												]}
											>
												{day}
											</Text>
										</View>
									)}
								</View>
							);
						})}
					</View>
				</View>
				<View style={{height: 120}} />
			</ScrollView>

			<View style={[styles.streakFooterAlternative, { paddingBottom: Math.max(insets.bottom, 20) }]}>
				<TouchableOpacity
					style={styles.continueButtonGreen}
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						goToNextStep();
					}}
				>
					<Text style={styles.continueButtonGreenText}>CONTINUE</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

// ─── Success Reaction Screen ─────────────────────────────────────────
function SuccessReactionScreen({ config }: { config: StepConfig }) {
	const { completePreOnboarding, goToNextStep } = usePreOnboardingStore();
	const insets = useSafeAreaInsets();

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		completePreOnboarding();
	};

	const DAY_LABELS = [
		{ label: "Mo", status: "completed" },
		{ label: "Tu", status: "completed" },
		{ label: "We", status: "completed" },
		{ label: "Th", status: "completed" },
		{ label: "Fr", status: "today-completed" }, // outline with inner check
		{ label: "Sa", status: "future" },
		{ label: "Su", status: "future" },
	];

	return (
		<View style={srStyles.container}>
			{/* Green Banner Area */}
			<View style={[srStyles.greenBanner, { paddingTop: insets.top + 20 }]}>
				<Animated.View entering={ZoomIn.duration(500)}>
					<Image 
						source={require("../../../assets/Group 17.png")} 
						style={{ width: 100, height: 130, marginBottom: 10 }} 
						resizeMode="contain" 
					/>
				</Animated.View>

				<Animated.Text
					entering={ZoomIn.duration(600).delay(150)}
					style={srStyles.bigNumber}
				>
					5
				</Animated.Text>

				<Animated.View entering={FadeIn.duration(400).delay(300)}>
					<Text style={srStyles.label}>day streak!</Text>
				</Animated.View>
			</View>

			{/* White Bottom Area */}
			<View style={srStyles.whiteBottomArea}>
				<View style={srStyles.weekDaysRow}>
					{DAY_LABELS.map((day, idx) => (
						<View 
							key={idx} 
							style={[
								srStyles.dayColumn, 
								day.status !== "future" ? srStyles.dayColumnActive : null
							]}
						>
							<Text style={srStyles.dayLabelText}>
								{day.label}
							</Text>
							{day.status === "completed" && (
								<View style={srStyles.circleCompleted}>
									<Ionicons name="checkmark" size={16} color="#FFFFFF" />
								</View>
							)}
							{day.status === "today-completed" && (
								<View style={srStyles.circleTodayCompleted}>
									<Ionicons name="checkmark" size={16} color="#58CC02" />
								</View>
							)}
							{day.status === "future" && (
								<View style={srStyles.circleFuture} />
							)}
						</View>
					))}
				</View>

				{/* Footer Buttons */}
				<View style={[srStyles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
					<TouchableOpacity style={srStyles.shareBtn}>
						<Text style={srStyles.shareBtnText}>SHARE +20 GEMS</Text>
					</TouchableOpacity>
					<TouchableOpacity style={srStyles.continueBtnAlt} onPress={handleContinue}>
						<Text style={srStyles.continueBtnTextAlt}>CONTINUE</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const srStyles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	greenBanner: {
		backgroundColor: "#58CC02",
		borderBottomLeftRadius: 40,
		borderBottomRightRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		paddingTop: 40,
		paddingBottom: 40,
		flex: 0.55,
	},
	bigNumber: {
		fontSize: 120,
		fontWeight: "900",
		color: "#FFFFFF",
		fontFamily: "DIN Round Pro",
		lineHeight: 120,
		marginTop: 8,
	},
	label: {
		fontSize: 26,
		fontWeight: "800",
		color: "#FFFFFF",
		fontFamily: "DIN Round Pro",
		marginTop: -10,
	},
	whiteBottomArea: {
		flex: 0.45,
		backgroundColor: "#FFFFFF",
		justifyContent: "space-between",
		paddingTop: 30,
	},
	weekDaysRow: {
		flexDirection: "row",
		justifyContent: "space-evenly",
		paddingHorizontal: 20,
	},
	dayColumn: {
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 6,
		borderRadius: 12,
		minWidth: 44,
	},
	dayColumnActive: {
		backgroundColor: "rgba(88, 204, 2, 0.08)",
	},
	dayLabelText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#58CC02",
		fontFamily: "DIN Round Pro",
		marginBottom: 8,
	},
	circleCompleted: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#58CC02",
		alignItems: "center",
		justifyContent: "center",
	},
	circleTodayCompleted: {
		width: 28,
		height: 28,
		borderRadius: 14,
		borderWidth: 2,
		borderColor: "#58CC02",
		backgroundColor: "transparent",
		alignItems: "center",
		justifyContent: "center",
	},
	circleFuture: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "#E5E5E5",
	},
	footer: {
		paddingHorizontal: 24,
		gap: 12,
	},
	shareBtn: {
		backgroundColor: "#58CC02",
		borderRadius: 13,
		borderBottomWidth: 4,
		borderBottomColor: "#46A310",
		paddingVertical: 16,
		alignItems: "center",
	},
	shareBtnText: {
		color: "#FFFFFF",
		fontSize: 15,
		fontWeight: "800",
		letterSpacing: 1,
		fontFamily: "DIN Round Pro",
	},
	continueBtnAlt: {
		backgroundColor: "transparent",
		paddingVertical: 16,
		alignItems: "center",
	},
	continueBtnTextAlt: {
		color: "#3C3C3C",
		fontSize: 16,
		fontWeight: "800",
		letterSpacing: 1,
		fontFamily: "DIN Round Pro",
	},
});

// ─── Quest Complete Screen ───────────────────────────────────────────
const wizardImage = require("../../../assets/images/simplification.png");

function QuestCompleteScreen({ config }: { config: StepConfig }) {
	const { goToNextStep } = usePreOnboardingStore();

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		goToNextStep();
	};

	return (
		<View style={qcStyles.container}>
			<View style={qcStyles.content}>
				<Animated.View entering={ZoomIn.duration(600).delay(100)} style={qcStyles.mascotWrap}>
					<Image source={wizardImage} style={qcStyles.mascot} resizeMode="contain" />
				</Animated.View>

				<Animated.View entering={FadeIn.duration(400).delay(400)} style={qcStyles.textBlock}>
					<Text style={qcStyles.title}>{config.title}</Text>

					<View style={qcStyles.badge}>
						<Text style={qcStyles.badgeText}>Flawless!</Text>
					</View>

					<Text style={qcStyles.xpText}>+286 XP</Text>
					<Text style={qcStyles.subtitle}>Quest Complete!</Text>
				</Animated.View>
			</View>

			<View style={qcStyles.footer}>
				<TouchableOpacity style={qcStyles.continueBtn} onPress={handleContinue}>
					<Text style={qcStyles.continueBtnText}>{config.buttonText ?? "CONTINUE"}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const qcStyles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	mascotWrap: {
		width: 180,
		height: 180,
		marginBottom: 24,
	},
	mascot: {
		width: "100%",
		height: "100%",
	},
	textBlock: {
		alignItems: "center",
		gap: 10,
	},
	title: {
		fontSize: 40,
		fontWeight: "900",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
		textAlign: "center",
	},
	badge: {
		backgroundColor: "#FF9500",
		borderRadius: 20,
		paddingHorizontal: 20,
		paddingVertical: 6,
	},
	badgeText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "800",
		fontFamily: "DIN Round Pro",
	},
	xpText: {
		fontSize: 32,
		fontWeight: "900",
		color: "#58CC02",
		fontFamily: "DIN Round Pro",
		marginTop: 4,
	},
	subtitle: {
		fontSize: 20,
		fontWeight: "700",
		color: "#6B7280",
		fontFamily: "DIN Round Pro",
	},
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	continueBtn: {
		backgroundColor: "#58CC02",
		borderRadius: 13,
		borderBottomWidth: 4,
		borderBottomColor: "#46A310",
		paddingVertical: 16,
		alignItems: "center",
	},
	continueBtnText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "800",
		letterSpacing: 1,
		fontFamily: "DIN Round Pro",
	},
});

// ─── Quest Summary Screen ────────────────────────────────────────────
function QuestSummaryScreen({ config }: { config: StepConfig }) {
	const { goToNextStep } = usePreOnboardingStore();

	const stats = [
		{ label: "Accuracy", value: "100%", icon: "checkmark-circle" as const, color: "#58CC02" },
		{ label: "XP Earned", value: "+286", icon: "star" as const, color: "#FFB800" },
		{ label: "Time", value: "1:24", icon: "time" as const, color: "#4151FF" },
		{ label: "Streak", value: "5 🔥", icon: "flame" as const, color: "#FF6B00" },
	];

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		goToNextStep();
	};

	return (
		<View style={qsStyles.container}>
			<View style={qsStyles.content}>
				<Animated.View entering={FadeIn.duration(400)} style={qsStyles.header}>
					<Text style={qsStyles.title}>{config.title}</Text>
					<View style={qsStyles.badge}>
						<Text style={qsStyles.badgeText}>Flawless!</Text>
					</View>
				</Animated.View>

				<Animated.View entering={FadeIn.duration(500).delay(200)} style={qsStyles.statsGrid}>
					{stats.map((stat, i) => (
						<View key={i} style={qsStyles.statCard}>
							<Ionicons name={stat.icon} size={28} color={stat.color} />
							<Text style={qsStyles.statValue}>{stat.value}</Text>
							<Text style={qsStyles.statLabel}>{stat.label}</Text>
						</View>
					))}
				</Animated.View>

				<Animated.View entering={FadeIn.duration(400).delay(400)} style={qsStyles.messageCard}>
					<Ionicons name="trophy" size={24} color="#FFB800" />
					<Text style={qsStyles.messageText}>
						Perfect score! You've mastered this quest without a single mistake.
					</Text>
				</Animated.View>
			</View>

			<View style={qsStyles.footer}>
				<TouchableOpacity style={qsStyles.continueBtn} onPress={handleContinue}>
					<Text style={qsStyles.continueBtnText}>{config.buttonText ?? "CONTINUE"}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const qsStyles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F7F7F7" },
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 40,
		gap: 20,
	},
	header: {
		alignItems: "center",
		gap: 10,
	},
	title: {
		fontSize: 34,
		fontWeight: "900",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
		textAlign: "center",
	},
	badge: {
		backgroundColor: "#FF9500",
		borderRadius: 20,
		paddingHorizontal: 20,
		paddingVertical: 6,
	},
	badgeText: {
		color: "#FFFFFF",
		fontSize: 15,
		fontWeight: "800",
		fontFamily: "DIN Round Pro",
	},
	statsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	statCard: {
		width: "47%",
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		borderWidth: 2,
		borderBottomWidth: 4,
		borderColor: "#E5E5E5",
		paddingVertical: 20,
		alignItems: "center",
		gap: 6,
	},
	statValue: {
		fontSize: 24,
		fontWeight: "900",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	statLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#9CA3AF",
		fontFamily: "DIN Round Pro",
	},
	messageCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		borderWidth: 2,
		borderColor: "#E5E5E5",
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	messageText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "600",
		color: "#3C3C3C",
		lineHeight: 20,
		fontFamily: "DIN Round Pro",
	},
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	continueBtn: {
		backgroundColor: "#58CC02",
		borderRadius: 13,
		borderBottomWidth: 4,
		borderBottomColor: "#46A310",
		paddingVertical: 16,
		alignItems: "center",
	},
	continueBtnText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "800",
		letterSpacing: 1,
		fontFamily: "DIN Round Pro",
	},
});

// ─── Challenge Intro Screen ──────────────────────────────────────────
function ChallengeIntroScreen({ config }: { config: StepConfig }) {
	const { goToNextStep } = usePreOnboardingStore();

	const features = [
		{ icon: "bulb" as const, color: "#FFB800", text: "Real AI prompt challenges" },
		{ icon: "star" as const, color: "#58CC02", text: "Earn XP & unlock badges" },
		{ icon: "trophy" as const, color: "#4151FF", text: "Climb the global leaderboard" },
		{ icon: "flame" as const, color: "#FF6B00", text: "Maintain your daily streak" },
	];

	const handleContinue = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		goToNextStep();
	};

	return (
		<View style={ciStyles.container}>
			<View style={ciStyles.content}>
				<Animated.View entering={ZoomIn.duration(500)} style={ciStyles.logoRow}>
					<View style={ciStyles.logoDot} />
					<Text style={ciStyles.logoPrompt}>Prompt</Text>
					<Text style={ciStyles.logoPal}>Pal</Text>
				</Animated.View>

				<Animated.View entering={FadeIn.duration(400).delay(200)}>
					<Text style={ciStyles.title}>{config.title}</Text>
					<Text style={ciStyles.subtitle}>
						Test your prompt engineering skills across{"\n"}
						image, code & copywriting challenges.
					</Text>
				</Animated.View>

				<Animated.View entering={FadeIn.duration(500).delay(400)} style={ciStyles.featureList}>
					{features.map((f, i) => (
						<View key={i} style={ciStyles.featureRow}>
							<View style={[ciStyles.featureIcon, { backgroundColor: `${f.color}18` }]}>
								<Ionicons name={f.icon} size={22} color={f.color} />
							</View>
							<Text style={ciStyles.featureText}>{f.text}</Text>
						</View>
					))}
				</Animated.View>
			</View>

			<View style={ciStyles.footer}>
				<TouchableOpacity style={ciStyles.continueBtn} onPress={handleContinue}>
					<Text style={ciStyles.continueBtnText}>{config.buttonText ?? "LET'S GO"}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const ciStyles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FFFFFF" },
	content: {
		flex: 1,
		paddingHorizontal: 24,
		paddingTop: 60,
		gap: 28,
	},
	logoRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
	},
	logoDot: {
		width: 12,
		height: 12,
		borderRadius: 6,
		backgroundColor: "#58CC02",
		marginRight: 4,
	},
	logoPrompt: {
		fontSize: 28,
		fontWeight: "900",
		color: "#FF6B00",
		fontFamily: "DIN Round Pro",
	},
	logoPal: {
		fontSize: 28,
		fontWeight: "900",
		color: "#4151FF",
		fontFamily: "DIN Round Pro",
	},
	title: {
		fontSize: 34,
		fontWeight: "900",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
		lineHeight: 40,
	},
	subtitle: {
		fontSize: 16,
		color: "#6B7280",
		fontFamily: "DIN Round Pro",
		lineHeight: 24,
		marginTop: 8,
	},
	featureList: {
		gap: 14,
	},
	featureRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		backgroundColor: "#F7F7F7",
		borderRadius: 13,
		padding: 16,
	},
	featureIcon: {
		width: 44,
		height: 44,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	featureText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	continueBtn: {
		backgroundColor: "#58CC02",
		borderRadius: 13,
		borderBottomWidth: 4,
		borderBottomColor: "#46A310",
		paddingVertical: 16,
		alignItems: "center",
	},
	continueBtnText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "800",
		letterSpacing: 1,
		fontFamily: "DIN Round Pro",
	},
});

// ─── Learning Journey Screen ─────────────────────────────────────────
function LearningJourneyScreen({ config }: { config: StepConfig }) {
	const { completePreOnboarding } = usePreOnboardingStore();

	const modules = [
		{
			title: "Master the Identity",
			subtitle: "Learn how to define subject & persona",
			color: "#4151FF",
			icon: "person" as const,
			xp: 150,
		},
		{
			title: "Style & Tone",
			subtitle: "Set the voice of your prompts",
			color: "#FF6B00",
			icon: "color-palette" as const,
			xp: 200,
		},
		{
			title: "Context & Guardrails",
			subtitle: "Add constraints that protect quality",
			color: "#58CC02",
			icon: "shield-checkmark" as const,
			xp: 250,
		},
	];

	const handleStart = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
		usePreOnboardingStore.getState().finishPreOnboarding();
	};

	return (
		<View style={ljStyles.container}>
			<View style={ljStyles.content}>
				<Animated.View entering={FadeIn.duration(400)} style={ljStyles.header}>
					<Text style={ljStyles.eyebrow}>YOUR PATH</Text>
					<Text style={ljStyles.title}>{config.title}</Text>
					<Text style={ljStyles.subtitle}>
						Here's what you'll master on your{"\n"}journey to becoming a prompt pro.
					</Text>
				</Animated.View>

				<Animated.View entering={FadeIn.duration(500).delay(300)} style={ljStyles.moduleList}>
					{modules.map((mod, i) => (
						<View key={i} style={ljStyles.moduleCard}>
							<View style={[ljStyles.moduleIcon, { backgroundColor: `${mod.color}18` }]}>
								<Ionicons name={mod.icon} size={26} color={mod.color} />
							</View>
							<View style={ljStyles.moduleText}>
								<Text style={ljStyles.moduleTitle}>{mod.title}</Text>
								<Text style={ljStyles.moduleSubtitle}>{mod.subtitle}</Text>
							</View>
							<View style={ljStyles.moduleXpBadge}>
								<Text style={ljStyles.moduleXp}>+{mod.xp} XP</Text>
							</View>
						</View>
					))}
				</Animated.View>
			</View>

			<View style={ljStyles.footer}>
				<TouchableOpacity style={ljStyles.startBtn} onPress={handleStart}>
					<Text style={ljStyles.startBtnText}>{config.buttonText ?? "START LEARNING"}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const ljStyles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#F7F7F7" },
	content: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 50,
		gap: 28,
	},
	header: { gap: 8 },
	eyebrow: {
		fontSize: 12,
		fontWeight: "800",
		color: "#9CA3AF",
		letterSpacing: 2,
		fontFamily: "DIN Round Pro",
	},
	title: {
		fontSize: 34,
		fontWeight: "900",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
		lineHeight: 40,
	},
	subtitle: {
		fontSize: 15,
		color: "#6B7280",
		fontFamily: "DIN Round Pro",
		lineHeight: 22,
	},
	moduleList: {
		gap: 12,
	},
	moduleCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		borderWidth: 2,
		borderBottomWidth: 4,
		borderColor: "#E5E5E5",
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	moduleIcon: {
		width: 52,
		height: 52,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	moduleText: { flex: 1 },
	moduleTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	moduleSubtitle: {
		fontSize: 13,
		fontWeight: "500",
		color: "#9CA3AF",
		fontFamily: "DIN Round Pro",
		marginTop: 2,
	},
	moduleXpBadge: {
		backgroundColor: "#EFFCE6",
		borderRadius: 10,
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	moduleXp: {
		fontSize: 13,
		fontWeight: "800",
		color: "#58CC02",
		fontFamily: "DIN Round Pro",
	},
	footer: {
		paddingHorizontal: 20,
		paddingBottom: 40,
	},
	startBtn: {
		backgroundColor: "#58CC02",
		borderRadius: 13,
		borderBottomWidth: 4,
		borderBottomColor: "#46A310",
		paddingVertical: 16,
		alignItems: "center",
	},
	startBtnText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "800",
		letterSpacing: 1,
		fontFamily: "DIN Round Pro",
	},
});

// ─── Main Screen Renderer ────────────────────────────────────────────
export function PreOnboardingScreen() {
	const { currentStepIndex } = usePreOnboardingStore();
	const config = PRE_ONBOARDING_STEPS[currentStepIndex];

	if (!config) return null;

	const renderScreen = () => {
		switch (config.type) {
			case "options":
				return <OptionsScreen config={config} />;
			case "notification":
				return <NotificationScreen config={config} />;
			case "achievement":
				return <AchievementScreen config={config} />;
			case "subscription":
				return <SubscriptionScreen config={config} />;
			case "streak":
				return <StreakScreen config={config} />;
			case "success-reaction":
				return <SuccessReactionScreen config={config} />;
			case "quest-complete":
				return <QuestCompleteScreen config={config} />;
			case "quest-summary":
				return <QuestSummaryScreen config={config} />;
			case "challenge-intro":
				return <ChallengeIntroScreen config={config} />;
			case "learning-journey":
				return <LearningJourneyScreen config={config} />;
			default:
				return <OptionsScreen config={config} />;
		}
	};

	const isFullScreen =
		config.type === "streak" ||
		config.type === "success-reaction" ||
		config.type === "quest-complete";

	return (
		<SafeAreaView 
			style={styles.container} 
			edges={isFullScreen ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}
		>
			<Animated.View
				entering={FadeIn.duration(300)}
				exiting={FadeOut.duration(200)}
				style={styles.animatedContainer}
				key={config.id}
			>
				{renderScreen()}
			</Animated.View>
		</SafeAreaView>
	);
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F7F7F7",
	},
	animatedContainer: {
		flex: 1,
	},
	innerContainer: {
		flex: 1,
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
		lineHeight: 32,
		fontFamily: "DIN Round Pro",
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
		minHeight: 66,
		paddingVertical: 12,
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
		fontFamily: "DIN Round Pro",
	},
	optionLabelSelected: {
		color: "#5CD615",
	},
	rightLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: "#9CA3AF",
		fontFamily: "DIN Round Pro",
	},
	rightLabelSelected: {
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
		fontFamily: "DIN Round Pro",
	},
	continueButtonTextDisabled: {
		color: "#A0A0A0",
	},
	// Notification screen
	notificationArea: {
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	notificationCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 20,
		padding: 32,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#E5E5E5",
		width: "100%",
	},
	notificationTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#3C3C3C",
		marginTop: 16,
		textAlign: "center",
		fontFamily: "DIN Round Pro",
	},
	notificationSubtitle: {
		fontSize: 14,
		color: "#9CA3AF",
		marginTop: 8,
		textAlign: "center",
		lineHeight: 20,
		fontFamily: "DIN Round Pro",
	},
	// Achievement screen
	achievementRow: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 13,
		borderWidth: 2,
		borderBottomWidth: 4,
		borderColor: "#E5E5E5",
		minHeight: 66,
		paddingVertical: 12,
		paddingHorizontal: 20,
		marginBottom: 10,
	},
	achievementIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: "#F0FFF0",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	achievementLabel: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	// iOS Alert Modal Styles
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalBox: {
		width: 270,
		backgroundColor: "white",
		borderRadius: 14,
		overflow: "hidden",
	},
	modalContent: {
		padding: 20,
		alignItems: "center",
	},
	modalTitle: {
		fontSize: 17,
		fontWeight: "bold",
		textAlign: "center",
		color: "#000",
		marginBottom: 4,
		lineHeight: 22,
		fontFamily: "DIN Round Pro",
	},
	modalBody: {
		fontSize: 13,
		textAlign: "center",
		color: "#3C3C3C",
		lineHeight: 18,
		fontFamily: "DIN Round Pro",
	},
	modalHorizontalDivider: {
		height: 0.5,
		backgroundColor: "#DBDBDB",
	},
	modalButtonContainer: {
		flexDirection: "row",
		height: 44,
	},
	modalButton: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	modalButtonText: {
		fontSize: 17,
		color: "#007AFF", // Standard iOS Blue
		fontFamily: "DIN Round Pro",
	},
	modalButtonPrimary: {
		fontWeight: "bold",
	},
	modalVerticalDivider: {
		width: 0.5,
		backgroundColor: "#DBDBDB",
	},
	// Subscription Screen Styles
	subscriptionTitleSection: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	subscriptionTitleText: {
		fontSize: 28,
		fontWeight: "800",
		color: "#3C3C3C",
		flexShrink: 1,
		lineHeight: 34,
		fontFamily: "DIN Round Pro",
	},
	plansContainer: {
		paddingHorizontal: 20,
		flex: 1,
	},
	planCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		borderWidth: 1.5,
		borderColor: "#E5E5E5",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	planLabel: {
		fontSize: 20,
		fontWeight: "700",
		color: "#3C3C3C",
		marginBottom: 8,
		fontFamily: "DIN Round Pro",
	},
	priceRow: {
		flexDirection: "row",
		alignItems: "baseline",
		marginBottom: 16,
	},
	priceValue: {
		fontSize: 42,
		fontWeight: "800",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	priceUnit: {
		fontSize: 16,
		fontWeight: "600",
		color: "#6B7280",
		fontFamily: "DIN Round Pro",
	},
	featuresList: {
		marginBottom: 20,
	},
	featureRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	featureText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#4B5563",
		marginLeft: 10,
		fontFamily: "DIN Round Pro",
	},
	planButton: {
		borderWidth: 2,
		borderColor: "#E5E5E5",
		borderRadius: 12,
		paddingVertical: 12,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
		// Subtle shadow for button
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 1,
	},
	planButtonText: {
		color: "#5CD615",
		fontSize: 15,
		fontWeight: "800",
		letterSpacing: 0.5,
		fontFamily: "DIN Round Pro",
	},
	// ── Streak Screen Styles ─────────────────────────────────────────────
	streakContainerAlternative: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	streakTopBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	streakScreenTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	streakTabsContainer: {
		flexDirection: "row",
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: "#E5E5E5",
	},
	streakTab: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 16,
	},
	streakTabActive: {
		borderBottomWidth: 3,
		borderBottomColor: "#58CC02",
	},
	streakTabText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#9CA3AF",
		fontFamily: "DIN Round Pro",
		letterSpacing: 0.5,
	},
	streakTabTextActive: {
		color: "#58CC02",
	},
	streakScrollContent: {
		paddingBottom: 40,
	},
	streakGreenBanner: {
		backgroundColor: "#58CC02",
		borderBottomLeftRadius: 36,
		borderBottomRightRadius: 36,
		paddingHorizontal: 30,
		paddingTop: 10,
		paddingBottom: 40,
	},
	streakGreenBannerContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	streakGiantNumber: {
		fontSize: 72,
		fontWeight: "900",
		color: "#FFFFFF",
		fontFamily: "DIN Round Pro",
		lineHeight: 80,
	},
	streakGiantSub: {
		fontSize: 24,
		fontWeight: "800",
		color: "#FFFFFF",
		fontFamily: "DIN Round Pro",
	},
	overlapInfoCardContainer: {
		marginTop: -30,
		paddingHorizontal: 20,
		zIndex: 10,
	},
	overlapInfoCard: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 20,
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#E5E5E5",
	},
	overlapInfoCardText: {
		flex: 1,
		fontSize: 15,
		fontWeight: "700",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
		lineHeight: 22,
	},
	monthHeaderRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 24,
		marginTop: 32,
		marginBottom: 16,
	},
	monthHeaderText: {
		fontSize: 24,
		fontWeight: "800",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	monthArrows: {
		flexDirection: "row",
		gap: 16,
	},
	monthArrowBtn: {
		padding: 4,
	},
	statsCardsRow: {
		flexDirection: "row",
		paddingHorizontal: 20,
		marginBottom: 20,
		gap: 12,
	},
	statCardLeft: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderWidth: 2,
		borderColor: "#E5E5E5",
		borderRadius: 16,
		padding: 16,
		position: "relative",
	},
	perfectBadge: {
		position: "absolute",
		top: -12,
		alignSelf: "center",
		backgroundColor: "#58CC02",
		paddingHorizontal: 16,
		paddingVertical: 5,
		borderRadius: 8,
	},
	perfectBadgeText: {
		color: "#FFFFFF",
		fontSize: 11,
		fontWeight: "900",
		fontFamily: "DIN Round Pro",
		letterSpacing: 1,
	},
	statCardRight: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		borderWidth: 2,
		borderColor: "#E5E5E5",
		borderRadius: 16,
		padding: 16,
	},
	statCardValueRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 6,
	},
	statCardValueText: {
		fontSize: 28,
		fontWeight: "800",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	statCardLabelText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#9CA3AF",
		fontFamily: "DIN Round Pro",
	},
	calContainer: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		borderWidth: 2,
		borderColor: "#E5E5E5",
		marginHorizontal: 20,
		padding: 16,
		paddingBottom: 20,
	},
	calDayLabelsRow: {
		flexDirection: "row",
		marginBottom: 12,
	},
	calDayLabel: {
		flex: 1,
		textAlign: "center",
		fontSize: 14,
		fontWeight: "800",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	calGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
	},
	calCell: {
		width: `${100 / 7}%` as any,
		aspectRatio: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 2,
	},
	calDay: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},
	calDayCompleted: {
		backgroundColor: "#58CC02",
	},
	calDayToday: {
		backgroundColor: "#EFFCE6",
	},
	calDayText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#3C3C3C",
		fontFamily: "DIN Round Pro",
	},
	calDayTextCompleted: {
		color: "#FFFFFF",
		fontWeight: "800",
	},
	calDayTextToday: {
		color: "#58CC02",
		fontWeight: "800",
	},
	streakFooterAlternative: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "transparent",
		paddingHorizontal: 20,
		paddingTop: 12,
		zIndex: 100,
	},
	continueButtonGreen: {
		backgroundColor: "#58CC02",
		borderRadius: 13,
		borderBottomWidth: 4,
		borderBottomColor: "#46A310",
		paddingVertical: 16,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	continueButtonGreenText: {
		color: "#FFFFFF",
		fontSize: 16,
		fontWeight: "800",
		letterSpacing: 1,
		fontFamily: "DIN Round Pro",
	},
});
