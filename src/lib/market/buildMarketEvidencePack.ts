import type { MarketEvidencePack } from "@/types/evidence";
import { getMarketConfig } from "./config";
import { normalizeMarketTicker } from "./normalizeMarketTicker";
import { globalStockDataMarketProvider } from "./providers/globalStockDataMarketProvider";
import { mockMarketProvider } from "./providers/mockMarketProvider";
import type { MarketEvidenceResult, MarketInput, MarketProvider } from "./types";

export async function buildMarketEvidencePack(
  input: MarketInput,
): Promise<MarketEvidenceResult> {
  const config = getMarketConfig();
  const normalized = normalizeMarketTicker(input.ticker, config.dataRegion);

  if (config.provider === "mock") {
    const marketEvidencePack = await collectMarketEvidence({
      input,
      provider: mockMarketProvider,
      providerName: "mock",
      warnings: ["Using mock market evidence; no public market data request was run."],
    });

    return {
      ok: true,
      provider: "mock",
      isFallback: false,
      marketEvidencePack,
      warnings: marketEvidencePack.warnings || [],
    };
  }

  try {
    const marketEvidencePack = await collectMarketEvidence({
      input,
      provider: globalStockDataMarketProvider,
      providerName: "global-stock-data",
      warnings: [],
    });

    return {
      ok: true,
      provider: "global-stock-data",
      isFallback: false,
      marketEvidencePack,
      warnings: marketEvidencePack.warnings || [],
    };
  } catch (error) {
    console.error("Market evidence provider error", {
      provider: "global-stock-data",
      ticker: normalized.symbol,
      error: {
        name: error instanceof Error ? error.name : "Error",
        message:
          error instanceof Error
            ? error.message
            : "Public market data request failed",
      },
    });

    const reason =
      error instanceof Error
        ? error.message
        : "Public market data request failed";
    const fallback = await collectMarketEvidence({
      input,
      provider: mockMarketProvider,
      providerName: "mock",
      warnings: [
        reason,
        "Provider fallback used when public source is unavailable.",
      ],
    });

    return {
      ok: true,
      provider: "mock",
      isFallback: true,
      marketEvidencePack: fallback,
      error: reason,
      warnings: fallback.warnings,
    };
  }
}

async function collectMarketEvidence({
  input,
  provider,
  providerName,
  warnings,
}: {
  input: MarketInput;
  provider: MarketProvider;
  providerName: MarketEvidencePack["provider"];
  warnings: string[];
}) {
  const config = getMarketConfig();
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
    warnings: marketWarnings,
  } satisfies MarketEvidencePack;
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
