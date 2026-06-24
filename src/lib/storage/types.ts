import type { BriefDocument } from "@/types/brief";
import type { SavedBriefRecord } from "@/types/savedBrief";

export type BriefStorageProviderName = "memory" | "upstash";

export type SavedBriefMetadataInput = {
  evidenceLevel?: string;
  modelProvider?: string;
  modelName?: string;
  isFallback?: boolean;
};

export type SaveBriefRecordInput = {
  briefDocument: BriefDocument;
  ticker?: string;
  companyName?: string;
  metadata?: SavedBriefMetadataInput;
  evidenceSummary?: object;
  sourceCounts?: object;
  warnings?: string[];
  disclaimer?: string;
};

export type BriefStore = {
  saveBrief(recordInput: SaveBriefRecordInput): Promise<SavedBriefRecord>;
  getBriefBySlug(slug: string): Promise<SavedBriefRecord | null>;
};
