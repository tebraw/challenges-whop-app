import { cn } from "@/lib/utils";
export default function Badge({
  children, variant="default", className,
}: { children: React.ReactNode; variant?: "default"|"success"|"warning"|"muted"; className?: string; }) {
  const styles = {
    default: "bg-white/10 text-white",
    success: "bg-emerald-500/15 text-emerald-300",
    warning: "bg-amber-500/15 text-amber-300",
    muted: "bg-white/5 text-[var(--muted)]",
  }[variant];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", styles, className)}>{children}</span>;
}
