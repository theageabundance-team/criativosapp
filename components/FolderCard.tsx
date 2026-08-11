"use client";

import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Folder as FolderIcon, LayoutGrid, FolderX } from "lucide-react";

export default function FolderCard({
  id,
  label,
  count,
  active,
  droppable = true,
  variant = "folder",
  onClick
}: {
  id: string;
  label: string;
  count: number;
  active: boolean;
  droppable?: boolean;
  variant?: "folder" | "all" | "none";
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !droppable });

  const Icon = variant === "all" ? LayoutGrid : variant === "none" ? FolderX : FolderIcon;

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={clsx(
        "flex flex-col items-start gap-3 rounded-xl border p-4 w-40 text-left transition-colors",
        active
          ? "border-signal-gold bg-signal-gold/10"
          : "border-base-border bg-base-surface hover:border-ink-muted/40",
        isOver && "border-signal-gold ring-2 ring-signal-gold/40 bg-signal-gold/10"
      )}
    >
      <Icon size={20} className={active ? "text-signal-gold" : "text-ink-muted"} />
      <div>
        <p className="text-sm font-medium truncate w-32">{label}</p>
        <p className="text-xs text-ink-muted">
          {count} criativo{count === 1 ? "" : "s"}
        </p>
      </div>
    </button>
  );
}
