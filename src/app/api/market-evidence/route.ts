import { NextResponse } from "next/server";
import { buildMarketEvidencePack } from "@/lib/market/buildMarketEvidencePack";
import { isValidMarketTicker } from "@/lib/market/normalizeMarketTicker";
import type { MarketInput } from "@/lib/market/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        provider: "mock",
        error: "Request body must be valid JSON.",
        warnings: [],
      },
      { status: 400 },
    );
  }

  const payload = body as Partial<MarketInput>;
  const ticker = String(payload.ticker || "").trim().toUpperCase();

  if (!isValidMarketTicker(ticker)) {
    return NextResponse.json(
      {
        ok: false,
        provider: "mock",
        error:
          "Ticker must be 1-12 characters and only contain A-Z, 0-9, dot, or hyphen.",
        warnings: [],
      },
      { status: 400 },
    );
  }

  const result = await buildMarketEvidencePack({
    ticker,
    companyName:
      typeof payload.companyName === "string"
        ? payload.companyName.trim()
        : undefined,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      provider: "mock",
      error: "Method not allowed. Use POST /api/market-evidence.",
      warnings: [],
    },
    { status: 405 },
  );
}
