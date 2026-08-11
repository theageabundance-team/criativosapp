"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import * as tus from "tus-js-client";
import { createClient } from "@/lib/supabase/client";
import type { Platform } from "@/lib/types";

export type UploadItem = {
  id: string;
  fileName: string;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
};

export type UploadMeta = {
  productName: string;
  platform: Platform;
  adAccountId: string;
  folderId: string | null;
};

type UploadQueueContextValue = {
  uploads: UploadItem[];
  enqueue: (files: File[], meta: UploadMeta, onEach?: () => void) => void;
  dismiss: (id: string) => void;
};

const UploadQueueContext = createContext<UploadQueueContextValue | null>(null);

export function UploadQueueProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setUploads((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }, []);

  const dismiss = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const uploadOne = useCallback(
    async (id: string, file: File, meta: UploadMeta, onEach?: () => void) => {
      const supabase = createClient();
      const {
        data: { session }
      } = await supabase.auth.getSession();
      const userId = session?.user.id;
      if (!userId || !session) {
        updateItem(id, { status: "error", error: "Você precisa estar logada" });
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
              updateItem(id, { progress: Math.round((bytesUploaded / bytesTotal) * 100) });
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

        const { error: insertError } = await supabase.from("creatives").insert({
          owner_id: userId,
          name: file.name.replace(/\.[^/.]+$/, ""),
          file_path: path,
          file_type: fileType,
          platform: meta.platform,
          product_name: meta.productName || null,
          ad_account_id: meta.adAccountId || null,
          folder_id: meta.folderId,
          status: "em_teste"
        });

        if (insertError) throw insertError;

        updateItem(id, { status: "done", progress: 100 });
        onEach?.();
      } catch (err) {
        updateItem(id, {
          status: "error",
          error: err instanceof Error ? err.message : "Falha no upload"
        });
        return;
      }

      timers.current[id] = setTimeout(() => dismiss(id), 5000);
    },
    [updateItem, dismiss]
  );

  const enqueue = useCallback(
    (files: File[], meta: UploadMeta, onEach?: () => void) => {
      const items: UploadItem[] = files.map((file) => ({
        id: crypto.randomUUID(),
        fileName: file.name,
        progress: 0,
        status: "uploading"
      }));
      setUploads((prev) => [...items, ...prev]);
      items.forEach((item, i) => uploadOne(item.id, files[i], meta, onEach));
    },
    [uploadOne]
  );

  return (
    <UploadQueueContext.Provider value={{ uploads, enqueue, dismiss }}>
      {children}
    </UploadQueueContext.Provider>
  );
}

export function useUploadQueue() {
  const ctx = useContext(UploadQueueContext);
  if (!ctx) throw new Error("useUploadQueue must be used within UploadQueueProvider");
  return ctx;
}
