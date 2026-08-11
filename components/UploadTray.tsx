"use client";

import { useUploadQueue } from "@/lib/uploadQueue";
import { CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";

export default function UploadTray() {
  const { uploads, dismiss } = useUploadQueue();

  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {uploads.map((u) => (
        <div
          key={u.id}
          className="bg-base-surface border border-base-border rounded-lg p-3 shadow-lg flex flex-col gap-2"
        >
          <div className="flex items-center gap-2">
            {u.status === "uploading" && (
              <Loader2 size={14} className="text-signal-gold animate-spin shrink-0" />
            )}
            {u.status === "done" && <CheckCircle2 size={14} className="text-signal-teal shrink-0" />}
            {u.status === "error" && <AlertCircle size={14} className="text-signal-coral shrink-0" />}
            <span className="text-xs truncate flex-1">{u.fileName}</span>
            <span className="text-[10px] text-ink-muted shrink-0">
              {u.status === "uploading" ? `${u.progress}%` : u.status === "done" ? "Concluído" : "Erro"}
            </span>
            <button onClick={() => dismiss(u.id)} className="text-ink-muted hover:text-ink shrink-0">
              <X size={12} />
            </button>
          </div>
          {u.status === "uploading" && (
            <div className="w-full h-1 rounded-full bg-base-raised overflow-hidden">
              <div
                className="h-full bg-signal-gold transition-all duration-150"
                style={{ width: `${u.progress}%` }}
              />
            </div>
          )}
          {u.status === "error" && u.error && (
            <p className="text-[10px] text-signal-coral">{u.error}</p>
          )}
        </div>
      ))}
    </div>
  );
}
