import "server-only";

import { Redis } from "@upstash/redis";
import {
  createBriefSlug,
  isValidBriefSlug,
  normalizeBriefSlug,
} from "@/lib/storage/slug";
import type { BuySideMemoV2 } from "./buySideMemoSchema";

type BuySideMemoV2StorageConfig =
  | {
      provider: "memory";
    }
  | {
      provider: "upstash";
      upstashUrl: string;
      upstashToken: string;
    };

export type SavedBuySideMemoV2Record = {
  slug: string;
  ticker: string;
  companyName: string | null;
  schemaVersion: BuySideMemoV2["schemaVersion"];
  createdAt: string;
  updatedAt: string;
  memo: BuySideMemoV2;
  sourceCounts: {
    sources: number;
    facts: number;
    webSearch: number;
    sec: number;
    companyIr: number;
    marketData: number;
    consensus: number;
  };
};

const globalV2Store = globalThis as typeof globalThis & {
  __mokiSavedBuySideMemoV2?: Map<string, SavedBuySideMemoV2Record>;
};
const memoryRecords =
  globalV2Store.__mokiSavedBuySideMemoV2 ||
  (globalV2Store.__mokiSavedBuySideMemoV2 = new Map<
    string,
    SavedBuySideMemoV2Record
  >());

let cachedRedis: Redis | null = null;
let cachedConnectionKey = "";

export async function saveBuySideMemoV2({
  memo,
  ticker,
}: {
  memo: BuySideMemoV2;
  ticker: string;
}): Promise<SavedBuySideMemoV2Record> {
  const record = serializeBuySideMemoV2({ memo, ticker });
  const config = getBuySideMemoV2StorageConfig();

  if (config.provider === "upstash") {
    const redis = getRedisClient(config);
    const result = await redis.set(getRedisKey(record.slug), record, {
      nx: true,
    });

    if (result !== "OK") {
      throw new Error("A saved memo with this slug already exists.");
    }

    return record;
  }

  memoryRecords.set(record.slug, record);
  return record;
}

export async function getBuySideMemoV2BySlug(
  slug: string,
): Promise<SavedBuySideMemoV2Record | null> {
  const normalizedSlug = normalizeBriefSlug(slug);
  if (!isValidBriefSlug(normalizedSlug)) return null;
  const config = getBuySideMemoV2StorageConfig();

  if (config.provider === "upstash") {
    const value = await getRedisClient(config).get<
      SavedBuySideMemoV2Record | string
    >(getRedisKey(normalizedSlug));

    if (!value) return null;
    if (typeof value === "string") {
      return JSON.parse(value) as SavedBuySideMemoV2Record;
    }

    return value;
  }

  return memoryRecords.get(normalizedSlug) || null;
}

export function getBuySideMemoV2ShareUrl(
  slug: string,
  requestBaseUrl?: string,
) {
  const shareBaseUrl = getBuySideMemoV2ShareBaseUrl(requestBaseUrl);

  return `${shareBaseUrl}/s/v2/${normalizeBriefSlug(slug)}`;
}

function serializeBuySideMemoV2({
  memo,
  ticker,
}: {
  memo: BuySideMemoV2;
  ticker: string;
}): SavedBuySideMemoV2Record {
  const now = formatCstTimestamp();
  const cleanMemo = sanitizeMemo(memo);
  const slug = createBriefSlug(ticker);
  const sourceStatus = cleanMemo.researchContext?.sourceStatus;

  return {
    slug,
    ticker: ticker.trim().toUpperCase(),
    companyName:
      cleanMemo.metadata.companyName && cleanMemo.metadata.companyName !== "unavailable"
        ? cleanMemo.metadata.companyName
        : cleanMemo.researchContext?.companyName || null,
    schemaVersion: cleanMemo.schemaVersion,
    createdAt: now,
    updatedAt: now,
    memo: cleanMemo,
    sourceCounts: {
      sources: cleanMemo.researchContext?.sources.length || 0,
      facts: cleanMemo.researchContext?.facts.length || 0,
      webSearch: sourceStatus?.webSearch.sourceCount || 0,
      sec: sourceStatus?.sec.sourceCount || 0,
      companyIr: sourceStatus?.companyIr.sourceCount || 0,
      marketData: sourceStatus?.marketData.sourceCount || 0,
      consensus: sourceStatus?.consensus.sourceCount || 0,
    },
  };
}

function sanitizeMemo(memo: BuySideMemoV2): BuySideMemoV2 {
  return sanitizeUnknown(memo) as BuySideMemoV2;
}

function sanitizeUnknown(value: unknown, keyName = "", depth = 0): unknown {
  if (depth > 24) {
    throw new Error("Saved memo is too deeply nested.");
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeUnknown(item, keyName, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (isForbiddenKey(key)) continue;
    const sanitized = sanitizeUnknown(childValue, key, depth + 1);
    if (sanitized !== undefined) output[key] = sanitized;
  }

  return output;
}

function isForbiddenKey(key: string) {
  const normalized = key.replace(/[-_\s]/g, "").toLowerCase();

  return (
    normalized.includes("apikey") ||
    normalized.includes("token") ||
    normalized === "rawproviderresponse" ||
    normalized === "rawtext" ||
    normalized === "reasoningcontent" ||
    normalized === "debug"
  );
}

function getRedisClient(config: Extract<BuySideMemoV2StorageConfig, { provider: "upstash" }>) {
  const connectionKey = `${config.upstashUrl}:${Boolean(config.upstashToken)}`;

  if (!cachedRedis || cachedConnectionKey !== connectionKey) {
    cachedRedis = new Redis({
      url: config.upstashUrl,
      token: config.upstashToken,
      automaticDeserialization: true,
    });
    cachedConnectionKey = connectionKey;
  }

  return cachedRedis;
}

function getBuySideMemoV2StorageConfig(): BuySideMemoV2StorageConfig {
  const provider = process.env.BRIEF_STORAGE_PROVIDER?.trim().toLowerCase();
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (provider && provider !== "memory" && provider !== "upstash") {
    throw new Error("Saved memo storage provider is not supported.");
  }

  if (provider === "memory") return { provider: "memory" };

  if (provider === "upstash" || (upstashUrl && upstashToken)) {
    if (!upstashUrl || !upstashToken) {
      throw new Error("Saved memo storage is not fully configured.");
    }

    return {
      provider: "upstash",
      upstashUrl,
      upstashToken,
    };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Saved memo storage is not configured.");
  }

  return { provider: "memory" };
}

function getBuySideMemoV2ShareBaseUrl(requestBaseUrl?: string) {
  const configured = [
    process.env.BRIEF_SHARE_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.SITE_URL,
    process.env.BASE_URL,
    process.env.VERCEL_URL,
  ].find((value) => value?.trim());
  const isStrictProduction = isVercelProductionRuntime();

  if (configured) {
    return normalizeV2ShareBaseUrl(configured, {
      allowLocal: !isStrictProduction,
    });
  }

  if (requestBaseUrl) {
    return normalizeV2ShareBaseUrl(requestBaseUrl, {
      allowLocal: !isStrictProduction,
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Share link base URL is not configured.");
  }

  return "http://localhost:3000";
}

function normalizeV2ShareBaseUrl(
  value: string,
  options: { allowLocal?: boolean } = {},
) {
  const trimmed = value.trim();
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const normalized = withProtocol.replace(/\/+$/, "");

  if (
    process.env.NODE_ENV === "production" &&
    !options.allowLocal &&
    isLocalShareBaseUrl(normalized)
  ) {
    throw new Error("Production share link base URL is not configured.");
  }

  return normalized;
}

function isLocalShareBaseUrl(value: string) {
  try {
    const { hostname } = new URL(value);
    return (
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
    );
  } catch {
    return false;
  }
}

function isVercelProductionRuntime() {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
}

function getRedisKey(slug: string) {
  return `brief:v2:${slug}`;
}

function formatCstTimestamp() {
  const value = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return `${value} CST`;
}
