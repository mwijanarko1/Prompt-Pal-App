/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Background colors
        background: "#0F0F0F",
        surface: "#1A1A1A",
        surfaceVariant: "#2A2A2A",
        surfaceElevated: "#252525",

        // Primary colors (Purple theme)
        primary: "#8B5CF6",
        primaryVariant: "#7C3AED",
        onPrimary: "#FFFFFF",

        // Secondary colors (Teal theme)
        secondary: "#06B6D4",
        secondaryVariant: "#0891B2",
        onSecondary: "#FFFFFF",

        // Accent colors
        accent: "#F59E0B",
        accentVariant: "#D97706",

        // Semantic colors
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6",

        // Text colors
        onBackground: "#FFFFFF",
        onSurface: "#F5F5F5",
        onSurfaceVariant: "#B3B3B3",
        textSecondary: "#9CA3AF",
        textMuted: "#6B7280",

        // Border and outline
        outline: "#374151",
        outlineVariant: "#4B5563",
        border: "#374151",

        // Interactive states
        hover: "#2A2A2A",
        focus: "#3B82F6",
        pressed: "#1F1F1F",

        // Gradients (custom utility classes)
        gradient: {
          primary: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          secondary: "linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)",
          surface: "linear-gradient(135deg, #1A1A1A 0%, #252525 100%)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '16px' }],
        'sm': ['14px', { lineHeight: '20px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '1' }],
      },
      spacing: {
        '18': '72px',
        '88': '352px',
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
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-secondary': '0 0 20px rgba(6, 182, 212, 0.3)',
      },
    },
  },
  plugins: [],
}

