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
  manifest: "/site.webmanifest",
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress external service console errors in production
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
                const originalError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  // Filter out external service blocking errors
                  if (
                    message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('sentry.io') ||
                    message.includes('cloudflareinsights.com') ||
                    message.includes('FFF-AcidGrotesk-Bold.woff2') ||
                    message.includes('Unrecognized feature:') ||
                    message.includes('permissions policy violation')
                  ) {
                    return; // Silently ignore these errors
                  }
                  originalError.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
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
