export type EvidenceDataMode = "evidence-draft" | "verified-real-data";

export type EvidenceConfidence = "low" | "medium" | "high";

export type SearchProviderName = "mock" | "tavily";

export type SecProviderName = "mock" | "sec";

export type ResearchEvidenceLevel =
  | "none"
  | "search-only"
  | "sec-only"
  | "search-and-sec";

export type EvidenceQueryPurpose =
  | "recent-news"
  | "company-ir"
  | "industry-context"
  | "risk-catalyst";

export type EvidenceSourceType =
  | "news"
  | "company-ir"
  | "web"
  | "sec-submission"
  | "sec-companyfacts"
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
  domain?: string;
  publisher?: string;
  sourceType: EvidenceSourceType;
  publishedAt?: string;
  retrievedAt: string;
  confidence: EvidenceConfidence;
  dateStatus?: "published" | "retrieved-only" | "unknown";
  qualityReason?: string;
  isDuplicate?: boolean;
  sourceRank?: number;
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
  domain?: string;
  publisher?: string;
  publishedAt?: string;
  retrievedAt: string;
  dateStatus?: "published" | "retrieved-only" | "unknown";
  snippet: string;
  relevance: EvidenceRelevance;
  confidence?: EvidenceConfidence;
  qualityReason?: string;
  isDuplicate?: boolean;
  sourceRank?: number;
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

export type SecFilingSummary = {
  accessionNumber: string;
  form: "10-K" | "10-Q" | "8-K" | string;
  filingDate: string;
  reportDate?: string;
  primaryDocument?: string;
  description?: string;
  secUrl?: string;
};

export type SecFiscalFact = {
  concept: string;
  label: string;
  value: number;
  unit: string;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  frame?: string;
  periodEnd?: string;
  confidence: "high";
  source: "sec-companyfacts";
};

export type SecEvidencePack = {
  asOf: string;
  ticker: string;
  cik: string;
  companyName?: string;
  provider: SecProviderName;
  dataMode: "evidence-draft";
  fiscalFacts: SecFiscalFact[];
  recentFilings: SecFilingSummary[];
  sources: EvidenceSource[];
  warnings?: string[];
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

export type ResearchEvidenceSource = {
  id: string;
  sourceKind: "search" | "sec" | "manual" | "mock";
  sourceType:
    | "news"
    | "company-ir"
    | "web"
    | "sec-submission"
    | "sec-companyfacts"
    | "market-commentary"
    | "manual";
  title: string;
  url?: string;
  domain?: string;
  publisher?: string;
  confidence: EvidenceConfidence;
  retrievedAt: string;
  publishedAt?: string;
  dateStatus?: "published" | "retrieved-only" | "unknown";
  linkedFactIds?: string[];
};

export type ResearchEvidenceFact = {
  id: string;
  factType:
    | "official-financial"
    | "filing-metadata"
    | "recent-development"
    | "risk-catalyst"
    | "market-discussion"
    | "llm-analysis-placeholder";
  sourceKind: "sec" | "search" | "mock";
  sourceId: string;
  label: string;
  value?: string | number;
  unit?: string;
  period?: string;
  filed?: string;
  form?: string;
  concept?: string;
  confidence: EvidenceConfidence;
  allowedUse:
    | "financial-analysis"
    | "recent-developments"
    | "risk-catalyst"
    | "context-only"
    | "not-for-facts";
  note?: string;
};

export type EvidenceCoverageSummary = {
  hasSearchEvidence: boolean;
  hasSecEvidence: boolean;
  hasRecentFilings: boolean;
  hasFiscalFacts: boolean;
  hasRevenueFact: boolean;
  hasNetIncomeFact: boolean;
  hasEpsFact: boolean;
  hasMarketPrice: false;
  hasConsensus: false;
  hasCompanyIr: false;
  missing: string[];
  warnings: string[];
};

export type ResearchEvidenceContext = {
  asOf: string;
  ticker: string;
  companyName?: string;
  dataMode: "evidence-draft";
  evidenceLevel: ResearchEvidenceLevel;
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  sourceRegistry: ResearchEvidenceSource[];
  factLedger: ResearchEvidenceFact[];
  coverage: EvidenceCoverageSummary;
  warnings?: string[];
};

export type SearchEvidenceProvider = {
  searchNews(ticker: string): Promise<EvidenceNewsItem[]>;
  searchCompanyIr(ticker: string): Promise<EvidenceIrItem[]>;
  fetchSecFacts(ticker: string): Promise<EvidenceSecData>;
  fetchMarketSnapshot(ticker: string): Promise<EvidenceMarketData>;
};
