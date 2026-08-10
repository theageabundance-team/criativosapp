"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Creative, PipelineStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import KanbanCard from "./KanbanCard";
import clsx from "clsx";

const HEADER_ACCENT: Record<PipelineStatus, string> = {
  em_teste: "border-t-signal-violet",
  pre_escala: "border-t-signal-teal",
  escalando: "border-t-signal-gold",
  pausado: "border-t-signal-coral"
};

export default function KanbanColumn({
  status,
  creatives
}: {
  status: PipelineStatus;
  creatives: Creative[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex-1 min-w-[260px] rounded-xl border border-base-border bg-base-surface border-t-2 flex flex-col",
        HEADER_ACCENT[status],
        isOver && "ring-1 ring-signal-gold/50"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-sm font-medium">{STATUS_LABEL[status]}</h3>
        <span className="text-xs text-ink-muted font-tabular">{creatives.length}</span>
      </div>
      <SortableContext items={creatives.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 px-3 pb-3 flex-1 min-h-[120px]">
          {creatives.map((c) => (
            <KanbanCard key={c.id} creative={c} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
