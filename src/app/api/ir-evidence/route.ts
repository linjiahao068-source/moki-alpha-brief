import { NextResponse } from "next/server";
import { buildIrEvidencePack } from "@/lib/ir/buildIrEvidencePack";
import type { IrInput } from "@/lib/ir/types";

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

  const payload = body as Partial<IrInput>;
  const ticker = String(payload.ticker || "").trim().toUpperCase();

  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) {
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

  const result = await buildIrEvidencePack({
    ticker,
    companyName:
      typeof payload.companyName === "string"
        ? payload.companyName.trim()
        : undefined,
    maxResults: 5,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      provider: "mock",
      error: "Method not allowed. Use POST /api/ir-evidence.",
      warnings: [],
    },
    { status: 405 },
  );
}
