
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  
  // Smart logo navigation based on current context
  const getLogoLink = () => {
    // Dashboard context: /dashboard/[companyId]/*
    if (pathname?.startsWith('/dashboard/')) {
      const dashboardMatch = pathname.match(/^\/dashboard\/([^\/]+)/);
      if (dashboardMatch) {
        return `/dashboard/${dashboardMatch[1]}`;
      }
    }
    
    // Experience context: /experiences/[experienceId]/*
    if (pathname?.startsWith('/experiences/')) {
      const experienceMatch = pathname.match(/^\/experiences\/([^\/]+)/);
      if (experienceMatch) {
        return `/experiences/${experienceMatch[1]}`;
      }
    }
    
    // Default fallback
    return "/";
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={getLogoLink()} className="flex items-center gap-3">
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
