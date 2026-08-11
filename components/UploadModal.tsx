"use client";

import { useState } from "react";
import { useUploadQueue } from "@/lib/uploadQueue";
import { useFolders } from "@/lib/useFolders";
import FolderPicker from "@/components/FolderPicker";
import { X, UploadCloud } from "lucide-react";
import type { Platform } from "@/lib/types";

export default function UploadModal({
  onClose,
  onUploaded
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState<Platform>("meta");
  const [adAccountId, setAdAccountId] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { enqueue } = useUploadQueue();
  const { folders, createFolder } = useFolders();

  function handleSubmit() {
    if (files.length === 0) return setError("Escolha ao menos um arquivo");
    enqueue(files, { productName, platform, adAccountId, folderId }, onUploaded);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-base-surface border border-base-border rounded-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Novo criativo</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <label className="border border-dashed border-base-border rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-signal-gold/60 transition-colors">
          <UploadCloud size={22} className="text-ink-muted" />
          <span className="text-sm text-ink-muted text-center">
            {files.length > 0
              ? `${files.length} arquivo${files.length > 1 ? "s" : ""} selecionado${files.length > 1 ? "s" : ""}`
              : "Clique para escolher vídeos ou imagens (pode selecionar vários)"}
          </span>
          <input
            type="file"
            accept="video/*,image/*"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>

        <p className="text-[11px] text-ink-muted -mt-2">
          Os campos abaixo se aplicam a todos os arquivos selecionados. O nome de cada criativo é
          tirado do nome do arquivo.
        </p>

        <FolderPicker
          folders={folders}
          value={folderId}
          onChange={setFolderId}
          onCreateFolder={createFolder}
        />

        <input
          className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm"
          placeholder="Produto (deve bater com o nome na Utmify)"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
        <input
          className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm"
          placeholder="ID da conta de anúncio (ex: act_123456789)"
          value={adAccountId}
          onChange={(e) => setAdAccountId(e.target.value)}
        />
        <select
          className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
        >
          <option value="meta">Meta Ads</option>
          <option value="tiktok">TikTok Ads</option>
          <option value="google">Google Ads</option>
          <option value="kwai">Kwai</option>
          <option value="taboola">Taboola</option>
          <option value="outro">Outro</option>
        </select>

        {error && <p className="text-signal-coral text-xs">{error}</p>}

        <button
          onClick={handleSubmit}
          className="bg-signal-gold text-base font-medium rounded-lg py-2 text-sm"
        >
          Adicionar à biblioteca
        </button>
      </div>
    </div>
  );
}
