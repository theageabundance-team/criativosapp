"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { downloadCreative } from "@/lib/download";
import type { Creative, PipelineStatus, Platform } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";
import { ArrowLeft, Download } from "lucide-react";

type EngagementMetric = {
  id: string;
  period_from: string;
  period_to: string;
  impressions: number | null;
  hook_rate: number | null;
  hold_rate: number | null;
  avg_watch_time_seconds: number | null;
  ctr: number | null;
};

export default function CreativeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [creative, setCreative] = useState<Creative | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EngagementMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.from("creatives").select("*").eq("id", id).single();
    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setCreative(data as Creative);

    const { data: signed } = await supabase.storage
      .from("creatives")
      .createSignedUrl(data.file_path, 3600);
    setPreviewUrl(signed?.signedUrl ?? null);

    const { data: metricRows } = await supabase
      .from("creative_engagement_metrics")
      .select("*")
      .eq("creative_id", id)
      .order("period_from", { ascending: false });
    setMetrics((metricRows as EngagementMetric[]) ?? []);

    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateField<K extends keyof Creative>(field: K, value: Creative[K]) {
    if (!creative) return;
    setSaving(true);
    setCreative({ ...creative, [field]: value });
    const supabase = createClient();
    await supabase.from("creatives").update({ [field]: value }).eq("id", creative.id);
    setSaving(false);
  }

  async function handleDownload() {
    if (!creative) return;
    const supabase = createClient();
    try {
      await downloadCreative(supabase, creative.file_path, creative.name);
    } catch {
      // silencioso
    }
  }

  if (loading) return <div className="p-8 text-ink-muted text-sm">Carregando...</div>;
  if (notFound || !creative)
    return (
      <div className="p-8 flex flex-col gap-4">
        <p className="text-ink-muted text-sm">Criativo não encontrado.</p>
        <Link href="/biblioteca" className="text-signal-gold text-sm w-fit">
          Voltar pra biblioteca
        </Link>
      </div>
    );

  return (
    <div className="p-8 flex flex-col gap-6 max-w-5xl">
      <button
        onClick={() => router.push("/biblioteca")}
        className="flex items-center gap-1.5 text-ink-muted hover:text-ink text-sm w-fit"
      >
        <ArrowLeft size={16} /> Biblioteca
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl overflow-hidden bg-base-raised border border-base-border aspect-[4/5] flex items-center justify-center">
          {previewUrl ? (
            creative.file_type === "video" ? (
              <video src={previewUrl} controls className="w-full h-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt={creative.name} className="w-full h-full object-contain" />
            )
          ) : (
            <p className="text-ink-muted text-sm">Prévia indisponível</p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-display text-xl font-bold">{creative.name}</h1>
            <p className="text-ink-muted text-xs mt-1">
              Enviado em {new Date(creative.created_at).toLocaleDateString("pt-BR")}
              {saving && " · salvando..."}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 bg-signal-gold text-base font-medium rounded-lg py-2 text-sm w-fit px-4"
          >
            <Download size={16} /> Baixar arquivo
          </button>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              Status
              <select
                className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm text-ink"
                value={creative.status}
                onChange={(e) => updateField("status", e.target.value as PipelineStatus)}
              >
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-muted">
              Plataforma
              <select
                className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm text-ink"
                value={creative.platform}
                onChange={(e) => updateField("platform", e.target.value as Platform)}
              >
                <option value="meta">Meta Ads</option>
                <option value="tiktok">TikTok Ads</option>
                <option value="google">Google Ads</option>
                <option value="kwai">Kwai</option>
                <option value="taboola">Taboola</option>
                <option value="outro">Outro</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-muted col-span-2">
              Produto (deve bater com a Utmify)
              <input
                className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm text-ink"
                value={creative.product_name ?? ""}
                onChange={(e) => setCreative({ ...creative, product_name: e.target.value })}
                onBlur={(e) => updateField("product_name", e.target.value || null)}
              />
            </label>

            <label className="flex flex-col gap-1 text-xs text-ink-muted col-span-2">
              ID da conta de anúncio
              <input
                className="bg-base-raised border border-base-border rounded-lg px-3 py-2 text-sm text-ink"
                value={creative.ad_account_id ?? ""}
                onChange={(e) => setCreative({ ...creative, ad_account_id: e.target.value })}
                onBlur={(e) => updateField("ad_account_id", e.target.value || null)}
              />
            </label>
          </div>

          <div className="border-t border-base-border pt-4">
            <h2 className="text-sm font-medium mb-2">Métricas de engajamento</h2>
            {metrics.length === 0 ? (
              <p className="text-ink-muted text-xs">
                Sem dados ainda. Hook rate e retenção chegam em breve.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {metrics.map((m) => (
                  <div
                    key={m.id}
                    className="grid grid-cols-4 gap-2 text-xs bg-base-raised rounded-lg p-3"
                  >
                    <span>Hook: {m.hook_rate ?? "-"}%</span>
                    <span>Retenção: {m.hold_rate ?? "-"}%</span>
                    <span>CTR: {m.ctr ?? "-"}%</span>
                    <span>Impr.: {m.impressions ?? "-"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
