/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#121212",
        surface: "#1E1E1E",
        accent: "#BB86FC",
        primary: "#BB86FC",
        secondary: "#03DAC6",
        error: "#CF6679",
        onBackground: "#FFFFFF",
        onSurface: "#FFFFFF",
        onPrimary: "#000000",
        onSecondary: "#000000",
      },
    },
  },
  plugins: [],
}

