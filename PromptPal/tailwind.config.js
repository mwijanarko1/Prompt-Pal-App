/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class', // Use class-based dark mode for web compatibility
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: "hsl(var(--background))",
        surface: "hsl(var(--surface))",
        surfaceVariant: "hsl(var(--surface-variant))",
        surfaceElevated: "hsl(var(--surface-elevated))",

        // Primary colors (Orange theme - from "Prompt")
        primary: "hsl(var(--primary))",
        primaryVariant: "#E66000",
        onPrimary: "hsl(var(--on-primary))",

        // Secondary colors (Blue theme - from "Pal")
        secondary: "hsl(var(--secondary))",
        secondaryVariant: "#3644E6",
        onSecondary: "hsl(var(--on-secondary))",

        // Semantic colors
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",

        // Text colors
        onBackground: "hsl(var(--on-background))",
        onSurface: "hsl(var(--on-surface))",
        onSurfaceVariant: "hsl(var(--on-surface-variant))",
        textSecondary: "hsl(var(--on-surface-variant))",
        textMuted: "hsl(var(--on-surface-variant) / 0.6)",

        // Border and outline
        outline: "hsl(var(--outline))",
        border: "hsl(var(--outline))",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(255, 107, 0, 0.3)',
        'glow-secondary': '0 0 20px rgba(65, 81, 255, 0.3)',
      },
    },
  },
  plugins: [],
}
