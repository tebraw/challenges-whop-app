// components/ui/Button.tsx
"use client";
import clsx from "clsx";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
  radius?: "md" | "lg" | "xl";
};

export default function Button({
  className,
  variant = "primary",
  radius = "lg",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const radiusCls =
    radius === "xl" ? "rounded-xl" : radius === "md" ? "rounded-md" : "rounded-lg";

  const look =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand/90 border border-brand"
      : variant === "ghost"
      ? "text-foreground hover:bg-panel border-0"
      : "border border-border bg-panel text-foreground hover:bg-border/20";

  return <button
    className={clsx(base, radiusCls, look, className)}
    {...props}
  />;
}
