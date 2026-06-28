import { NextResponse } from "next/server";
import {
  generateBuySideMemoV2,
  type GenerateBuySideMemoV2Input,
} from "@/lib/report-v2/generateBuySideMemoV2";
import type { DeepSeekModelMode } from "@/lib/llm/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBriefV2RequestBody = {
  ticker?: string;
  companyName?: string;
  language?: "zh-CN" | "en";
  modelMode?: DeepSeekModelMode;
  model?: string;
  useSearch?: boolean;
  useSec?: boolean;
  useIr?: boolean;
  useMarket?: boolean;
  useConsensus?: boolean;
  save?: boolean;
};

export async function POST(request: Request) {
  let body: GenerateBriefV2RequestBody;

  try {
    body = (await request.json()) as GenerateBriefV2RequestBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const ticker = String(body.ticker || "").trim().toUpperCase();

  if (!/^[A-Z0-9.-]{1,12}$/.test(ticker)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ticker must be 1-12 characters and only contain A-Z, 0-9, dot, or hyphen.",
      },
      { status: 400 },
    );
  }

  if (body.modelMode && body.modelMode !== "chat" && body.modelMode !== "reasoner") {
    return NextResponse.json(
      {
        ok: false,
        error: "modelMode must be either chat or reasoner.",
      },
      { status: 400 },
    );
  }

  const result = await generateBuySideMemoV2({
    ticker,
    companyName:
      typeof body.companyName === "string" ? body.companyName.trim() : undefined,
    language: body.language === "en" ? "en" : "zh-CN",
    modelMode: body.modelMode,
    model: typeof body.model === "string" ? body.model.trim() : undefined,
    useSearch: asOptionalBoolean(body.useSearch),
    useSec: asOptionalBoolean(body.useSec),
    useIr: asOptionalBoolean(body.useIr),
    useMarket: asOptionalBoolean(body.useMarket),
    useConsensus: asOptionalBoolean(body.useConsensus),
    save: body.save !== false,
    requestBaseUrl: getRequestBaseUrl(request),
  } satisfies GenerateBuySideMemoV2Input);

  return NextResponse.json(result, {
    status: result.ok ? 200 : result.validationIssues?.length ? 422 : 500,
  });
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Use a generation request with a JSON body.",
    },
    { status: 405 },
  );
}

function asOptionalBoolean(value: unknown) {
  return typeof value === "boolean" ? value : undefined;
}

function getRequestBaseUrl(request: Request) {
  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const protocol =
      forwardedProto || (isLocalHost(forwardedHost) ? "http" : "https");

    return `${protocol}://${forwardedHost}`;
  }

  return request.headers.get("origin") || undefined;
}

function isLocalHost(host: string) {
  const normalized = host.toLowerCase();
  return normalized.includes("localhost") || normalized.includes("127.0.0.1");
}
