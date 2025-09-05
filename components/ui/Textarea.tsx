"use client";
import { cn } from "@/lib/utils";

export default function Textarea({
  className,
  rows = 4,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const base =
    "w-full px-3 py-2 text-sm rounded-lg " +
    "bg-input text-foreground placeholder:text-input-placeholder " +
    "border border-input-border " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-ring " +
    "transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed";
  return <textarea rows={rows} className={cn(base, className)} {...props} />;
}
