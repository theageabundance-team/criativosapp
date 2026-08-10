"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import MetricCard from "@/components/MetricCard";
import { formatCents, formatPercent, UtmifySummary } from "@/lib/utmify";

const PLATFORM_COLORS: Record<string, string> = {
  meta: "#8B7CF6",
  google: "#33C7B0",
  tiktok: "#FF5D5D",
  kwai: "#FFB020",
  taboola: "#5B6479"
};

export default function DashboardPage() {
  const [data, setData] = useState<UtmifySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const from = new Date();
    from.setDate(from.getDate() - 30);

    fetch("/api/utmify/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from: from.toISOString(), to: new Date().toISOString() })
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Erro ao buscar dados");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const byPlatform = data
    ? Object.entries(data.ads.byPlatform)
        .filter(([, v]) => v > 0)
        .map(([platform, spend]) => ({ platform, spend: spend / 100 }))
    : [];

  return (
    <div className="p-8 flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-ink-muted text-sm mt-1">Últimos 30 dias · dados da Utmify</p>
        </div>
      </header>

      {loading && <p className="text-ink-muted text-sm">Carregando métricas...</p>}

      {error && (
        <div className="rounded-lg border border-signal-coral/40 bg-signal-coral/10 text-signal-coral text-sm p-4">
          Não foi possível carregar os dados da Utmify: {error}
          <br />
          <span className="text-ink-muted">
            Confira se UTMIFY_API_KEY e UTMIFY_DASHBOARD_ID estão configurados e se sua conta tem
            acesso à API Oficial (plano Monster/Scale/Enterprise + beta).
          </span>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Investido" value={formatCents(data.ads.spend, data.currency)} accent="violet" />
            <MetricCard label="Receita bruta" value={formatCents(data.revenue.gross, data.currency)} accent="teal" />
            <MetricCard label="Lucro" value={formatCents(data.result.profit, data.currency)} accent="gold" />
            <MetricCard
              label="ROAS"
              value={data.result.roas != null ? `${data.result.roas.toFixed(2)}x` : "—"}
              accent="gold"
            />
            <MetricCard label="ROI" value={formatPercent(data.result.roi)} accent="teal" />
            <MetricCard
              label="Ticket médio"
              value={formatCents(data.result.avgTicket, data.currency)}
              accent="violet"
            />
            <MetricCard label="CPA" value={formatCents(data.result.cpa, data.currency)} accent="coral" />
            <MetricCard label="Pedidos aprovados" value={String(data.orders.approved)} accent="teal" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-base-border bg-base-surface p-4">
              <h2 className="text-sm font-medium mb-4">Gasto por plataforma</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byPlatform}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252B39" />
                  <XAxis dataKey="platform" stroke="#8B93A7" fontSize={12} />
                  <YAxis stroke="#8B93A7" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "#1A1F2B", border: "1px solid #252B39", borderRadius: 8 }}
                    formatter={(v: number) => [`R$ ${v.toFixed(2)}`, "Gasto"]}
                  />
                  <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                    {byPlatform.map((entry) => (
                      <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] ?? "#8B93A7"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-base-border bg-base-surface p-4">
              <h2 className="text-sm font-medium mb-4">Pedidos por status</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Aprovados", value: data.orders.approved, color: "#33C7B0" },
                      { name: "Pendentes", value: data.orders.pending, color: "#FFB020" },
                      { name: "Reembolsados", value: data.orders.refunded, color: "#8B93A7" },
                      { name: "Chargeback", value: data.orders.chargedback, color: "#FF5D5D" }
                    ].filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                  >
                    {[
                      { color: "#33C7B0" },
                      { color: "#FFB020" },
                      { color: "#8B93A7" },
                      { color: "#FF5D5D" }
                    ].map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#8B93A7" }} />
                  <Tooltip contentStyle={{ background: "#1A1F2B", border: "1px solid #252B39", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
