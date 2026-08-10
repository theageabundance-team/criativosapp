// Cliente para a API Oficial de Consulta da Utmify.
// Doc: https://docs.utmify.com.br/consulta-de-dados
// Requer plano Monster/Scale/Enterprise + acesso liberado ao beta fechado.

const UTMIFY_BASE_URL = "https://query-api.utmify.com.br";

export type UtmifyFilters = {
  from?: string; // ISO 8601, ex: 2026-06-01T00:00:00-03:00
  to?: string;
  productNames?: string[];
  platforms?: string[];
  metaAdAccountIds?: string[];
  googleAdAccountIds?: string[];
  kwaiAdAccountIds?: string[];
  tikTokAdAccountIds?: string[];
  taboolaAdAccountIds?: string[];
  trafficSource?: "Meta" | "Google" | "Kwai" | "TikTok" | "Taboola";
};

export type UtmifySummary = {
  dashboardId: string;
  currency: string;
  viewType: "Total" | "Normal";
  period: { from: string; to: string };
  orders: {
    total: number;
    approved: number;
    pending: number;
    refunded: number;
    chargedback: number;
  };
  revenue: {
    gross: number;
    net: number;
    pending: number;
    refunded: number;
    chargeback: number;
  };
  ads: {
    spend: number;
    byPlatform: {
      meta: number;
      google: number;
      kwai: number;
      tiktok: number;
      taboola: number;
    };
    clicks: number;
    pageViews: number;
    initiateCheckouts: number;
    leads: number;
  };
  costs: {
    fees: number;
    taxes: number;
    metaAdsTax: number;
    productsCost: number;
    customSpent: number;
  };
  result: {
    profit: number;
    roas: number | null;
    roi: number | null;
    profitMargin: number | null;
    avgTicket: number | null;
    cpa: number | null;
    arpu: number | null;
  };
};

export class UtmifyError extends Error {
  constructor(
    message: string,
    public status: number,
    public reason?: string
  ) {
    super(message);
    this.name = "UtmifyError";
  }
}

/**
 * Busca o resumo de métricas de um dashboard da Utmify.
 * Faz 1 retry automático em caso de 429, respeitando o header Retry-After.
 */
export async function fetchUtmifySummary(
  dashboardId: string,
  filters: UtmifyFilters = {},
  apiKey: string = process.env.UTMIFY_API_KEY!
): Promise<UtmifySummary> {
  const url = `${UTMIFY_BASE_URL}/public-api/v1/dashboards/${dashboardId}/summary`;

  const doFetch = async () =>
    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(filters),
      // dados "ao vivo" tem cache curto na propria Utmify (~2min); aqui evitamos
      // cache do Next pra nao servir dado desatualizado no dashboard
      cache: "no-store"
    });

  let res = await doFetch();

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("Retry-After") ?? "2");
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    res = await doFetch();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new UtmifyError(
      body?.reason ?? `Erro ${res.status} ao consultar Utmify`,
      res.status,
      body?.reason
    );
  }

  return res.json();
}

/** centavos -> string formatada em BRL/moeda informada */
export function formatCents(cents: number | null | undefined, currency = "BRL") {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency
  });
}

export function formatPercent(value: number | null | undefined, digits = 1) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}
