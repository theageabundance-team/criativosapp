"use client";

import { useState } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";
import { X, UploadCloud } from "lucide-react";
import type { Platform } from "@/lib/types";

export default function UploadModal({
  onClose,
  onUploaded
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [productName, setProductName] = useState("");
  const [platform, setPlatform] = useState<Platform>("meta");
  const [adAccountId, setAdAccountId] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!file) return setError("Escolha um arquivo");
    setBusy(true);
    setProgress(0);
    setError(null);

    const supabase = createClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const userId = session?.user.id;
    if (!userId || !session) {
      setError("Você precisa estar logado");
      setBusy(false);
      return;
    }

    const fileType = file.type.startsWith("video") ? "video" : "image";
    const path = `${userId}/${Date.now()}-${file.name}`;

    try {
      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
            "x-upsert": "false"
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          metadata: {
            bucketName: "creatives",
            objectName: path,
            contentType: file.type,
            cacheControl: "3600"
          },
          chunkSize: 6 * 1024 * 1024,
          onError: reject,
          onProgress: (bytesUploaded, bytesTotal) => {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess: () => resolve()
        });

        upload.findPreviousUploads().then((previousUploads) => {
          if (previousUploads.length) {
            upload.resumeFromPreviousUpload(previousUploads[0]);
          }
          upload.start();
        });
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no upload");
      setBusy(false);
      return;
    }

    const { error: insertError } = await supabase.from("creatives").insert({
      owner_id: userId,
      name: name || file.name,
      file_path: path,
      file_type: fileType,
      platform,
      product_name: productName || null,
      ad_account_id: adAccountId || null,
      status: "em_teste"
    });

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }

    onUploaded();
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
            {file ? file.name : "Clique para escolher um vídeo ou imagem"}
          </span>
          <input
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <input
          className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm"
          placeholder="Nome do criativo"
          value={name}
          onChange={(e) => setName(e.target.value)}
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

        {busy && (
          <div className="w-full h-2 rounded-full bg-base-raised overflow-hidden">
            <div
              className="h-full bg-signal-gold transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={busy}
          className="bg-signal-gold text-base font-medium rounded-lg py-2 text-sm disabled:opacity-50"
        >
          {busy ? `Enviando... ${progress}%` : "Adicionar à biblioteca"}
        </button>
      </div>
    </div>
  );
}
