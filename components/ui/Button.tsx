// components/ui/Button.tsx
"use client";
import clsx from "clsx";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  radius?: "md" | "lg" | "xl"; // <- optional steuerbar
};

export default function Button({
  className,
  variant = "outline",
  radius = "lg",                     // <- Standard: kleinere Ecken
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center gap-2 px-4 py-2 text-black dark:text-white transition-colors focus:outline-none focus:ring-2";

  const radiusCls =
    radius === "xl" ? "rounded-xl" : radius === "md" ? "rounded-md" : "rounded-lg";

  const look =
    variant === "primary"
      ? "bg-brand hover:bg-brand/90"
      : variant === "ghost"
      ? "bg-neutral-200 hover:bg-neutral-300 border border-neutral-400 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10"
      : "border border-neutral-400 dark:border-white/10 bg-neutral-200 hover:bg-neutral-300 dark:bg-white/5 dark:hover:bg-white/10";

  return <button
    className={clsx(base, radiusCls, look, className)}
    {...props}
  />;
}
