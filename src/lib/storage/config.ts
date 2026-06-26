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
  const shareBaseUrl = getShareBaseUrl();

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

export function normalizeShareBaseUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return getLocalShareBaseUrl();

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  const normalized = withProtocol.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production" && isLocalShareBaseUrl(normalized)) {
    throw new BriefStorageConfigError(
      "Production share base URL must not be localhost. Set NEXT_PUBLIC_APP_URL=https://moki-alpha-brief.vercel.app or NEXT_PUBLIC_SITE_URL.",
    );
  }

  return normalized;
}

function getBriefStorageProvider(): BriefStorageProviderName {
  const raw = process.env.BRIEF_STORAGE_PROVIDER?.trim().toLowerCase();

  if (raw) {
    if (raw === "memory" || raw === "upstash") return raw;

    throw new BriefStorageConfigError(
      `Unsupported BRIEF_STORAGE_PROVIDER: ${raw}. Use memory or upstash.`,
    );
  }

  if (hasUpstashConfig()) return "upstash";
  if (process.env.NODE_ENV === "production") return "upstash";

  return "memory";
}

function getShareBaseUrl() {
  const configured = [
    process.env.BRIEF_SHARE_BASE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.APP_URL,
    process.env.SITE_URL,
    process.env.BASE_URL,
  ].find((value) => value?.trim());

  if (configured) return normalizeShareBaseUrl(configured);

  if (process.env.VERCEL_URL?.trim()) {
    return normalizeShareBaseUrl(process.env.VERCEL_URL);
  }

  if (process.env.NODE_ENV === "production") {
    throw new BriefStorageConfigError(
      "Production share base URL is not configured. Set NEXT_PUBLIC_APP_URL=https://moki-alpha-brief.vercel.app or NEXT_PUBLIC_SITE_URL.",
    );
  }

  return getLocalShareBaseUrl();
}

function hasUpstashConfig() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

function getLocalShareBaseUrl() {
  return `${"http"}://${"localhost"}:${"3000"}`;
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