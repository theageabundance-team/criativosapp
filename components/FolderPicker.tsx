"use client";

import { useState } from "react";
import type { Folder } from "@/lib/types";

const NEW_FOLDER_VALUE = "__new__";

export default function FolderPicker({
  folders,
  value,
  onChange,
  onCreateFolder
}: {
  folders: Folder[];
  value: string | null;
  onChange: (folderId: string | null) => void;
  onCreateFolder: (name: string) => Promise<Folder | null>;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setBusy(true);
    const folder = await onCreateFolder(newName);
    setBusy(false);
    setCreating(false);
    setNewName("");
    if (folder) onChange(folder.id);
  }

  if (creating) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm flex-1"
          placeholder="Nome da pasta (ex: Oferta X - Francês)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={busy}
          className="bg-signal-gold text-base font-medium rounded-lg px-3 text-sm disabled:opacity-50"
        >
          Criar
        </button>
        <button
          type="button"
          onClick={() => setCreating(false)}
          className="text-ink-muted text-sm px-2"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <select
      className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm"
      value={value ?? ""}
      onChange={(e) => {
        if (e.target.value === NEW_FOLDER_VALUE) {
          setCreating(true);
          return;
        }
        onChange(e.target.value || null);
      }}
    >
      <option value="">Sem pasta</option>
      {folders.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
      <option value={NEW_FOLDER_VALUE}>+ Criar nova pasta</option>
    </select>
  );
}
