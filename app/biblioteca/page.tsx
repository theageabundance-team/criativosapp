"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import CreativeCard from "@/components/CreativeCard";
import UploadModal from "@/components/UploadModal";
import type { Creative } from "@/lib/types";
import { Plus } from "lucide-react";

export default function BibliotecaPage() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Biblioteca de criativos</h1>
          <p className="text-ink-muted text-sm mt-1">{creatives.length} criativos armazenados</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-signal-gold text-base font-medium rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} /> Novo criativo
        </button>
      </header>

      {loading && <p className="text-ink-muted text-sm">Carregando...</p>}

      {!loading && creatives.length === 0 && (
        <div className="rounded-xl border border-dashed border-base-border p-12 text-center text-ink-muted text-sm">
          Nenhum criativo ainda. Envie o primeiro pra parar de depender do Google Drive.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {creatives.map((c) => (
          <CreativeCard key={c.id} creative={c} thumbnailUrl={c.file_type === "image" ? thumbs[c.id] : null} />
        ))}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={load} />}
    </div>
  );
}
