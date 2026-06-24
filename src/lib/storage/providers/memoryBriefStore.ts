import "server-only";

import type { SavedBriefRecord } from "@/types/savedBrief";
import { serializeSavedBrief } from "../serializeSavedBrief";
import { isValidBriefSlug, normalizeBriefSlug } from "../slug";
import type { BriefStore } from "../types";

const globalMemoryStore = globalThis as typeof globalThis & {
  __mokiSavedBriefs?: Map<string, SavedBriefRecord>;
};
const recordsBySlug =
  globalMemoryStore.__mokiSavedBriefs ||
  (globalMemoryStore.__mokiSavedBriefs = new Map<string, SavedBriefRecord>());

export const memoryBriefStore: BriefStore = {
  async saveBrief(recordInput) {
    const record = serializeSavedBrief(recordInput);
    recordsBySlug.set(record.slug, record);
    return record;
  },

  async getBriefBySlug(slug) {
    const normalizedSlug = normalizeBriefSlug(slug);
    if (!isValidBriefSlug(normalizedSlug)) return null;

    return recordsBySlug.get(normalizedSlug) || null;
  },
};
