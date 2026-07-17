import type { Config } from "tailwindcss";

// Palette mirrors the Grafana-docs look. "-dark" shades pair with the
// class-based dark mode toggled on <html> by src/lib/theme.ts.
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./docs/**/*.mdx"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      colors: {
        accent: { DEFAULT: "#3871dc", dark: "#5b8def" },
        brandorange: "#ff8833",
        canvas: { DEFAULT: "#ffffff", dark: "#111217" },
        panel: { DEFAULT: "#f8f9fa", dark: "#16171d" },
        line: { DEFAULT: "#e6e9ec", dark: "#2c2f38" },
        ink: { DEFAULT: "#24292e", dark: "#d6d9dc" },
        soft: { DEFAULT: "#6b7280", dark: "#9aa0a6" },
        pill: "#e4e7ea",
      },
    },
  },
  plugins: [],
} satisfies Config;
