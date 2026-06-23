import { NextResponse } from "next/server";
import { generateBrief } from "@/lib/llm/generateBrief";
import type { GenerateBriefInput } from "@/lib/llm/types";

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
        issues: [],
      },
      { status: 400 },
    );
  }

  const payload = body as Partial<GenerateBriefInput>;
  const ticker = String(payload.ticker || "").trim().toUpperCase();

  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) {
    return NextResponse.json(
      {
        ok: false,
        provider: "mock",
        error:
          "Ticker must be 1-12 characters and only contain A-Z, 0-9, dot, or hyphen.",
        issues: [],
      },
      { status: 400 },
    );
  }

  const modelMode = payload.modelMode;

  if (
    modelMode !== undefined &&
    modelMode !== "chat" &&
    modelMode !== "reasoner"
  ) {
    return NextResponse.json(
      {
        ok: false,
        provider: "mock",
        error: "modelMode must be either chat or reasoner.",
        issues: [],
      },
      { status: 400 },
    );
  }

  const language =
    payload.language === "en" || payload.language === "en-US"
      ? "en"
      : "zh-CN";
  const result = await generateBrief({
    ticker,
    companyName:
      typeof payload.companyName === "string"
        ? payload.companyName.trim()
        : undefined,
    language,
    mode: "llm",
    modelMode,
    useSearch: payload.useSearch === true,
    useSec: payload.useSec === true,
    useIr: payload.useIr === true,
    useMarket: payload.useMarket === true,
  });

  return NextResponse.json(result, { status: result.brief ? 200 : result.ok ? 200 : 500 });
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      provider: "mock",
      error: "Method not allowed. Use POST /api/generate-brief.",
      issues: [],
    },
    { status: 405 },
  );
}
