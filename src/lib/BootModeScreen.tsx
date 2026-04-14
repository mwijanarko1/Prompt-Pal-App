import { StyleSheet, Text, View } from "react-native";

interface BootModeScreenProps {
	mode: string;
	title: string;
	body: string;
	details?: string[];
}

export function BootModeScreen({
	mode,
	title,
	body,
	details = [],
}: BootModeScreenProps) {
	return (
		<View style={styles.root}>
			<View pointerEvents="none" style={styles.orangeGlow} />
			<View pointerEvents="none" style={styles.blueGlow} />

			<View style={styles.brandRow}>
				<Text style={styles.brandPrompt}>Prompt</Text>
				<Text style={styles.brandPal}>Pal</Text>
			</View>

			<View style={styles.card}>
				<View style={styles.modePill}>
					<Text style={styles.modeLabel}>{mode}</Text>
				</View>

				<Text style={styles.title}>{title}</Text>
				<Text style={styles.body}>{body}</Text>

				<View style={styles.detailList}>
					{details.map((detail) => (
						<View key={detail} style={styles.detailRow}>
							<View style={styles.detailDot} />
							<Text style={styles.detailText}>{detail}</Text>
						</View>
					))}
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#070C18",
		justifyContent: "center",
		padding: 24,
		overflow: "hidden",
	},
	orangeGlow: {
		position: "absolute",
		top: -120,
		left: -120,
		width: 280,
		height: 280,
		borderRadius: 140,
		backgroundColor: "#FF6B00",
		opacity: 0.12,
	},
	blueGlow: {
		position: "absolute",
		bottom: -140,
		right: -120,
		width: 300,
		height: 300,
		borderRadius: 150,
		backgroundColor: "#4151FF",
		opacity: 0.1,
	},
	brandRow: {
		flexDirection: "row",
		justifyContent: "center",
		marginBottom: 20,
	},
	brandPrompt: {
		color: "#FF6B00",
		fontSize: 36,
		fontWeight: "900",
		letterSpacing: -1,
	},
	brandPal: {
		color: "#4151FF",
		fontSize: 36,
		fontWeight: "900",
		letterSpacing: -1,
	},
	card: {
		backgroundColor: "#101826",
		borderWidth: 1,
		borderColor: "#1F2A3B",
		borderRadius: 28,
		padding: 24,
		shadowColor: "#000000",
		shadowOpacity: 0.25,
		shadowRadius: 16,
		shadowOffset: { width: 0, height: 8 },
		elevation: 8,
	},
	modePill: {
		alignSelf: "flex-start",
		backgroundColor: "rgba(255, 107, 0, 0.16)",
		borderWidth: 1,
		borderColor: "rgba(255, 107, 0, 0.35)",
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginBottom: 14,
	},
	modeLabel: {
		color: "#FFB98A",
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.2,
		textTransform: "uppercase",
	},
	title: {
		color: "#F3F6FB",
		fontSize: 26,
		fontWeight: "800",
		letterSpacing: -0.6,
		marginBottom: 10,
	},
	body: {
		color: "#AAB6C7",
		fontSize: 15,
		lineHeight: 22,
		marginBottom: 14,
	},
	detailList: {
		gap: 8,
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	detailDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: "#FF6B00",
		marginRight: 10,
	},
	detailText: {
		flex: 1,
		color: "#D3DBE7",
		fontSize: 13,
		lineHeight: 18,
	},
});
