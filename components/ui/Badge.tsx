import { cn } from "@/lib/utils";

export default function Badge({
  children, 
  variant = "default", 
  className,
}: { 
  children: React.ReactNode; 
  variant?: "default" | "success" | "warning" | "muted" | "primary"; 
  className?: string; 
}) {
  const styles = {
    default: "bg-panel border border-border text-foreground",
    primary: "bg-brand/10 border border-brand/20 text-brand",
    success: "bg-emerald-50 border border-emerald-200 text-emerald-700",
    warning: "bg-amber-50 border border-amber-200 text-amber-700",
    muted: "bg-muted/10 border border-muted/20 text-muted",
  }[variant];
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", 
      styles, 
      className
    )}>
      {children}
    </span>
  );
}
