"use client";
import { useTheme } from "@/lib/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
      title={theme === "light" ? "Switch to dark" : "Switch to light"}
      aria-label="Theme toggle"
    >
      <span className="text-base">{theme === "light" ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
    </button>
  );
}
