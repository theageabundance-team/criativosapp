"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CreativeCard from "@/components/CreativeCard";
import UploadModal from "@/components/UploadModal";
import { useFolders } from "@/lib/useFolders";
import type { Creative } from "@/lib/types";
import { Plus, FolderPlus } from "lucide-react";
import clsx from "clsx";

const ALL = "__all__";
const NO_FOLDER = "__none__";

export default function BibliotecaPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeFolder, setActiveFolder] = useState<string>(ALL);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const { folders, createFolder } = useFolders();

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

  return (
    <div className="p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Biblioteca de criativos</h1>
          <p className="text-ink-muted text-sm mt-1">{visibleCreatives.length} criativos exibidos</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-signal-gold text-base font-medium rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} /> Novo criativo
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveFolder(ALL)}
          className={clsx(
            "text-xs px-3 py-1.5 rounded-full border",
            activeFolder === ALL
              ? "bg-signal-gold text-base border-signal-gold"
              : "border-base-border text-ink-muted hover:text-ink"
          )}
        >
          Todos
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFolder(f.id)}
            className={clsx(
              "text-xs px-3 py-1.5 rounded-full border",
              activeFolder === f.id
                ? "bg-signal-gold text-base border-signal-gold"
                : "border-base-border text-ink-muted hover:text-ink"
            )}
          >
            {f.name}
          </button>
        ))}
        <button
          onClick={() => setActiveFolder(NO_FOLDER)}
          className={clsx(
            "text-xs px-3 py-1.5 rounded-full border",
            activeFolder === NO_FOLDER
              ? "bg-signal-gold text-base border-signal-gold"
              : "border-base-border text-ink-muted hover:text-ink"
          )}
        >
          Sem pasta
        </button>

        {creatingFolder ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              className="bg-base-raised border border-base-border rounded-full px-3 py-1.5 text-xs"
              placeholder="Nome da pasta"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <button onClick={handleCreateFolder} className="text-signal-gold text-xs font-medium">
              Criar
            </button>
            <button
              onClick={() => setCreatingFolder(false)}
              className="text-ink-muted text-xs"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCreatingFolder(true)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border border-dashed border-base-border text-ink-muted hover:text-ink"
          >
            <FolderPlus size={12} /> Nova pasta
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
  );
}
