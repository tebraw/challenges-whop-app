"use client";
import { cn } from "@/lib/utils";
export default function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const base =
    "w-full h-10 px-3 pr-8 py-2 text-sm rounded-lg appearance-none " +
    "bg-[var(--input-bg)] text-[var(--fg)] " +
    "border border-[var(--input-border)] " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] " +
    "transition";
  return (
    <select className={cn(base, className)} {...props}>
      {children}
    </select>
  );
}
