"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Creative } from "@/lib/types";
import { GripVertical } from "lucide-react";

export default function KanbanCard({ creative }: { creative: Creative }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: creative.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-base-raised border border-base-border rounded-lg p-3 cursor-grab active:cursor-grabbing flex items-start gap-2"
    >
      <GripVertical size={14} className="text-ink-faint mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{creative.name}</p>
        <p className="text-xs text-ink-muted truncate">
          {creative.product_name ?? "—"} · {creative.platform}
        </p>
      </div>
    </div>
  );
}
