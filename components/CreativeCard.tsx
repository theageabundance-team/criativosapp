"use client";

import Link from "next/link";
import { Creative, STATUS_COLOR, STATUS_LABEL } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { downloadCreative } from "@/lib/download";
import clsx from "clsx";
import { PlayCircle, Download } from "lucide-react";

const ACCENT: Record<string, string> = {
  violet: "bg-signal-violet/15 text-signal-violet border-signal-violet/30",
  teal: "bg-signal-teal/15 text-signal-teal border-signal-teal/30",
  gold: "bg-signal-gold/15 text-signal-gold border-signal-gold/30",
  coral: "bg-signal-coral/15 text-signal-coral border-signal-coral/30"
};

export default function CreativeCard({
  creative,
  previewUrl
}: {
  creative: Creative;
  previewUrl?: string | null;
}) {
  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    try {
      await downloadCreative(supabase, creative.file_path, creative.name);
    } catch {
      // silencioso: usuário pode tentar de novo
    }
  }

  return (
    <Link
      href={`/biblioteca/${creative.id}`}
      className="rounded-xl border border-base-border bg-base-surface overflow-hidden group block"
    >
      <div className="relative aspect-[4/5] bg-base-raised flex items-center justify-center">
        {previewUrl ? (
          creative.file_type === "video" ? (
            <video
              src={`${previewUrl}#t=0.1`}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={creative.name} className="w-full h-full object-cover" />
          )
        ) : (
          <PlayCircle className="text-ink-faint" size={32} />
        )}
        <span
          className={clsx(
            "absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full border font-medium",
            ACCENT[STATUS_COLOR[creative.status]]
          )}
        >
          {STATUS_LABEL[creative.status]}
        </span>
        <button
          onClick={handleDownload}
          title="Baixar"
          className="absolute top-2 right-2 bg-base/80 hover:bg-base text-ink rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Download size={14} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate">{creative.name}</p>
        <p className="text-xs text-ink-muted truncate mt-0.5">
          {creative.product_name ?? "Sem produto"} · {creative.platform}
        </p>
        {creative.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {creative.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] text-ink-muted bg-base-raised px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
