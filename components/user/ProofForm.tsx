"use client";
import { useRouter } from "next/navigation";
import React from "react";

type ProofType = "FILE" | "TEXT" | "LINK";

export default function ProofForm({
  challengeId,
  enrolled,
  challenge
}: { 
  challengeId: string; 
  enrolled: boolean;
  challenge?: { cadence: string; existingProofToday?: boolean; proofType?: string };
}) {
  const router = useRouter();
  const [tab, setTab] = React.useState<ProofType>("FILE");
  const [text, setText] = React.useState("");
  const [link, setLink] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  // Show proof type requirement info
  const getProofTypeInfo = () => {
    if (!challenge?.proofType) return null;
    
    let typeDescription = "";
    let icon = "";
    
    switch (challenge.proofType) {
      case "PHOTO":
        typeDescription = "Upload a file (photo,img-file)";
        icon = "📸";
        break;
      case "TEXT":
        typeDescription = "Submit a text description";
        icon = "📝";
        break;
      case "LINK":
        typeDescription = "Provide a link or URL";
        icon = "🔗";
        break;
      default:
        typeDescription = "Submit your proof";
        icon = "📋";
    }
    
    return (
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm">
        <div className="flex items-center gap-2 text-blue-200">
          <span className="text-lg">{icon}</span>
          <span className="font-medium">Required proof type:</span>
          <span>{typeDescription}</span>
        </div>
      </div>
    );
  };

  // Show warning message based on challenge type
  const getWarningMessage = () => {
    if (!challenge?.existingProofToday) return null;
    
    if (challenge.cadence === "DAILY") {
      return "⚠️ You have already uploaded a file today. A new upload will replace today's file.";
    }
    if (challenge.cadence === "END_OF_CHALLENGE") {
      return "⚠️ You have already uploaded a file. A new upload will replace the previous file. Only the last file counts.";
    }
    return null;
  };

  async function uploadFileToServer(f: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok || data?.ok === false || !data?.url) {
      throw new Error(data?.message || "Upload failed");
    }
    return data.url as string; // e.g. /uploads/xyz.png
  }

  async function submit() {
    if (!enrolled) return alert("Please join the challenge first.");
    
    // Validate content before submit
    if (tab === "FILE" && !file) {
      return alert("Please select a file.");
    }
    if (tab === "TEXT" && (!text || text.trim() === "")) {
      return alert("Please enter text.");
    }
    if (tab === "LINK" && (!link || link.trim() === "")) {
      return alert("Please enter a link.");
    }
    
    try {
      setBusy(true);
      let mediaUrl: string | null = null;
        if (tab === "FILE") {
          mediaUrl = await uploadFileToServer(file!);
          router.refresh();
      }
      const payload =
          tab === "TEXT"
            ? { text: text.trim() }
            : tab === "LINK"
            ? { linkUrl: link.trim() }
            : { imageUrl: mediaUrl };

      const res = await fetch(`/api/challenges/${challengeId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || data?.message || `HTTP ${res.status} Error`);
      }
      if (data?.ok === false) {
        throw new Error(data?.message || "Unknown error");
      }

      setText(""); 
      setLink(""); 
      setFile(null);

      // Show specific success message based on API response
      if (data?.wasReplaced) {
        alert(data?.message || "File successfully replaced ✅");
      } else {
        alert(data?.message || "Proof saved ✅");
      }

      window.location.reload();
    } catch (e: any) {
      alert(e?.message || "Could not save proof.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-3 space-y-3">
      {/* Proof type requirement info */}
      {getProofTypeInfo()}

      {/* Warning for existing uploads */}
      {getWarningMessage() && (
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2 text-xs text-yellow-200">
          {getWarningMessage()}
        </div>
      )}

      <div className="flex gap-1">
  {(["FILE","TEXT","LINK"] as ProofType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-lg px-3 py-1.5 text-sm border " +
              (tab === t
                ? "bg-[var(--brand)] text-black border-transparent"
                : "bg-white/5 border-[var(--border)] hover:bg-white/10")
            }
          >
            {t === "FILE" ? "File" : t === "TEXT" ? "Text" : "Link"}
          </button>
        ))}
      </div>

  {tab === "FILE" && (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">
            Select file to upload
          </label>
          <input
            type="file"
            accept="image/*,application/pdf,video/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[var(--brand)] file:text-black hover:file:opacity-90 file:cursor-pointer"
          />
          {file && <div className="text-xs text-[var(--muted)]">{file.name}</div>}
        </div>
      )}

      {tab === "TEXT" && (
        <textarea
          placeholder="Brief description…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] px-2 py-1 text-xs"
          rows={3}
        />
      )}

      {tab === "LINK" && (
        <input
          placeholder="https://…"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full h-8 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] px-2 text-xs"
        />
      )}

      <div className="pt-2">
        <button
          onClick={submit}
          disabled={
            busy || 
            (tab === "FILE" && !file) ||
            (tab === "TEXT" && (!text || text.trim() === "")) ||
            (tab === "LINK" && (!link || link.trim() === ""))
          }
          className="w-full rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/80 px-6 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            "Submit Proof"
          )}
        </button>
      </div>
    </div>
  );
}

