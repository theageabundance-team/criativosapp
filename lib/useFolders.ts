"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Folder } from "@/lib/types";

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("name", { ascending: true });
    if (!error && data) setFolders(data as Folder[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createFolder = useCallback(async (name: string): Promise<Folder | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("folders")
      .insert({ name: trimmed, owner_id: user.id })
      .select()
      .single();

    if (error || !data) return null;
    const folder = data as Folder;
    setFolders((prev) => [...prev, folder].sort((a, b) => a.name.localeCompare(b.name)));
    return folder;
  }, []);

  return { folders, loading, createFolder, reload: load };
}
