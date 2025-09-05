"use client";
import { cn } from "@/lib/utils";
export default function IconButton({ children, onClick, title, className, disabled }:
{ children: React.ReactNode; onClick?: () => void; title?: string; className?: string; disabled?: boolean; }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-white/10 px-2.5 py-2 text-sm",
        "bg-white/5 hover:bg-white/10 active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >{children}</button>
  );
}
