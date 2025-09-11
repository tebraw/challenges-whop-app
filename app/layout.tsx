// app/layout.tsx
import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import AppHeader from "../components/ui/AppHeader"; // <- RELATIV, sicher
import { ThemeProvider } from "../lib/ThemeContext";
import { WhopApp } from "@whop/react/components";
import { WhopExperienceProvider } from "@/components/providers/WhopExperienceProvider";
import { WhopChallengeWebSocketProvider } from "@/components/providers/WhopChallengeWebSocketProvider";
import WhopErrorHandler from "@/components/WhopErrorHandler";

export const metadata: Metadata = {
  title: "Challenges",
  description: "Admin & Challenges",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="antialiased">
        <WhopApp>
          <WhopExperienceProvider>
            <WhopChallengeWebSocketProvider>
              <ThemeProvider>
                <WhopErrorHandler />
                <AppHeader />
                <div className="pt-16">{children}</div>
              </ThemeProvider>
            </WhopChallengeWebSocketProvider>
          </WhopExperienceProvider>
        </WhopApp>
      </body>
    </html>
  );
}
