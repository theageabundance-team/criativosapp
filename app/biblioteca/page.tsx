"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import CreativeCard from "@/components/CreativeCard";
import FolderCard from "@/components/FolderCard";
import UploadModal from "@/components/UploadModal";
import { useFolders } from "@/lib/useFolders";
import type { Creative } from "@/lib/types";
import { Plus, FolderPlus } from "lucide-react";

const ALL = "__all__";
const NO_FOLDER = "folder-none";

export default function BibliotecaPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string>(ALL);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { folders, createFolder } = useFolders();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("creatives")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCreatives(data as Creative[]);

      const urlEntries = await Promise.all(
        data.map(async (c: Creative) => {
          const { data: signed } = await supabase.storage
            .from("creatives")
            .createSignedUrl(c.file_path, 3600);
          return [c.id, signed?.signedUrl ?? ""] as const;
        })
      );
      setThumbs(Object.fromEntries(urlEntries));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleCreatives = useMemo(() => {
    if (activeFolder === ALL) return creatives;
    if (activeFolder === NO_FOLDER) return creatives.filter((c) => !c.folder_id);
    return creatives.filter((c) => c.folder_id === activeFolder);
  }, [creatives, activeFolder]);

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    const folder = await createFolder(newFolderName);
    setNewFolderName("");
    setCreatingFolder(false);
    if (folder) setActiveFolder(folder.id);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    let newFolderId: string | null;
    if (overId === NO_FOLDER) newFolderId = null;
    else if (overId.startsWith("folder-")) newFolderId = overId.replace("folder-", "");
    else return;

    const creativeId = active.id as string;
    const creative = creatives.find((c) => c.id === creativeId);
    if (!creative || creative.folder_id === newFolderId) return;

    setCreatives((prev) =>
      prev.map((c) => (c.id === creativeId ? { ...c, folder_id: newFolderId } : c))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("creatives")
      .update({ folder_id: newFolderId })
      .eq("id", creativeId);

    if (error) load();
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="p-8 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Biblioteca de criativos</h1>
            <p className="text-ink-muted text-sm mt-1">
              {visibleCreatives.length} criativos exibidos · arraste um criativo pra uma pasta pra
              organizar
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-signal-gold text-base font-medium rounded-lg px-4 py-2 text-sm"
          >
            <Plus size={16} /> Novo criativo
          </button>
        </header>

        <div className="flex flex-wrap gap-3">
          <FolderCard
            id={ALL}
            label="Todos"
            count={creatives.length}
            active={activeFolder === ALL}
            droppable={false}
            variant="all"
            onClick={() => setActiveFolder(ALL)}
          />
          {folders.map((f) => (
            <FolderCard
              key={f.id}
              id={`folder-${f.id}`}
              label={f.name}
              count={creatives.filter((c) => c.folder_id === f.id).length}
              active={activeFolder === f.id}
              onClick={() => setActiveFolder(f.id)}
            />
          ))}
          <FolderCard
            id={NO_FOLDER}
            label="Sem pasta"
            count={creatives.filter((c) => !c.folder_id).length}
            active={activeFolder === NO_FOLDER}
            variant="none"
            onClick={() => setActiveFolder(NO_FOLDER)}
          />

          {creatingFolder ? (
            <div className="flex flex-col justify-center gap-2 rounded-xl border border-dashed border-base-border p-4 w-48">
              <input
                autoFocus
                className="bg-base-raised border border-base-border rounded-lg px-2 py-1.5 text-xs"
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <div className="flex gap-2">
                <button onClick={handleCreateFolder} className="text-signal-gold text-xs font-medium">
                  Criar
                </button>
                <button onClick={() => setCreatingFolder(false)} className="text-ink-muted text-xs">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreatingFolder(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-base-border p-4 w-40 text-ink-muted hover:text-ink hover:border-ink-muted/40 transition-colors"
            >
              <FolderPlus size={20} />
              <span className="text-xs">Nova pasta</span>
            </button>
          )}
        </div>

        {loading && <p className="text-ink-muted text-sm">Carregando...</p>}

        {!loading && visibleCreatives.length === 0 && (
          <div className="rounded-xl border border-dashed border-base-border p-12 text-center text-ink-muted text-sm">
            Nenhum criativo aqui ainda.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {visibleCreatives.map((c) => (
            <CreativeCard key={c.id} creative={c} previewUrl={thumbs[c.id]} />
          ))}
        </div>

        {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={load} />}
      </div>
    </DndContext>
  );
}
