// app/layout.tsx
import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import AppHeader from "../components/ui/AppHeader"; // <- RELATIV, sicher
import { ThemeProvider } from "../lib/ThemeContext";
import { WhopApp } from "@whop/react/components";

export const metadata: Metadata = {
  title: "Challenges",
  description: "Admin & Challenges",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <WhopApp>
          <ThemeProvider>
            <AppHeader />
            <div className="pt-16">{children}</div>
          </ThemeProvider>
        </WhopApp>
      </body>
    </html>
  );
}
