export type PipelineStatus = "em_teste" | "pre_escala" | "escalando" | "pausado";
export type Platform = "meta" | "tiktok" | "google" | "kwai" | "taboola" | "outro";

export type Creative = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_type: "video" | "image";
  thumbnail_path: string | null;
  platform: Platform;
  status: PipelineStatus;
  ad_account_id: string | null;
  external_ad_id: string | null;
  product_name: string | null;
  folder_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
};

export const STATUS_LABEL: Record<PipelineStatus, string> = {
  em_teste: "Em Teste",
  pre_escala: "Pré-Escala",
  escalando: "Escalando",
  pausado: "Pausado"
};

export const STATUS_COLOR: Record<PipelineStatus, string> = {
  em_teste: "violet",
  pre_escala: "teal",
  escalando: "gold",
  pausado: "coral"
};
