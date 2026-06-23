import "server-only";

import { stocks } from "stock-api";
import type {
  EvidenceSource,
  MarketPricePoint,
  MarketQuote,
} from "@/types/evidence";
import {
  normalizeMarketTicker,
  normalizeTickerForStockApi,
} from "../normalizeMarketTicker";
import type { MarketInput, MarketProvider } from "../types";

type StockApiQuote = {
  code: string;
  name: string;
  now: number;
  low: number;
  high: number;
  percent: number;
  yesterday: number;
  source?: string;
};

type StockApiKline = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume?: number;
  source?: string;
};

export const stockApiMarketProvider: MarketProvider = {
  async fetchMarketEvidence(input, config) {
    const normalized = normalizeMarketTicker(input.ticker, config.dataRegion);
    const stockApiCode = normalizeTickerForStockApi(input.ticker, config.dataRegion);
    const retrievedAt = formatCstTimestamp();
    const warnings: string[] = [
      "Free public market data source may be delayed or incomplete.",
      "Market evidence is for research context only, not official trading quote.",
      "Consensus estimates are not connected.",
    ];

    const [quoteResult, klineResult] = await Promise.allSettled([
      stocks.auto.getStock(stockApiCode),
      stocks.auto.getKlines(stockApiCode, {
        period: "day",
        count: config.maxDailyPoints,
      }),
    ]);

    const baseQuote =
      quoteResult.status === "fulfilled"
        ? buildQuote({
            input,
            normalizedSymbol: normalized.symbol,
            quote: quoteResult.value as StockApiQuote,
            retrievedAt,
          })
        : undefined;
    const priceHistory =
      klineResult.status === "fulfilled"
        ? buildPriceHistory(klineResult.value as StockApiKline[], config.maxDailyPoints)
        : [];
    const quote = enrichQuoteFromLatestKline(baseQuote, priceHistory);

    if (quoteResult.status === "rejected") {
      warnings.push(`stock-api quote request failed: ${getErrorMessage(quoteResult.reason)}.`);
    } else if (!quote) {
      warnings.push("stock-api quote returned no usable price fields.");
    }

    if (klineResult.status === "rejected") {
      warnings.push(`stock-api daily kline request failed: ${getErrorMessage(klineResult.reason)}.`);
    } else if (!priceHistory.length) {
      warnings.push("stock-api daily kline returned no rows.");
    }

    const sources = buildSources({
      stockApiCode,
      retrievedAt,
      quoteSource: quoteResult.status === "fulfilled"
        ? stringValue((quoteResult.value as StockApiQuote).source)
        : undefined,
      klineSource:
        klineResult.status === "fulfilled"
          ? stringValue((klineResult.value as StockApiKline[])[0]?.source)
          : undefined,
    });

    if (!quote?.price && priceHistory.length) {
      const latest = priceHistory[priceHistory.length - 1];
      warnings.push(
        "Quote price was incomplete; latest daily kline close is used as market context.",
      );

      return {
        quote: buildInferredQuote({
          input,
          symbol: normalized.symbol,
          retrievedAt,
          latest,
        }),
        priceHistory,
        sources,
        warnings: Array.from(new Set(warnings)),
      };
    }

    if (!quote && !priceHistory.length) {
      throw new Error("stock-api returned no quote or daily kline data.");
    }

    return {
      quote,
      priceHistory,
      sources,
      warnings: Array.from(new Set(warnings)),
    };
  },
};

function buildQuote({
  input,
  normalizedSymbol,
  quote,
  retrievedAt,
}: {
  input: MarketInput;
  normalizedSymbol: string;
  quote: StockApiQuote;
  retrievedAt: string;
}): MarketQuote | undefined {
  if (!isUsableQuote(quote)) return undefined;

  const price = numberValue(quote.now);
  const previousClose = numberValue(quote.yesterday);
  const change =
    price !== undefined && previousClose !== undefined
      ? round(price - previousClose, 4)
      : undefined;
  const percent = numberValue(quote.percent);

  return {
    symbol: normalizedSymbol,
    name: input.companyName?.trim() || stringValue(quote.name),
    provider: "stock-api",
    price,
    previousClose,
    high: numberValue(quote.high),
    low: numberValue(quote.low),
    change,
    percentChange: percent !== undefined ? round(percent * 100, 4) : undefined,
    currency: normalizedSymbol.endsWith(".HK") ? "HKD" : "USD",
    exchange: normalizedSymbol.endsWith(".HK") ? "HKEX" : "US",
    retrievedAt,
    dateStatus: "retrieved-only",
    confidence: "medium",
  };
}

function buildPriceHistory(rows: StockApiKline[], maxDailyPoints: number) {
  if (!Array.isArray(rows)) return [];

  const mapped = rows
    .map((row) => ({
      date: stringValue(row.date) || "",
      open: numberValue(row.open),
      high: numberValue(row.high),
      low: numberValue(row.low),
      close: numberValue(row.close),
      volume: numberValue(row.volume),
    }))
    .filter((point) => Boolean(point.date))
    .sort((left, right) => left.date.localeCompare(right.date));
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 370);
  const recent = mapped.filter((point) => {
    const parsed = new Date(`${point.date}T00:00:00Z`).getTime();
    return Number.isFinite(parsed) && parsed >= recentCutoff.getTime();
  });

  return (recent.length ? recent : mapped).slice(-maxDailyPoints);
}

function enrichQuoteFromLatestKline(
  quote: MarketQuote | undefined,
  priceHistory: MarketPricePoint[],
) {
  if (!quote || !priceHistory.length) return quote;

  const latest = priceHistory[priceHistory.length - 1];
  return {
    ...quote,
    open: quote.open ?? latest.open,
    high: quote.high ?? latest.high,
    low: quote.low ?? latest.low,
    volume: quote.volume ?? latest.volume,
  };
}

function buildInferredQuote({
  input,
  latest,
  retrievedAt,
  symbol,
}: {
  input: MarketInput;
  latest: MarketPricePoint;
  retrievedAt: string;
  symbol: string;
}): MarketQuote {
  return {
    symbol,
    name: input.companyName?.trim(),
    provider: "stock-api",
    price: latest.close,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
    currency: symbol.endsWith(".HK") ? "HKD" : "USD",
    exchange: symbol.endsWith(".HK") ? "HKEX" : "US",
    marketTimestamp: latest.date,
    retrievedAt,
    dateStatus: latest.date ? "market-timestamp" : "retrieved-only",
    confidence: "medium",
  };
}

function buildSources({
  klineSource,
  quoteSource,
  retrievedAt,
  stockApiCode,
}: {
  klineSource?: string;
  quoteSource?: string;
  retrievedAt: string;
  stockApiCode: string;
}): EvidenceSource[] {
  const sourceLabel = Array.from(new Set([quoteSource, klineSource].filter(Boolean)));

  return [
    {
      id: "market-stock-api-auto",
      title: `stock-api stocks.auto${sourceLabel.length ? ` (${sourceLabel.join("/")})` : ""}`,
      url: "https://github.com/zhangxiangliang/stock-api",
      domain: "github.com",
      publisher: "stock-api",
      sourceType: "market-data",
      retrievedAt,
      confidence: "medium",
      dateStatus: "retrieved-only",
      qualityReason: `stock-api normalized quote / daily kline contract for ${stockApiCode}; raw provider response is not exposed.`,
      sourceRank: 1,
    },
  ];
}

function isUsableQuote(quote: StockApiQuote) {
  return Boolean(
    quote &&
      quote.source &&
      quote.source !== "base" &&
      stringValue(quote.name) &&
      stringValue(quote.name) !== "---" &&
      numberValue(quote.now) !== undefined,
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown stock-api error";
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
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
