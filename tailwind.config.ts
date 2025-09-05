import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        brand: "var(--brand)",
        panel: "var(--panel)",
        muted: "var(--muted)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "24px"
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.08)",
        'card-dark': "0 8px 24px rgba(0,0,0,0.3)"
      }
    },
  },
  plugins: [],
} satisfies Config;
