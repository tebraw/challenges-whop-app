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

    // Check if it's actually an image
    if (!f.type.startsWith('image/')) {
      alert('Please select an image file.');
      e.target.value = "";
      return;
    }

    const fd = new FormData();
    fd.append("file", f);
    setBusy(true);
    
    try {
      const res = await fetch("/api/upload", { 
        method: "POST", 
        body: fd 
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      const result = await res.json();
      
      if (result.url) {
        onChange(result.url);
      } else {
        throw new Error('No URL returned from upload');
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err?.message || 'Unknown error'}`);
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
          <img 
            src={value} 
            alt="Challenge preview"
            className="h-20 w-20 rounded-xl object-cover border border-white/10" 
            onError={(e) => {
              // Fallback if image fails to load
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=300&fit=crop';
            }}
          />
          <div className="flex flex-col gap-2">
            <button 
              type="button"
              onClick={() => onChange(undefined)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 text-sm">
              Remove Image
            </button>
            <p className="text-xs text-gray-500">Image uploaded successfully</p>
          </div>
        </div>
      ) : (
        <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {busy ? "Uploading image..." : "Choose Challenge Image"}
          <input 
            ref={ref} 
            type="file" 
            accept="image/*" 
            onChange={onPick} 
            className="hidden"
            disabled={busy}
          />
        </label>
      )}
      {busy && (
        <div className="flex items-center gap-2 text-sm text-blue-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          <span>Uploading your image...</span>
        </div>
      )}
    </div>
  );
}
