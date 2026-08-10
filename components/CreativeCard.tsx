import { Creative, STATUS_COLOR, STATUS_LABEL } from "@/lib/types";
import clsx from "clsx";
import { PlayCircle } from "lucide-react";

const ACCENT: Record<string, string> = {
  violet: "bg-signal-violet/15 text-signal-violet border-signal-violet/30",
  teal: "bg-signal-teal/15 text-signal-teal border-signal-teal/30",
  gold: "bg-signal-gold/15 text-signal-gold border-signal-gold/30",
  coral: "bg-signal-coral/15 text-signal-coral border-signal-coral/30"
};

export default function CreativeCard({
  creative,
  thumbnailUrl
}: {
  creative: Creative;
  thumbnailUrl?: string | null;
}) {
  return (
    <div className="rounded-xl border border-base-border bg-base-surface overflow-hidden group">
      <div className="relative aspect-[4/5] bg-base-raised flex items-center justify-center">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt={creative.name} className="w-full h-full object-cover" />
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
    </div>
  );
}
