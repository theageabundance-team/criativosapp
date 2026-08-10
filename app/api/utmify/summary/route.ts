import { NextRequest, NextResponse } from "next/server";
import { fetchUtmifySummary, UtmifyError } from "@/lib/utmify";

export async function POST(req: NextRequest) {
  try {
    const filters = await req.json().catch(() => ({}));
    const dashboardId = process.env.UTMIFY_DASHBOARD_ID;

    if (!dashboardId) {
      return NextResponse.json(
        { error: "UTMIFY_DASHBOARD_ID não configurado no .env" },
        { status: 500 }
      );
    }

    const summary = await fetchUtmifySummary(dashboardId, filters);
    return NextResponse.json(summary);
  } catch (err) {
    if (err instanceof UtmifyError) {
      return NextResponse.json(
        { error: err.message, reason: err.reason },
        { status: err.status }
      );
    }
    return NextResponse.json(
      { error: "Falha ao consultar métricas da Utmify" },
      { status: 500 }
    );
  }
}
