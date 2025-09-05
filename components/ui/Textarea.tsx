"use client";
import { cn } from "@/lib/utils";
export default function Textarea({
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const base =
    "w-full px-3 py-2 text-sm rounded-lg " +
    "bg-[var(--input-bg)] text-[var(--fg)] placeholder-[var(--input-placeholder)] " +
    "border border-[var(--input-border)] " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] " +
    "transition";
  return <textarea rows={rows} className={cn(base, className)} {...props} />;
}
