import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform, useColorScheme } from "react-native";

const TAB_CONTENT_STYLE = { backgroundColor: "transparent" } as const;

function iosDynamicColor(light: string, dark: string) {
	if (Platform.OS !== "ios") {
		return undefined;
	}

	return DynamicColorIOS({ light, dark });
}

export function TabsShell() {
	const scheme = useColorScheme();
	const navigationTheme = scheme === "dark" ? DarkTheme : DefaultTheme;

	return (
		<ThemeProvider value={navigationTheme}>
			<NativeTabs
				backgroundColor="transparent"
				tintColor={iosDynamicColor("#111827", "#FFFFFF")}
				labelStyle={{
					default: {
						color: iosDynamicColor("#6B7280", "#94A3B8"),
						fontSize: 12,
					},
					selected: {
						color: iosDynamicColor("#111827", "#F9FAFB"),
						fontSize: 12,
						fontWeight: "600",
					},
				}}
			>
				<NativeTabs.Trigger name="index" contentStyle={TAB_CONTENT_STYLE}>
					<NativeTabs.Trigger.Label>Train</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "graduationcap", selected: "graduationcap.fill" }}
						md="school"
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger
					name="library"
					hidden
					contentStyle={TAB_CONTENT_STYLE}
				>
					<NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "book", selected: "book.fill" }}
						md="menu_book"
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger
					name="ranking"
					hidden
					contentStyle={TAB_CONTENT_STYLE}
				>
					<NativeTabs.Trigger.Label>Ranking</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "trophy", selected: "trophy.fill" }}
						md="emoji_events"
					/>
				</NativeTabs.Trigger>
				<NativeTabs.Trigger name="profile" contentStyle={TAB_CONTENT_STYLE}>
					<NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						sf={{ default: "person", selected: "person.fill" }}
						md="person"
					/>
				</NativeTabs.Trigger>
			</NativeTabs>
		</ThemeProvider>
	);
}
