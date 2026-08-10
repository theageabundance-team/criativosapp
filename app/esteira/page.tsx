"use client";

import { useCallback, useEffect, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import KanbanColumn from "@/components/KanbanColumn";
import type { Creative, PipelineStatus } from "@/lib/types";

const COLUMNS: PipelineStatus[] = ["em_teste", "pre_escala", "escalando", "pausado"];

export default function EsteiraPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("creatives")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error && data) setCreatives(data as Creative[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const newStatus = over.id as PipelineStatus;
    const creativeId = active.id as string;
    const creative = creatives.find((c) => c.id === creativeId);
    if (!creative || creative.status === newStatus) return;

    // update otimista
    setCreatives((prev) =>
      prev.map((c) => (c.id === creativeId ? { ...c, status: newStatus } : c))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("creatives")
      .update({ status: newStatus })
      .eq("id", creativeId);

    if (error) {
      // reverte se der erro
      load();
    }
  }

  return (
    <div className="p-8 flex flex-col gap-6 h-screen">
      <header>
        <h1 className="font-display text-2xl font-bold">Esteira</h1>
        <p className="text-ink-muted text-sm mt-1">Arraste os criativos entre as fases</p>
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              creatives={creatives.filter((c) => c.status === status)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
