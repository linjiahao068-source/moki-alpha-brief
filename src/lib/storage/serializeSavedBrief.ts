import { randomUUID } from "node:crypto";
import type { BriefDocument } from "@/types/brief";
import type { SavedBriefRecord } from "@/types/savedBrief";
import { createBriefSlug } from "./slug";
import type { SaveBriefRecordInput } from "./types";

const BRIEF_DOCUMENT_KEYS = [
  "schemaVersion",
  "slug",
  "metadata",
  "hero",
  "cta",
  "sections",
  "scenarioAnalysis",
  "monitoringDashboard",
  "evidencePack",
  "secEvidencePack",
  "irEvidencePack",
  "marketEvidencePack",
  "consensusEvidencePack",
  "researchEvidenceContext",
  "evidenceSummary",
  "sourceNote",
  "disclaimer",
] as const;

export class SavedBriefSerializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SavedBriefSerializationError";
  }
}

export function serializeSavedBrief(
  input: SaveBriefRecordInput,
): SavedBriefRecord {
  const sanitizedBrief = sanitizeBriefDocument(input.briefDocument);
  const dataMode = sanitizedBrief.metadata?.dataMode;

  if (dataMode === "verified-real-data") {
    throw new SavedBriefSerializationError(
      "verified-real-data is not supported for saved briefs.",
    );
  }

  if (dataMode !== "evidence-draft") {
    throw new SavedBriefSerializationError(
      "Only evidence-draft BriefDocuments can be saved in the current MVP.",
    );
  }

  if (containsVerifiedRealData(sanitizedBrief)) {
    throw new SavedBriefSerializationError(
      "Saved briefs must not contain verified-real-data text.",
    );
  }

  const ticker = normalizeTicker(input.ticker || sanitizedBrief.metadata.ticker);
  const companyName =
    cleanOptionalString(input.companyName) ||
    cleanOptionalString(sanitizedBrief.metadata.companyName);
  const slug = createBriefSlug(ticker);
  const now = new Date().toISOString();
  const warnings = normalizeStringArray(input.warnings);
  const evidenceSummary =
    ensurePlainObject(input.evidenceSummary) ||
    ensurePlainObject(sanitizedBrief.evidenceSummary);
  const sourceCounts =
    ensurePlainObject(input.sourceCounts) || deriveSourceCounts(sanitizedBrief);

  sanitizedBrief.slug = slug;
  sanitizedBrief.metadata = {
    ...sanitizedBrief.metadata,
    ticker,
    companyName: companyName || sanitizedBrief.metadata.companyName,
    dataMode: "evidence-draft",
    updatedAt: sanitizedBrief.metadata.updatedAt || now,
  };

  return {
    id: randomUUID(),
    slug,
    title: sanitizedBrief.metadata.title,
    ticker,
    companyName,
    createdAt: now,
    updatedAt: now,
    schemaVersion: sanitizedBrief.schemaVersion,
    dataMode: "evidence-draft",
    evidenceLevel:
      cleanOptionalString(input.metadata?.evidenceLevel) ||
      sanitizedBrief.researchEvidenceContext?.evidenceLevel ||
      "none",
    modelProvider: cleanOptionalString(input.metadata?.modelProvider),
    modelName: cleanOptionalString(input.metadata?.modelName),
    isFallback: input.metadata?.isFallback,
    briefDocument: sanitizedBrief,
    evidenceSummary,
    sourceCounts,
    warnings: warnings.length ? warnings : undefined,
    disclaimer:
      cleanOptionalString(input.disclaimer) ||
      cleanOptionalString(sanitizedBrief.disclaimer?.text),
  };
}

function sanitizeBriefDocument(briefDocument: BriefDocument): BriefDocument {
  const sanitized = sanitizeUnknown(briefDocument);

  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    throw new SavedBriefSerializationError("briefDocument must be an object.");
  }

  const record = sanitized as Record<string, unknown>;
  const picked: Record<string, unknown> = {};

  for (const key of BRIEF_DOCUMENT_KEYS) {
    if (record[key] !== undefined) picked[key] = record[key];
  }

  return picked as BriefDocument;
}

function sanitizeUnknown(value: unknown, keyName = "", depth = 0): unknown {
  if (depth > 32) return undefined;
  if (value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeUnknown(item, keyName, depth + 1))
      .filter((item) => item !== undefined);
  }
  if (typeof value !== "object") return undefined;

  const output: Record<string, unknown> = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (isForbiddenSavedBriefKey(key)) continue;
    const sanitizedChild = sanitizeUnknown(childValue, key, depth + 1);
    if (sanitizedChild !== undefined) output[key] = sanitizedChild;
  }

  return output;
}

function isForbiddenSavedBriefKey(key: string) {
  const normalized = key.replace(/[-_\s]/g, "").toLowerCase();

  return (
    normalized.includes("apikey") ||
    normalized.includes("authorization") ||
    normalized === "token" ||
    normalized.endsWith("token") ||
    normalized === "raw" ||
    normalized === "rawtext" ||
    normalized === "rawcontent" ||
    normalized === "rawoutput" ||
    normalized === "rawmodeloutput" ||
    normalized === "rawproviderresponse" ||
    normalized === "rawresponse" ||
    normalized === "providerresponse" ||
    normalized === "reasoningcontent" ||
    normalized === "stack" ||
    normalized === "stacktrace" ||
    normalized.startsWith("debug") ||
    normalized.startsWith("internalerror")
  );
}

function normalizeTicker(ticker: string) {
  const value = String(ticker || "").trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,12}$/.test(value)) {
    throw new SavedBriefSerializationError(
      "Ticker must be 1-12 characters and only contain A-Z, 0-9, dot, or hyphen.",
    );
  }
  return value;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 40);
}

function cleanOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function ensurePlainObject(value: unknown): object | undefined {
  const sanitized = sanitizeUnknown(value);
  if (!sanitized || typeof sanitized !== "object" || Array.isArray(sanitized)) {
    return undefined;
  }

  return sanitized;
}

function deriveSourceCounts(brief: BriefDocument): object {
  return {
    searchSources: brief.evidencePack?.sources?.length || 0,
    searchItems: brief.evidencePack?.newsItems?.length || 0,
    secSources: brief.secEvidencePack?.sources?.length || 0,
    secRecentFilings: brief.secEvidencePack?.recentFilings?.length || 0,
    secFiscalFacts: brief.secEvidencePack?.fiscalFacts?.length || 0,
    irSources: brief.irEvidencePack?.sources?.length || 0,
    irItems: brief.irEvidencePack?.irItems?.length || 0,
    marketSources: brief.marketEvidencePack?.sources?.length || 0,
    marketPriceHistoryPoints: brief.marketEvidencePack?.priceHistory?.length || 0,
    consensusSources: brief.consensusEvidencePack?.sources?.length || 0,
    consensusEstimates: brief.consensusEvidencePack?.estimates?.length || 0,
    researchSources: brief.researchEvidenceContext?.sourceRegistry?.length || 0,
    researchFacts: brief.researchEvidenceContext?.factLedger?.length || 0,
  };
}

function containsVerifiedRealData(value: unknown): boolean {
  if (typeof value === "string") {
    const cleaned = value
      .replace(/not verified-real-data/gi, "")
      .replace(/not\s+verified real data/gi, "")
      .replace(/is not[^.。]{0,80}verified-real-data/gi, "")
      .replace(/不是[^。]{0,80}verified-real-data/gi, "");

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
