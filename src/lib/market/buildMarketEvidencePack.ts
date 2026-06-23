import type {
  MarketEvidencePack,
  MarketEvidenceProviderName,
  MarketProviderName,
} from "@/types/evidence";
import { getMarketConfig } from "./config";
import { normalizeMarketTicker } from "./normalizeMarketTicker";
import { globalStockDataMarketProvider } from "./providers/globalStockDataMarketProvider";
import { mockMarketProvider } from "./providers/mockMarketProvider";
import { stockApiMarketProvider } from "./providers/stockApiMarketProvider";
import type { MarketEvidenceResult, MarketInput, MarketProvider } from "./types";

const marketProviders: Record<MarketEvidenceProviderName, MarketProvider> = {
  "stock-api": stockApiMarketProvider,
  "global-stock-data": globalStockDataMarketProvider,
  mock: mockMarketProvider,
};

export async function buildMarketEvidencePack(
  input: MarketInput,
): Promise<MarketEvidenceResult> {
  const config = getMarketConfig();
  const normalized = normalizeMarketTicker(input.ticker, config.dataRegion);
  const providerChain = getProviderChain(config.provider);
  const attemptedProviders: MarketEvidenceProviderName[] = [];
  const fallbackWarnings: string[] = [];
  const failureReasons: string[] = [];

  for (let index = 0; index < providerChain.length; index += 1) {
    const providerName = providerChain[index];
    const provider = marketProviders[providerName];
    const nextProvider = providerChain[index + 1];
    attemptedProviders.push(providerName);

    try {
      const marketEvidencePack = await collectMarketEvidence({
        config,
        input,
        provider,
        providerName,
        providerChain,
        attemptedProviders: [...attemptedProviders],
        warnings: [
          ...fallbackWarnings,
          ...(providerName === "mock" && config.provider === "mock"
            ? ["Using mock market evidence; no public market data request was run."]
            : []),
          ...(providerName === "mock" && config.provider !== "mock"
            ? ["Provider fallback used when public source is unavailable."]
            : []),
        ],
      });

      return {
        ok: true,
        provider: providerName,
        isFallback: index > 0,
        marketEvidencePack,
        error: failureReasons[0],
        providerChain,
        attemptedProviders,
        warnings: marketEvidencePack.warnings || [],
      };
    } catch (error) {
      const reason = getErrorMessage(error, "Market evidence provider failed");
      failureReasons.push(`${providerName}: ${reason}`);
      logProviderError({
        providerName,
        ticker: normalized.symbol,
        error,
      });

      if (nextProvider) {
        fallbackWarnings.push(
          `${providerName} failed; falling back to ${nextProvider}.`,
        );
      } else {
        fallbackWarnings.push(`${providerName} failed.`);
      }
    }
  }

  return {
    ok: false,
    provider: "mock",
    isFallback: true,
    error: failureReasons[0] || "All market evidence providers failed.",
    providerChain,
    attemptedProviders,
    warnings: fallbackWarnings,
  };
}

async function collectMarketEvidence({
  config,
  input,
  provider,
  providerName,
  providerChain,
  attemptedProviders,
  warnings,
}: {
  config: ReturnType<typeof getMarketConfig>;
  input: MarketInput;
  provider: MarketProvider;
  providerName: MarketEvidencePack["provider"];
  providerChain: MarketEvidenceProviderName[];
  attemptedProviders: MarketEvidenceProviderName[];
  warnings: string[];
}) {
  const normalized = normalizeMarketTicker(input.ticker, config.dataRegion);
  const payload = await provider.fetchMarketEvidence(input, config);
  const quote =
    payload.quote && payload.quote.provider === providerName
      ? payload.quote
      : payload.quote
        ? { ...payload.quote, provider: providerName }
        : undefined;
  const marketWarnings = Array.from(
    new Set([
      ...warnings,
      ...(payload.warnings || []),
      "Market evidence is not SEC official-financial data.",
      "Market evidence is not consensus.",
      "Market evidence is not verification-grade data.",
    ]),
  );

  return {
    asOf: quote?.marketTimestamp || quote?.retrievedAt || formatCstTimestamp(),
    ticker: normalized.symbol,
    companyName: input.companyName?.trim() || quote?.name,
    provider: providerName,
    dataMode: "evidence-draft",
    quote,
    priceHistory: (payload.priceHistory || []).slice(-config.maxDailyPoints),
    sources: payload.sources,
    providerChain,
    attemptedProviders,
    warnings: marketWarnings,
  } satisfies MarketEvidencePack;
}

function getProviderChain(
  provider: MarketProviderName,
): MarketEvidenceProviderName[] {
  if (provider === "stock-api") return ["stock-api", "mock"];
  if (provider === "global-stock-data") return ["global-stock-data", "mock"];
  if (provider === "mock") return ["mock"];
  return ["stock-api", "global-stock-data", "mock"];
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

function logProviderError({
  error,
  providerName,
  ticker,
}: {
  error: unknown;
  providerName: MarketEvidenceProviderName;
  ticker: string;
}) {
  console.error("Market evidence provider error", {
    provider: providerName,
    ticker,
    error: {
      name: error instanceof Error ? error.name : "Error",
      message: getErrorMessage(error, "Public market data request failed"),
    },
  });
}

function formatCstTimestamp() {
  const value = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return `${value} CST`;
}
