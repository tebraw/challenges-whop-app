
"use client";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import AdminOnly from "../AdminOnly";

export default function AppHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0B0F12]/80 backdrop-blur data-[theme=light]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="challenges" className="h-8 sm:h-12 md:h-16" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className="text-sm font-medium hover:text-[var(--brand)] transition-colors"
          >
            Home
          </Link>
          <Link 
            href="/dashboard" 
            className="text-sm font-medium hover:text-[var(--brand)] transition-colors"
          >
            Dashboard
          </Link>
          <Link 
            href="/feed" 
            className="text-sm font-medium hover:text-[var(--brand)] transition-colors"
          >
            My Feed
          </Link>
          <Link 
            href="/discover" 
            className="text-sm font-medium hover:text-[var(--brand)] transition-colors"
          >
            Discover
          </Link>
          <Link 
            href="/challenges" 
            className="text-sm font-medium hover:text-[var(--brand)] transition-colors"
          >
            All Challenges
          </Link>
          <AdminOnly>
            <Link 
              href="/admin" 
              className="text-sm font-medium hover:text-[var(--brand)] transition-colors"
            >
              Admin
            </Link>
          </AdminOnly>
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-white hover:text-[var(--brand)] transition-colors"
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
        <div className="md:hidden bg-[#0B0F12]/95 backdrop-blur border-b border-white/10">
          <nav className="px-4 py-4 space-y-3">
            <Link 
              href="/" 
              className="block py-2 text-base font-medium hover:text-[var(--brand)] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏠 Home
            </Link>
            <Link 
              href="/dashboard" 
              className="block py-2 text-base font-medium hover:text-[var(--brand)] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📊 Dashboard
            </Link>
            <Link 
              href="/feed" 
              className="block py-2 text-base font-medium hover:text-[var(--brand)] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              📱 My Feed
            </Link>
            <Link 
              href="/discover" 
              className="block py-2 text-base font-medium hover:text-[var(--brand)] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🔍 Discover
            </Link>
            <Link 
              href="/challenges" 
              className="block py-2 text-base font-medium hover:text-[var(--brand)] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              🏆 All Challenges
            </Link>
            <AdminOnly>
              <Link 
                href="/admin" 
                className="block py-2 text-base font-medium hover:text-[var(--brand)] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ⚙️ Admin
              </Link>
            </AdminOnly>
          </nav>
        </div>
      )}
    </header>
  );
}
