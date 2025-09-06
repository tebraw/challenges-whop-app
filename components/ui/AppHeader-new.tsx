"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import ThemeToggle from "./ThemeToggle";
import { getUserAccessLevel, type AccessControlResult } from "@/lib/access-control";

export default function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userAccess, setUserAccess] = useState<AccessControlResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserAccess() {
      try {
        const access = await getUserAccessLevel();
        setUserAccess(access);
      } catch (error) {
        console.error('Error loading user access:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUserAccess();
  }, []);

  if (loading) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-8 w-32 bg-panel animate-pulse rounded"></div>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="challenges" className="h-8 sm:h-12 md:h-16" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium text-foreground hover:text-brand transition-colors"
          >
            Home
          </Link>

          {/* Customer Navigation */}
          {userAccess?.canViewMyFeed && (
            <Link 
              href="/feed" 
              className="text-sm font-medium text-foreground hover:text-brand transition-colors"
            >
              My Feed
            </Link>
          )}

          {userAccess?.canViewDiscover && (
            <Link 
              href="/discover" 
              className="text-sm font-medium text-foreground hover:text-brand transition-colors"
            >
              Discover
            </Link>
          )}

          {/* Company Owner Navigation */}
          {userAccess?.canViewAdmin && (
            <>
              <Link 
                href="/admin" 
                className="text-sm font-medium text-foreground hover:text-brand transition-colors"
              >
                Admin
              </Link>
              <Link 
                href="/admin/new" 
                className="text-sm font-medium bg-brand text-brand-foreground px-3 py-1.5 rounded-lg hover:bg-brand/90 transition-colors"
              >
                Create Challenge
              </Link>
            </>
          )}

          {/* User Type Badge (for development) */}
          {process.env.NODE_ENV === 'development' && userAccess && (
            <span className="text-xs px-2 py-1 bg-muted/20 text-muted rounded">
              {userAccess.userType}
            </span>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-foreground hover:text-brand transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur border-b border-border">
          <nav className="px-4 py-4 space-y-3">
            <Link 
              href="/" 
              className="block text-sm font-medium text-foreground hover:text-brand transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>

            {userAccess?.canViewMyFeed && (
              <Link 
                href="/feed" 
                className="block text-sm font-medium text-foreground hover:text-brand transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Feed
              </Link>
            )}

            {userAccess?.canViewDiscover && (
              <Link 
                href="/discover" 
                className="block text-sm font-medium text-foreground hover:text-brand transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Discover
              </Link>
            )}

            {userAccess?.canViewAdmin && (
              <>
                <Link 
                  href="/admin" 
                  className="block text-sm font-medium text-foreground hover:text-brand transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
                <Link 
                  href="/admin/new" 
                  className="block text-sm font-medium bg-brand text-brand-foreground px-3 py-2 rounded-lg hover:bg-brand/90 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Challenge
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
