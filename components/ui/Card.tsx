import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "bg-panel border border-border rounded-lg shadow-sm p-6", 
        className
      )} 
      {...props} 
    />
  );
}
