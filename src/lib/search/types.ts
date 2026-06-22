import type { EvidencePack, SearchProviderName } from "@/types/evidence";
import type { EvidenceQueryPurpose } from "@/types/evidence";

export type SearchDepth = "basic" | "advanced";

export type SearchInput = {
  ticker: string;
  companyName?: string;
  maxResults?: number;
  searchDepth?: SearchDepth;
};

export type SearchResult = {
  title: string;
  url?: string;
  content?: string;
  snippet?: string;
  publishedAt?: string;
  score?: number;
  queryPurpose?: EvidenceQueryPurpose;
  rawSource?: unknown;
};

export type SearchEvidenceResult = {
  ok: boolean;
  evidencePack?: EvidencePack;
  error?: string;
  provider: SearchProviderName;
  isFallback?: boolean;
  warnings?: string[];
};

export type SearchProvider = {
  search(query: string, input: SearchInput): Promise<SearchResult[]>;
};
