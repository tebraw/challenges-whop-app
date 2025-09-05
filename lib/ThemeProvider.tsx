"use client";
import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Theme beim ersten Laden initialisieren
    const savedTheme = (localStorage.getItem("theme") as "light" | "dark") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return <>{children}</>;
}
