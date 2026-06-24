import "server-only";

import { Redis } from "@upstash/redis";
import type { SavedBriefRecord } from "@/types/savedBrief";
import { getBriefStorageConfig } from "../config";
import { serializeSavedBrief } from "../serializeSavedBrief";
import { isValidBriefSlug, normalizeBriefSlug } from "../slug";
import type { BriefStore } from "../types";

let cachedRedis: Redis | null = null;
let cachedConnectionKey = "";

export const upstashBriefStore: BriefStore = {
  async saveBrief(recordInput) {
    const record = serializeSavedBrief(recordInput);
    const redis = getRedisClient();
    const result = await redis.set(getRedisKey(record.slug), record, {
      nx: true,
    });

    if (result !== "OK") {
      throw new Error("Could not save brief because the generated slug already exists.");
    }

    return record;
  },

  async getBriefBySlug(slug) {
    const normalizedSlug = normalizeBriefSlug(slug);
    if (!isValidBriefSlug(normalizedSlug)) return null;

    const value = await getRedisClient().get<SavedBriefRecord | string>(
      getRedisKey(normalizedSlug),
    );

    if (!value) return null;
    if (typeof value === "string") return JSON.parse(value) as SavedBriefRecord;

    return value;
  },
};

function getRedisClient() {
  const config = getBriefStorageConfig();
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

function getRedisKey(slug: string) {
  return `brief:${slug}`;
}
