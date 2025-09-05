
"use client";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b" style={{ borderColor: "var(--border)", background: "var(--panel)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <a href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-horizontal.png" alt="challenges" className="h-8 md:h-9" />
        </a>

        <nav className="flex items-center gap-2">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm hover:bg-[var(--panel)]"
            title="My challenges"
          >
            My challenges
          </Link>
          <Link
            href="/admin/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-medium text-[var(--text)] hover:opacity-90"
            title="New Challenge"
          >
            New
          </Link>

          <ThemeToggle /> {/* ← Umschalter */}
        </nav>
      </div>
    </header>
  );
}
