import { NextResponse } from "next/server";
import { validateBriefDocument } from "@/lib/briefs/validateBrief";
import { getBriefShareUrl, saveBrief } from "@/lib/storage/briefStore";
import type { SaveBriefRecordInput } from "@/lib/storage/types";
import type { BriefDocument } from "@/types/brief";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SaveBriefRequestBody = {
  briefDocument?: BriefDocument;
  ticker?: string;
  companyName?: string;
  metadata?: SaveBriefRecordInput["metadata"];
  evidenceSummary?: object;
  sourceCounts?: object;
  warnings?: string[];
  disclaimer?: string;
};

export async function POST(request: Request) {
  let body: SaveBriefRequestBody;

  try {
    body = (await request.json()) as SaveBriefRequestBody;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const briefDocument = body.briefDocument;

  if (!isRenderableBriefDocument(briefDocument)) {
    return NextResponse.json(
      {
        ok: false,
        error: "briefDocument must be a renderable BriefDocument.",
      },
      { status: 400 },
    );
  }

  if (briefDocument.metadata.dataMode === "verified-real-data") {
    return NextResponse.json(
      {
        ok: false,
        error: "verified-real-data is not supported in the current MVP.",
      },
      { status: 400 },
    );
  }

  if (briefDocument.metadata.dataMode !== "evidence-draft") {
    return NextResponse.json(
      {
        ok: false,
        error: "Only evidence-draft BriefDocuments can be saved.",
      },
      { status: 400 },
    );
  }

  if (containsVerifiedRealData(briefDocument)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Saved briefs must not contain verified-real-data text.",
      },
      { status: 400 },
    );
  }

  const validationWarnings = validateBriefDocument(briefDocument);

  try {
    const savedBrief = await saveBrief({
      briefDocument,
      ticker: body.ticker,
      companyName: body.companyName,
      metadata: body.metadata,
      evidenceSummary: isPlainObject(body.evidenceSummary)
        ? body.evidenceSummary
        : undefined,
      sourceCounts: isPlainObject(body.sourceCounts) ? body.sourceCounts : undefined,
      warnings: mergeWarnings(body.warnings, validationWarnings),
      disclaimer: body.disclaimer,
    });
    const shareUrl = getBriefShareUrl(savedBrief.slug, getRequestBaseUrl(request));

    return NextResponse.json({
      ok: true,
      slug: savedBrief.slug,
      shareUrl,
      savedBrief,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error && error.message
            ? error.message
            : "Brief save failed.",
      },
      { status: 500 },
    );
  }
}

export function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "Method not allowed. Use POST /api/briefs.",
    },
    { status: 405 },
  );
}

function isRenderableBriefDocument(value: unknown): value is BriefDocument {
  const brief = value as BriefDocument | undefined;

  return Boolean(
    brief &&
      typeof brief === "object" &&
      brief.schemaVersion === "0.1" &&
      brief.metadata?.ticker &&
      brief.metadata?.companyName &&
      brief.metadata?.title &&
      brief.metadata?.dataMode &&
      Array.isArray(brief.sections) &&
      brief.sections.length &&
      brief.scenarioAnalysis?.scenarios?.length &&
      brief.monitoringDashboard?.metrics?.length &&
      brief.sourceNote?.paragraphs?.length &&
      brief.disclaimer?.text,
  );
}

function isPlainObject(value: unknown): value is object {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function mergeWarnings(...groups: Array<string[] | undefined>) {
  return Array.from(
    new Set(
      groups
        .flatMap((group) => group || [])
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function containsVerifiedRealData(value: unknown): boolean {
  if (typeof value === "string") {
    const cleaned = value
      .replace(/not verified-real-data/gi, "")
      .replace(/not\s+verified real data/gi, "")
      .replace(/is not.{0,80}verified-real-data/gi, "")
      .replace(/is not.{0,80}verified real data/gi, "");

    return /verified-real-data/i.test(cleaned);
  }

  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsVerifiedRealData);

  return Object.entries(value).some(([key, childValue]) => {
    const normalizedKey = key.replace(/[-_\s]/g, "").toLowerCase();
    if (
      normalizedKey === "datamode" &&
      typeof childValue === "string" &&
      childValue === "verified-real-data"
    ) {
      return true;
    }

    return containsVerifiedRealData(childValue);
  });
}

function getRequestBaseUrl(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin;

  const forwardedHost =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!forwardedHost) return undefined;

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const protocol = forwardedProto || (isLocalHost(forwardedHost) ? "http" : "https");

  return `${protocol}://${forwardedHost}`;
}

function isLocalHost(host: string) {
  const normalized = host.toLowerCase();
  return normalized.includes("localhost") || normalized.includes("127.0.0.1");
}
