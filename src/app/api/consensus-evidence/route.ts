import { NextResponse } from "next/server";
import { buildConsensusEvidencePack } from "@/lib/consensus/buildConsensusEvidencePack";
import { isValidConsensusTicker } from "@/lib/consensus/normalizeConsensusTicker";
import type { ConsensusInput, ConsensusPeriod } from "@/lib/consensus/types";

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
        providerChain: [],
      },
      { status: 400 },
    );
  }

  const payload = body as Partial<ConsensusInput>;
  const ticker = String(payload.ticker || "").trim().toUpperCase();

  if (!isValidConsensusTicker(ticker)) {
    return NextResponse.json(
      {
        ok: false,
        provider: "mock",
        error:
          "Ticker must be 1-12 characters and only contain A-Z, 0-9, dot, or hyphen.",
        warnings: [],
        providerChain: [],
      },
      { status: 400 },
    );
  }

  const period = getPeriod(payload.period);
  const result = await buildConsensusEvidencePack({
    ticker,
    companyName:
      typeof payload.companyName === "string"
        ? payload.companyName.trim()
        : undefined,
    period,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      provider: "mock",
      error: "Method not allowed. Use POST /api/consensus-evidence.",
      warnings: [],
      providerChain: [],
    },
    { status: 405 },
  );
}

function getPeriod(value: unknown): ConsensusPeriod | undefined {
  return value === "annual" || value === "quarter" ? value : undefined;
}
