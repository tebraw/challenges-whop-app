"use client";
import { useRef, useState } from "react";

type Props = {
  value?: string;
  onChange: (url?: string) => void;
  maxMB?: number;
};

export default function ImagePicker({ value, onChange, maxMB = 5 }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > maxMB * 1024 * 1024) {
      alert(`Image is larger than ${maxMB} MB.`);
      e.target.value = "";
      return;
    }
    const fd = new FormData();
    fd.append("file", f);
    setBusy(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      const j = JSON.parse(txt) as { url: string };
      onChange(j.url);            // <- z.B. "/uploads/uuid.png"
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="preview"
               className="h-16 w-16 rounded-xl object-cover border border-white/10" />
          <button type="button"
                  onClick={() => onChange(undefined)}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
            Remove
          </button>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10 cursor-pointer">
          {busy ? "Uploading…" : "Choose image from PC"}
          <input ref={ref} type="file" accept="image/*" onChange={onPick} className="hidden" />
        </label>
      )}
    </div>
  );
}
