import "server-only";

import type { BriefStorageProviderName } from "./types";

export type BriefStorageConfig = {
  provider: BriefStorageProviderName;
  upstashUrl?: string;
  upstashToken?: string;
  shareBaseUrl: string;
};

export class BriefStorageConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BriefStorageConfigError";
  }
}

export function getBriefStorageConfig(): BriefStorageConfig {
  const provider = getBriefStorageProvider();
  const shareBaseUrl = normalizeShareBaseUrl(
    process.env.BRIEF_SHARE_BASE_URL || "http://localhost:3000",
  );

  if (provider === "upstash") {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!upstashUrl || !upstashToken) {
      throw new BriefStorageConfigError(
        "Brief storage is set to upstash, but UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing.",
      );
    }

    return {
      provider,
      upstashUrl,
      upstashToken,
      shareBaseUrl,
    };
  }

  return {
    provider,
    shareBaseUrl,
  };
}

function getBriefStorageProvider(): BriefStorageProviderName {
  const raw = (process.env.BRIEF_STORAGE_PROVIDER || "memory")
    .trim()
    .toLowerCase();

  if (raw === "memory" || raw === "upstash") return raw;

  throw new BriefStorageConfigError(
    `Unsupported BRIEF_STORAGE_PROVIDER: ${raw}. Use memory or upstash.`,
  );
}

function normalizeShareBaseUrl(value: string) {
  const trimmed = value.trim() || "http://localhost:3000";
  return trimmed.replace(/\/+$/, "");
}
