// app/layout.tsx
import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import AppHeader from "../components/ui/AppHeader"; // <- RELATIV, sicher
import { ThemeProvider } from "../lib/ThemeContext";
import { WhopApp } from "@whop/react/components";
import { WhopIframeSdkProvider } from "@whop/react/iframe";
import { WhopWebsocketProvider } from "@whop/react/websockets";
import ClientWrapper from "../components/ClientWrapper";

export const metadata: Metadata = {
  title: "Challenges",
  description: "Admin & Challenges",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/logo-mark.png",
    apple: "/logo-mark.png",
  },
  other: {
    "resource-hints-policy": "conservative",
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
              if (typeof window !== 'undefined') {
                const originalError = console.error;
                const originalWarn = console.warn;
                
                console.error = function(...args) {
                  const message = args.join(' ');
                  // Filter out external service blocking errors
                  if (
                    message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                    message.includes('sentry.io') ||
                    message.includes('cloudflareinsights.com') ||
                    message.includes('FFF-AcidGrotesk-Bold.woff2') ||
                    message.includes('Unrecognized feature:') ||
                    message.includes('permissions policy violation') ||
                    message.includes('Failed to execute \\'postMessage\\' on \\'DOMWindow\\'') ||
                    message.includes('target origin provided') ||
                    message.includes('does not match the recipient window\\'s origin')
                  ) {
                    return; // Silently ignore these errors
                  }
                  originalError.apply(console, args);
                };

                console.warn = function(...args) {
                  const message = args.join(' ');
                  // Filter out resource preload warnings
                  if (
                    message.includes('was preloaded using link preload but not used') ||
                    message.includes('Please make sure it has an appropriate') ||
                    message.includes('preloaded intentionally')
                  ) {
                    return; // Silently ignore these warnings
                  }
                  originalWarn.apply(console, args);
                };
              }
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <WhopApp>
          <WhopIframeSdkProvider>
            <WhopWebsocketProvider>
              <ClientWrapper>
                <ThemeProvider>
                  <AppHeader />
                  <div className="pt-16">{children}</div>
                </ThemeProvider>
              </ClientWrapper>
            </WhopWebsocketProvider>
          </WhopIframeSdkProvider>
        </WhopApp>
      </body>
    </html>
  );
}
