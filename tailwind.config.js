/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
	darkMode: "class", // Use class-based dark mode for web compatibility
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				// Literal values so NativeWind resolves colors on React Native (CSS vars from global.css don't apply there).
				// Kept in sync with src/lib/theme.ts and src/app/global.css.
				background: "#FFFFFF",
				surface: "#F3F4F6",
				surfaceVariant: "#E5E7EB",
				surfaceElevated: "#FFFFFF",

				primary: "#FF6B00",
				primaryVariant: "#E66000",
				onPrimary: "#FFFFFF",

				secondary: "#4151FF",
				secondaryVariant: "#3644E6",
				onSecondary: "#FFFFFF",

				success: "#10B981",
				warning: "#F59E0B",
				error: "#EF4444",
				info: "#3B82F6",

				onBackground: "#111827",
				onSurface: "#111827",
				onSurfaceVariant: "#6B7280",
				textSecondary: "#6B7280",
				textMuted: "rgba(107, 114, 128, 0.6)",

				outline: "#9CA3AF",
				border: "#9CA3AF",
			},
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
				display: ["Inter", "system-ui", "sans-serif"],
			},
			borderRadius: {
				xl: "12px",
				"2xl": "16px",
				"3xl": "20px",
			},
			boxShadow: {
				sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
				md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
				lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
				xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
				glow: "0 0 20px rgba(255, 107, 0, 0.3)",
				"glow-secondary": "0 0 20px rgba(65, 81, 255, 0.3)",
			},
		},
	},
	plugins: [],
};
