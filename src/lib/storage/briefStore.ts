import "server-only";

import type { SavedBriefRecord } from "@/types/savedBrief";
import { BriefStorageConfigError, getBriefStorageConfig } from "./config";
import { memoryBriefStore } from "./providers/memoryBriefStore";
import { upstashBriefStore } from "./providers/upstashBriefStore";
import { normalizeBriefSlug } from "./slug";
import type { BriefStore, SaveBriefRecordInput } from "./types";

export class BriefStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BriefStoreError";
  }
}

export async function saveBrief(
  recordInput: SaveBriefRecordInput,
): Promise<SavedBriefRecord> {
  try {
    return await getActiveBriefStore().saveBrief(recordInput);
  } catch (error) {
    logStorageError("save", error);
    throw new BriefStoreError(getReadableStorageError(error, "Brief save failed."));
  }
}

export async function getBriefBySlug(
  slug: string,
): Promise<SavedBriefRecord | null> {
  try {
    return await getActiveBriefStore().getBriefBySlug(normalizeBriefSlug(slug));
  } catch (error) {
    logStorageError("read", error);
    throw new BriefStoreError(
      getReadableStorageError(error, "Brief storage read failed."),
    );
  }
}

export function getBriefShareUrl(slug: string) {
  const config = getBriefStorageConfig();
  return `${config.shareBaseUrl}/s/${normalizeBriefSlug(slug)}`;
}

function getActiveBriefStore(): BriefStore {
  const config = getBriefStorageConfig();
  return config.provider === "upstash" ? upstashBriefStore : memoryBriefStore;
}

function getReadableStorageError(error: unknown, fallback: string) {
  if (error instanceof BriefStorageConfigError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function logStorageError(operation: "read" | "save", error: unknown) {
  console.error("Brief storage error", {
    operation,
    name: error instanceof Error ? error.name : "UnknownError",
    message: error instanceof Error ? error.message : "Unknown brief storage error",
  });
}
