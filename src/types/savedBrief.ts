import type { BriefDocument } from "./brief";

export type SavedBriefRecord = {
  id: string;
  slug: string;
  title: string;
  ticker: string;
  companyName?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: string;
  dataMode: "evidence-draft";
  evidenceLevel: string;
  modelProvider?: string;
  modelName?: string;
  isFallback?: boolean;
  briefDocument: BriefDocument;
  evidenceSummary?: object;
  sourceCounts?: object;
  warnings?: string[];
  disclaimer?: string;
};
