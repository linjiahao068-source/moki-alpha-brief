export type EvidenceDataMode = "evidence-draft" | "verified-real-data";

export type EvidenceConfidence = "low" | "medium" | "high";

export type SearchProviderName = "mock" | "tavily";

export type EvidenceQueryPurpose =
  | "recent-news"
  | "company-ir"
  | "industry-context"
  | "risk-catalyst";

export type EvidenceSourceType =
  | "news"
  | "company-ir"
  | "web"
  | "market-commentary"
  | "manual"
  | "sec"
  | "ir"
  | "market-data"
  | "consensus";

export type EvidenceRelevance = "low" | "medium" | "high";

export type EvidenceTheme =
  | "catalyst"
  | "risk"
  | "industry"
  | "company-update"
  | "other";

export type EvidenceQuery = {
  id: string;
  query: string;
  purpose: EvidenceQueryPurpose;
};

export type EvidenceSource = {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  sourceType: EvidenceSourceType;
  publishedAt?: string;
  retrievedAt: string;
  confidence: EvidenceConfidence;
};

export type EvidenceMarketData = {
  price?: string;
  marketCap?: string;
  currency?: string;
  asOf: string;
  sourceId?: string;
};

export type EvidenceSecData = {
  filings?: Array<{
    formType: string;
    filedAt: string;
    url?: string;
    sourceId?: string;
  }>;
};

export type EvidenceNewsItem = {
  id: string;
  title: string;
  url?: string;
  publisher?: string;
  publishedAt?: string;
  retrievedAt: string;
  snippet: string;
  relevance: EvidenceRelevance;
  theme?: EvidenceTheme;
  sourceId?: string;
};

export type EvidenceIrItem = {
  title: string;
  url?: string;
  publishedAt?: string;
  sourceId?: string;
};

export type EvidenceConsensusData = {
  provider?: string;
  asOf: string;
  metrics?: Record<string, string>;
  sourceId?: string;
};

export type EvidencePack = {
  asOf: string;
  ticker: string;
  companyName?: string;
  dataMode: EvidenceDataMode;
  searchProvider?: SearchProviderName;
  querySet?: EvidenceQuery[];
  sources: EvidenceSource[];
  marketData?: EvidenceMarketData;
  secData?: EvidenceSecData;
  newsItems?: EvidenceNewsItem[];
  irItems?: EvidenceIrItem[];
  consensusData?: EvidenceConsensusData;
  warnings?: string[];
};

export type SearchEvidenceProvider = {
  searchNews(ticker: string): Promise<EvidenceNewsItem[]>;
  searchCompanyIr(ticker: string): Promise<EvidenceIrItem[]>;
  fetchSecFacts(ticker: string): Promise<EvidenceSecData>;
  fetchMarketSnapshot(ticker: string): Promise<EvidenceMarketData>;
};
