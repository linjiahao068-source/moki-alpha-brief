export type EvidenceDataMode = "evidence-draft" | "verified-real-data";

export type EvidenceConfidence = "low" | "medium" | "high";

export type SearchProviderName = "mock" | "tavily";

export type SecProviderName = "mock" | "sec";

export type IrProviderName = "mock" | "search";

export type MarketProviderName =
  | "auto-free"
  | "stock-api"
  | "global-stock-data"
  | "mock";

export type MarketEvidenceProviderName = Exclude<MarketProviderName, "auto-free">;

export type ConsensusProviderName = "mock" | "fmp" | "finnhub";

export type ResearchEvidenceLevel =
  | "none"
  | "search-only"
  | "sec-only"
  | "ir-only"
  | "market-only"
  | "consensus-only"
  | "search-and-sec"
  | "search-and-ir"
  | "search-and-market"
  | "search-and-consensus"
  | "sec-and-ir"
  | "sec-and-market"
  | "sec-and-consensus"
  | "ir-and-market"
  | "ir-and-consensus"
  | "market-and-consensus"
  | "search-sec-and-ir"
  | "search-sec-and-market"
  | "search-sec-and-consensus"
  | "search-ir-and-market"
  | "search-ir-and-consensus"
  | "search-market-and-consensus"
  | "sec-ir-and-market"
  | "sec-ir-and-consensus"
  | "sec-market-and-consensus"
  | "ir-market-and-consensus"
  | "search-sec-ir-and-market"
  | "search-sec-ir-and-consensus"
  | "search-sec-market-and-consensus"
  | "search-ir-market-and-consensus"
  | "sec-ir-market-and-consensus"
  | "search-sec-ir-market-and-consensus";

export type EvidenceQueryPurpose =
  | "recent-news"
  | "company-ir"
  | "industry-context"
  | "risk-catalyst";

export type EvidenceSourceType =
  | "news"
  | "company-ir"
  | "earnings-release"
  | "press-release"
  | "investor-presentation"
  | "shareholder-letter"
  | "quarterly-results"
  | "official-web"
  | "wire-release"
  | "other"
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

export type IrEvidenceSourceType =
  | "company-ir"
  | "earnings-release"
  | "press-release"
  | "investor-presentation"
  | "shareholder-letter"
  | "quarterly-results"
  | "official-web"
  | "wire-release"
  | "other";

export type IrEvidenceTheme =
  | "management-commentary"
  | "guidance"
  | "product-update"
  | "financial-commentary"
  | "capital-allocation"
  | "risk-disclosure"
  | "other";

export type IrAllowedUse =
  | "management-commentary"
  | "company-guidance-context"
  | "business-update"
  | "context-only";

export type IrEvidenceItem = {
  id: string;
  title: string;
  url?: string;
  domain?: string;
  publisher?: string;
  sourceType: IrEvidenceSourceType;
  publishedAt?: string;
  retrievedAt: string;
  dateStatus?: "published" | "retrieved-only" | "unknown";
  snippet: string;
  confidence: EvidenceConfidence;
  theme: IrEvidenceTheme;
  allowedUse: IrAllowedUse;
};

export type IrEvidencePack = {
  asOf: string;
  ticker: string;
  companyName?: string;
  provider: IrProviderName;
  dataMode: "evidence-draft";
  irItems: IrEvidenceItem[];
  sources: EvidenceSource[];
  warnings?: string[];
};

export type MarketQuote = {
  symbol: string;
  name?: string;
  provider: MarketEvidenceProviderName;
  price?: number;
  previousClose?: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  change?: number;
  percentChange?: number;
  marketCap?: number;
  peRatio?: number;
  currency?: string;
  exchange?: string;
  marketTimestamp?: string;
  retrievedAt: string;
  dateStatus?: "market-timestamp" | "retrieved-only" | "unknown";
  confidence: "medium";
};

export type MarketPricePoint = {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

export type MarketEvidencePack = {
  asOf: string;
  ticker: string;
  companyName?: string;
  provider: MarketEvidenceProviderName;
  dataMode: "evidence-draft";
  quote?: MarketQuote;
  priceHistory?: MarketPricePoint[];
  sources: EvidenceSource[];
  providerChain?: MarketEvidenceProviderName[];
  attemptedProviders?: MarketEvidenceProviderName[];
  warnings?: string[];
};

export type ConsensusAllowedUse =
  | "consensus-context"
  | "expectation-gap"
  | "guidance-comparison"
  | "context-only";

export type ConsensusEstimate = {
  id: string;
  fiscalPeriod?: string;
  fiscalYear?: number;
  periodEnd?: string;
  estimateDate?: string;
  revenueAvg?: number;
  revenueLow?: number;
  revenueHigh?: number;
  epsAvg?: number;
  epsLow?: number;
  epsHigh?: number;
  analystCount?: number;
  currency?: string;
  sourceProvider: ConsensusProviderName;
  confidence: "medium";
  allowedUse: ConsensusAllowedUse;
};

export type ConsensusEvidencePack = {
  asOf: string;
  ticker: string;
  companyName?: string;
  provider: ConsensusProviderName;
  dataMode: "evidence-draft";
  period: "quarter" | "annual";
  estimates: ConsensusEstimate[];
  sources: EvidenceSource[];
  warnings?: string[];
  isFallback?: boolean;
  providerChain?: ConsensusProviderName[];
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
  sourceKind:
    | "search"
    | "sec"
    | "ir"
    | "market"
    | "consensus"
    | "manual"
    | "mock";
  sourceType:
    | "news"
    | "company-ir"
    | "earnings-release"
    | "press-release"
    | "investor-presentation"
    | "shareholder-letter"
    | "quarterly-results"
    | "official-web"
    | "wire-release"
    | "other"
    | "web"
    | "sec-submission"
    | "sec-companyfacts"
    | "market-commentary"
    | "market-data"
    | "consensus"
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
    | "management-commentary"
    | "company-guidance-context"
    | "business-update"
    | "market-price"
    | "market-volume"
    | "market-price-history"
    | "market-valuation-context"
    | "consensus-revenue"
    | "consensus-eps"
    | "consensus-range"
    | "analyst-count"
    | "market-discussion"
    | "llm-analysis-placeholder";
  sourceKind: "sec" | "search" | "ir" | "market" | "consensus" | "mock";
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
    | "management-commentary"
    | "company-guidance-context"
    | "business-update"
    | "market-context"
    | "valuation-context"
    | "monitoring-dashboard"
    | "consensus-context"
    | "expectation-gap"
    | "guidance-comparison"
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
  hasMarketPrice: boolean;
  hasMarketVolume: boolean;
  hasMarketPriceHistory: boolean;
  hasMarketCap: boolean;
  hasConsensus: boolean;
  hasRevenueConsensus: boolean;
  hasEpsConsensus: boolean;
  hasAnalystCount: boolean;
  hasCompanyIr: boolean;
  hasEarningsRelease: boolean;
  hasManagementCommentary: boolean;
  hasGuidanceContext: boolean;
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
  irEvidencePack?: IrEvidencePack;
  marketEvidencePack?: MarketEvidencePack;
  consensusEvidencePack?: ConsensusEvidencePack;
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
