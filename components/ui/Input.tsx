"use client";
import clsx from "clsx";

export default function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const base =
    "w-full h-10 px-3 py-2 text-sm rounded-lg " +
    "bg-input text-foreground placeholder:text-input-placeholder " +
    "border border-input-border " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-ring " +
    "transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  return <input className={clsx(base, className)} {...props} />;
}
