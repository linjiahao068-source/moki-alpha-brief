import type { EvidenceSource } from "@/types/evidence";
import type { MarketProvider } from "../types";

const MOCK_QUOTES: Record<
  string,
  {
    name: string;
    price: number;
    previousClose: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    marketCap?: number;
    peRatio?: number;
    currency: string;
    exchange: string;
  }
> = {
  NVDA: {
    name: "NVIDIA",
    price: 144.12,
    previousClose: 142.83,
    open: 143.2,
    high: 145.4,
    low: 141.9,
    volume: 186_000_000,
    marketCap: 3_540_000_000_000,
    peRatio: 48.6,
    currency: "USD",
    exchange: "NASDAQ",
  },
  TSLA: {
    name: "Tesla",
    price: 182.7,
    previousClose: 180.35,
    open: 181.1,
    high: 184.2,
    low: 178.9,
    volume: 82_500_000,
    marketCap: 582_000_000_000,
    peRatio: 58.2,
    currency: "USD",
    exchange: "NASDAQ",
  },
  ORCL: {
    name: "Oracle",
    price: 153.45,
    previousClose: 151.88,
    open: 152.2,
    high: 154.0,
    low: 150.7,
    volume: 14_800_000,
    marketCap: 425_000_000_000,
    peRatio: 36.4,
    currency: "USD",
    exchange: "NYSE",
  },
  SNOW: {
    name: "Snowflake",
    price: 132.8,
    previousClose: 130.95,
    open: 131.4,
    high: 134.1,
    low: 129.9,
    volume: 7_900_000,
    marketCap: 45_000_000_000,
    currency: "USD",
    exchange: "NYSE",
  },
  MSFT: {
    name: "Microsoft",
    price: 478.6,
    previousClose: 475.2,
    open: 476.9,
    high: 480.1,
    low: 472.6,
    volume: 22_000_000,
    marketCap: 3_560_000_000_000,
    peRatio: 37.8,
    currency: "USD",
    exchange: "NASDAQ",
  },
};

export const mockMarketProvider: MarketProvider = {
  async fetchMarketEvidence(input, config) {
    const ticker = input.ticker.trim().toUpperCase();
    const retrievedAt = formatCstTimestamp();
    const base = MOCK_QUOTES[ticker] || {
      name: input.companyName?.trim() || `${ticker} Demo Company`,
      price: 100,
      previousClose: 99.2,
      open: 99.8,
      high: 101.1,
      low: 98.7,
      volume: 1_000_000,
      currency: ticker.endsWith(".HK") ? "HKD" : "USD",
      exchange: ticker.endsWith(".HK") ? "HKEX" : "US",
    };
    const change = round(base.price - base.previousClose, 4);
    const percentChange = round((change / base.previousClose) * 100, 4);
    const history = buildMockHistory(
      base.price,
      Math.min(config.maxDailyPoints, 30),
    );
    const source: EvidenceSource = {
      id: "market-mock",
      title: "Mock Market Evidence",
      domain: "moki.local",
      publisher: "Moki Alpha Brief",
      sourceType: "market-data",
      retrievedAt,
      confidence: "medium",
      dateStatus: "retrieved-only",
      qualityReason:
        "Mock market evidence for UI, prompt, and fallback QA. Not live market data.",
      sourceRank: 1,
    };

    return {
      quote: {
        symbol: ticker,
        name: base.name,
        provider: "mock",
        price: base.price,
        previousClose: base.previousClose,
        open: base.open,
        high: base.high,
        low: base.low,
        volume: base.volume,
        change,
        percentChange,
        marketCap: base.marketCap,
        peRatio: base.peRatio,
        currency: base.currency,
        exchange: base.exchange,
        retrievedAt,
        dateStatus: "retrieved-only",
        confidence: "medium",
      },
      priceHistory: history,
      sources: [source],
      warnings: [
        "Mock Market Evidence: market data is simulated and not a live quote.",
        "Free public market data source may be delayed or incomplete.",
        "Market evidence is for research context only, not official trading quote.",
        "Market evidence is not consensus evidence.",
      ],
    };
  },
};

function buildMockHistory(price: number, count: number) {
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const daysBack = count - index;
    const date = new Date(today);
    date.setDate(today.getDate() - daysBack);
    const wave = Math.sin(index / 3) * 1.2;
    const close = round(price * (0.94 + index * 0.0025) + wave, 2);
    const open = round(close * 0.992, 2);

    return {
      date: date.toISOString().slice(0, 10),
      open,
      high: round(Math.max(open, close) * 1.01, 2),
      low: round(Math.min(open, close) * 0.99, 2),
      close,
      volume: 1_000_000 + index * 25_000,
    };
  });
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
