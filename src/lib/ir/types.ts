import type { IrEvidencePack, IrProviderName } from "@/types/evidence";
import type { SearchDepth } from "@/lib/search/types";
import type { SearchResult } from "@/lib/search/types";

export type IrInput = {
  ticker: string;
  companyName?: string;
  maxResults?: number;
};

export type IrConfig = {
  provider: IrProviderName;
  maxResults: number;
  tavilyApiKey?: string;
  tavilySearchDepth: SearchDepth;
};

export type IrEvidenceResult = {
  ok: boolean;
  provider: IrProviderName;
  isFallback?: boolean;
  irEvidencePack?: IrEvidencePack;
  error?: string;
  warnings?: string[];
};

export type IrProvider = {
  search(query: string, input: IrInput): Promise<SearchResult[]>;
};
