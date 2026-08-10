import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function MetricCard({
  label,
  value,
  delta,
  accent = "gold"
}: {
  label: string;
  value: string;
  delta?: number | null;
  accent?: "gold" | "teal" | "coral" | "violet";
}) {
  const accentClass = {
    gold: "text-signal-gold",
    teal: "text-signal-teal",
    coral: "text-signal-coral",
    violet: "text-signal-violet"
  }[accent];

  return (
    <div className="rounded-xl border border-base-border bg-base-surface p-4 flex flex-col gap-2">
      <span className="text-xs text-ink-muted uppercase tracking-wide">{label}</span>
      <span className={clsx("font-display font-tabular text-2xl", accentClass)}>{value}</span>
      {delta != null && (
        <span
          className={clsx(
            "flex items-center gap-1 text-xs font-medium",
            delta >= 0 ? "text-signal-teal" : "text-signal-coral"
          )}
        >
          {delta >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(delta * 100).toFixed(1)}% vs período anterior
        </span>
      )}
    </div>
  );
}
