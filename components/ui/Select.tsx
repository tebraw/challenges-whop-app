"use client";
import { cn } from "@/lib/utils";

export default function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const base =
    "w-full h-10 px-3 pr-8 py-2 text-sm rounded-lg appearance-none " +
    "bg-input text-foreground " +
    "border border-input-border " +
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:border-ring " +
    "transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
    "bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 4 5\"><path fill=\"%23666\" d=\"M2 0L0 2h4L2 0zM2 5L0 3h4L2 5z\"/></svg>')] bg-no-repeat bg-right-3 bg-center";
  return (
    <select className={cn(base, className)} {...props}>
      {children}
    </select>
  );
}
