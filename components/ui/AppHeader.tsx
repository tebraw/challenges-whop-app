
"use client";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/neu.png?v=20250925-1"
            alt="growth"
            className="h-8 sm:h-12 md:h-16"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              // prevent infinite loop if fallback also fails
              target.onerror = null;
              target.src = "/logo-wordmark.png?v=20250925-1";
            }}
          />
        </Link>
      </div>
    </header>
  );
}
