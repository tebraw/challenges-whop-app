"use client";
import clsx from "clsx";
export default function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const base =
    "w-full h-10 px-3 py-2 text-sm rounded-lg " +
    "bg-[var(--input-bg)] text-[var(--fg)] placeholder-[var(--input-placeholder)] " +
    "border border-[var(--input-border)] " +
    "focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)] " +
    "transition";
  return <input className={clsx(base, className)} {...props} />;
}
