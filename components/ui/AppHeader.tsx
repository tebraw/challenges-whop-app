
"use client";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/neu.png"
            alt="growth"
            className="h-8 sm:h-12 md:h-16"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              // prevent infinite loop if fallback also fails
              target.onerror = null;
              target.src = "/logo-growth.png";
            }}
          />
        </Link>
      </div>
    </header>
  );
}
