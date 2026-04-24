import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type TabIconName = React.ComponentProps<typeof Ionicons>["name"];

function renderTabIcon(
	focused: boolean,
	activeIcon: TabIconName,
	inactiveIcon: TabIconName,
) {
	return ({ color, size }: { color: string; size: number }) => (
		<Ionicons name={focused ? activeIcon : inactiveIcon} color={color} size={size} />
	);
}

export function TabsShell() {
	const scheme = useColorScheme();
	const navigationTheme = scheme === "dark" ? DarkTheme : DefaultTheme;
	const isDark = scheme === "dark";

	return (
		<ThemeProvider value={navigationTheme}>
			<Tabs
				screenOptions={{
					headerShown: false,
					animation: "none",
					tabBarActiveTintColor: isDark ? "#F9FAFB" : "#0F172A",
					tabBarInactiveTintColor: isDark ? "#94A3B8" : "#64748B",
					tabBarStyle: {
						height: 66,
						paddingTop: 8,
						paddingBottom: 10,
						borderTopWidth: 1,
						borderTopColor: isDark ? "#1E293B" : "#E2E8F0",
						backgroundColor: isDark ? "#020617" : "#FFFFFF",
					},
					tabBarLabelStyle: {
						fontSize: 12,
						fontWeight: "600",
					},
				}}
			>
				<Tabs.Screen
					name="index"
					options={{
						title: "Train",
						tabBarIcon: ({ focused, color, size }) =>
							renderTabIcon(focused, "school", "school-outline")({
								color,
								size,
							}),
					}}
				/>
				<Tabs.Screen
					name="library"
					options={{
						href: null,
						tabBarIcon: ({ focused, color, size }) =>
							renderTabIcon(focused, "book", "book-outline")({
								color,
								size,
							}),
					}}
				/>
				<Tabs.Screen
					name="ranking"
					options={{
						href: null,
						tabBarIcon: ({ focused, color, size }) =>
							renderTabIcon(focused, "trophy", "trophy-outline")({
								color,
								size,
							}),
					}}
				/>
				<Tabs.Screen
					name="profile"
					options={{
						title: "Profile",
						tabBarIcon: ({ focused, color, size }) =>
							renderTabIcon(focused, "person", "person-outline")({
								color,
								size,
							}),
					}}
				/>
			</Tabs>
		</ThemeProvider>
	);
}
