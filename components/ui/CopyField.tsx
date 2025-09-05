"use client";
import { useState } from "react";
import IconButton from "./IconButton";
import { Copy, Check } from "lucide-react";
export default function CopyField({ value }: { value: string }) {
  const [ok, setOk] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(value); setOk(true); setTimeout(()=>setOk(false), 1200);} catch {}
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="truncate text-sm text-[var(--muted)]">{value}</span>
      <IconButton onClick={copy} title="Copy">{ok ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</IconButton>
    </div>
  );
}
