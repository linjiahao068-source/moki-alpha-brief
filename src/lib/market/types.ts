import type {
  MarketEvidencePack,
  MarketEvidenceProviderName,
  MarketProviderName,
  MarketQuote,
  MarketPricePoint,
} from "@/types/evidence";

export type MarketInput = {
  ticker: string;
  companyName?: string;
};

export type MarketConfig = {
  provider: MarketProviderName;
  maxDailyPoints: number;
  dataRegion: "auto" | "us" | "hk";
};

export type NormalizedMarketTicker = {
  raw: string;
  symbol: string;
  yahooSymbol: string;
  region: "us" | "hk";
  hkCode?: string;
};

export type MarketProviderPayload = {
  quote?: MarketQuote;
  priceHistory?: MarketPricePoint[];
  sources: MarketEvidencePack["sources"];
  warnings: string[];
};

export type MarketEvidenceResult = {
  ok: boolean;
  provider: MarketEvidenceProviderName;
  isFallback?: boolean;
  marketEvidencePack?: MarketEvidencePack;
  error?: string;
  providerChain?: MarketEvidenceProviderName[];
  attemptedProviders?: MarketEvidenceProviderName[];
  warnings?: string[];
};

export type MarketProvider = {
  fetchMarketEvidence(
    input: MarketInput,
    config: MarketConfig,
  ): Promise<MarketProviderPayload>;
};
