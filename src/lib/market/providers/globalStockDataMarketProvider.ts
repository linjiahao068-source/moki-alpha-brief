import type {
  EvidenceSource,
  MarketPricePoint,
  MarketQuote,
} from "@/types/evidence";
import { normalizeMarketTicker } from "../normalizeMarketTicker";
import type {
  MarketConfig,
  MarketInput,
  MarketProvider,
  NormalizedMarketTicker,
} from "../types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

type ProviderCandidate = {
  quote?: MarketQuote;
  priceHistory?: MarketPricePoint[];
  sources: EvidenceSource[];
  warnings: string[];
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      timestamp?: number[];
      indicators?: {
        quote?: Array<Record<string, Array<number | null> | undefined>>;
      };
    }>;
    error?: unknown;
  };
};

export const globalStockDataMarketProvider: MarketProvider = {
  async fetchMarketEvidence(input, config) {
    const normalized = normalizeMarketTicker(input.ticker, config.dataRegion);
    const retrievedAt = formatCstTimestamp();
    const warnings: string[] = [
      "Free public market data source may be delayed or incomplete.",
      "Market evidence is for research context only, not official trading quote.",
      "Market evidence is not consensus evidence.",
    ];

    const candidates = await Promise.allSettled([
      fetchYahooChart(normalized, input, config, retrievedAt),
      normalized.region === "us"
        ? fetchSinaUsKline(normalized, config, retrievedAt)
        : Promise.resolve(undefined),
      fetchTencentQuote(normalized, input, retrievedAt),
      fetchSinaQuote(normalized, input, retrievedAt),
    ]);
    const successful = candidates.flatMap((candidate) =>
      candidate.status === "fulfilled" && candidate.value ? [candidate.value] : [],
    );
    const failedCount = candidates.filter(
      (candidate) => candidate.status === "rejected",
    ).length;

    if (failedCount) {
      warnings.push(
        `${failedCount} public market data request(s) failed before fallback selection.`,
      );
    }

    const quote = chooseQuote(successful);
    const priceHistory = choosePriceHistory(successful, config.maxDailyPoints);
    const sources = dedupeSources(successful.flatMap((item) => item.sources));

    if (!quote?.price && priceHistory.length) {
      const latest = priceHistory[priceHistory.length - 1];
      warnings.push(
        "Quote price was incomplete; latest daily kline close is used as market context.",
      );
      const inferred = buildInferredQuote({
        input,
        normalized,
        retrievedAt,
        latest,
      });
      return {
        quote: inferred,
        priceHistory,
        sources,
        warnings: Array.from(
          new Set([...warnings, ...successful.flatMap((item) => item.warnings)]),
        ),
      };
    }

    if (!quote && !priceHistory.length) {
      throw new Error("No public quote or daily kline data returned.");
    }

    return {
      quote,
      priceHistory,
      sources,
      warnings: Array.from(
        new Set([...warnings, ...successful.flatMap((item) => item.warnings)]),
      ),
    };
  },
};

async function fetchYahooChart(
  normalized: NormalizedMarketTicker,
  input: MarketInput,
  config: MarketConfig,
  retrievedAt: string,
): Promise<ProviderCandidate> {
  const url = new URL(
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      normalized.yahooSymbol,
    )}`,
  );
  url.searchParams.set("interval", "1d");
  url.searchParams.set("range", getYahooRange(config.maxDailyPoints));

  const response = await fetchJson<YahooChartResponse>(url.toString(), {
    headers: { "User-Agent": UA },
  });
  const chart = response.chart?.result?.[0];
  const meta = chart?.meta || {};
  const timestamps = chart?.timestamp || [];
  const quoteData = chart?.indicators?.quote?.[0] || {};
  const priceHistory = timestamps
    .map((timestamp, index) =>
      buildPricePointFromYahoo(timestamp, index, quoteData),
    )
    .filter((point): point is MarketPricePoint => Boolean(point))
    .slice(-config.maxDailyPoints);
  const latest = priceHistory[priceHistory.length - 1];
  const price = firstNumber(
    meta.regularMarketPrice,
    meta.previousClose,
    latest?.close,
  );
  const previousClose = firstNumber(meta.chartPreviousClose, meta.previousClose);
  const change =
    price !== undefined && previousClose !== undefined
      ? round(price - previousClose, 4)
      : undefined;
  const marketTimestamp = timestampToIso(meta.regularMarketTime);
  const quote: MarketQuote | undefined =
    price !== undefined || latest
      ? {
          symbol: normalized.symbol,
          name: input.companyName?.trim(),
          provider: "global-stock-data",
          price,
          previousClose,
          open: latest?.open,
          high: latest?.high,
          low: latest?.low,
          volume: latest?.volume,
          change,
          percentChange:
            change !== undefined && previousClose
              ? round((change / previousClose) * 100, 4)
              : undefined,
          currency: stringValue(meta.currency),
          exchange:
            stringValue(meta.fullExchangeName) ||
            stringValue(meta.exchangeName) ||
            stringValue(meta.exchange),
          marketTimestamp,
          retrievedAt,
          dateStatus: marketTimestamp ? "market-timestamp" : "retrieved-only",
          confidence: "medium",
        }
      : undefined;

  return {
    quote,
    priceHistory,
    sources: [
      {
        id: "market-yahoo-chart",
        title: "Yahoo Finance chart API",
        url: url.toString(),
        domain: "query2.finance.yahoo.com",
        publisher: "Yahoo Finance",
        sourceType: "market-data",
        retrievedAt,
        confidence: "medium",
        dateStatus: sourceDateStatus(quote?.dateStatus),
        qualityReason:
          "Public Yahoo chart endpoint used through global-stock-data request logic.",
        sourceRank: 1,
      },
    ],
    warnings: priceHistory.length
      ? []
      : ["Yahoo chart returned no recent daily kline points."],
  };
}

async function fetchSinaUsKline(
  normalized: NormalizedMarketTicker,
  config: MarketConfig,
  retrievedAt: string,
): Promise<ProviderCandidate> {
  const url = new URL(
    "https://stock.finance.sina.com.cn/usstock/api/jsonp.php/var/US_MinKService.getDailyK",
  );
  url.searchParams.set("symbol", normalized.symbol);
  url.searchParams.set("num", String(config.maxDailyPoints));

  const text = await fetchText(url.toString(), {
    headers: {
      Referer: "https://finance.sina.com.cn/",
      "User-Agent": UA,
    },
  });
  const match = text.match(/\((\[[\s\S]*\])\)/);
  if (!match) throw new Error("Sina daily kline JSONP parse failed.");

  const parsed = JSON.parse(match[1]) as Array<Record<string, unknown>>;
  const priceHistory = parsed
    .map((item) => ({
      date: stringValue(item.d) || "",
      open: numberValue(item.o),
      high: numberValue(item.h),
      low: numberValue(item.l),
      close: numberValue(item.c),
      volume: numberValue(item.v),
    }))
    .filter((point) => Boolean(point.date))
    .slice(-config.maxDailyPoints);

  return {
    priceHistory,
    sources: [
      {
        id: "market-sina-us-kline",
        title: "Sina Finance US daily kline",
        url: url.toString(),
        domain: "stock.finance.sina.com.cn",
        publisher: "Sina Finance",
        sourceType: "market-data",
        retrievedAt,
        confidence: "medium",
        dateStatus: "retrieved-only",
        qualityReason:
          "Sina US daily kline endpoint referenced by global-stock-data.",
        sourceRank: 2,
      },
    ],
    warnings: priceHistory.length ? [] : ["Sina US daily kline returned no rows."],
  };
}

async function fetchTencentQuote(
  normalized: NormalizedMarketTicker,
  input: MarketInput,
  retrievedAt: string,
): Promise<ProviderCandidate> {
  const query =
    normalized.region === "hk"
      ? `r_hk${normalized.hkCode || normalized.symbol.replace(".HK", "")}`
      : `us${normalized.symbol}`;
  const url = `https://qt.gtimg.cn/q=${encodeURIComponent(query)}`;
  const text = await fetchText(url);
  const fields = parseDelimitedQuote(text, "~");

  if (fields.length < 50) throw new Error("Tencent quote returned too few fields.");

  const price = numberValue(fields[3]);
  const previousClose = numberValue(fields[4]);
  const change =
    price !== undefined && previousClose !== undefined
      ? round(price - previousClose, 4)
      : undefined;
  const marketTimestamp = parseTencentTimestamp(fields[30]);
  const marketCapRaw = numberValue(fields[44]);
  const peRaw = normalized.region === "hk" ? fields[39] : fields[53];
  const quote: MarketQuote = {
    symbol: normalized.symbol,
    name: input.companyName?.trim() || fields[27] || fields[2] || fields[1],
    provider: "global-stock-data",
    price,
    previousClose,
    open: numberValue(fields[5]),
    high: numberValue(fields[33]),
    low: numberValue(fields[34]),
    volume: numberValue(fields[6]),
    change,
    percentChange: numberValue(fields[32]),
    marketCap:
      marketCapRaw !== undefined ? round(marketCapRaw * 100_000_000, 2) : undefined,
    peRatio: numberValue(peRaw),
    currency: normalized.region === "hk" ? "HKD" : "USD",
    exchange: normalized.region === "hk" ? "HKEX" : undefined,
    marketTimestamp,
    retrievedAt,
    dateStatus: marketTimestamp ? "market-timestamp" : "retrieved-only",
    confidence: "medium",
  };

  return {
    quote,
    sources: [
      {
        id: "market-tencent-quote",
        title: "Tencent Finance quote",
        url,
        domain: "qt.gtimg.cn",
        publisher: "Tencent Finance",
        sourceType: "market-data",
        retrievedAt,
        confidence: "medium",
        dateStatus: sourceDateStatus(quote.dateStatus),
        qualityReason:
          "Tencent quote endpoint referenced by global-stock-data.",
        sourceRank: 3,
      },
    ],
    warnings: price === undefined ? ["Tencent quote returned no price."] : [],
  };
}

async function fetchSinaQuote(
  normalized: NormalizedMarketTicker,
  input: MarketInput,
  retrievedAt: string,
): Promise<ProviderCandidate> {
  const query =
    normalized.region === "hk"
      ? `rt_hk${normalized.hkCode || normalized.symbol.replace(".HK", "")}`
      : `gb_${normalized.symbol.toLowerCase()}`;
  const url = `https://hq.sinajs.cn/list=${encodeURIComponent(query)}`;
  const text = await fetchText(url, {
    headers: {
      Referer: "https://finance.sina.com.cn/",
      "User-Agent": UA,
    },
  });
  const fields = parseDelimitedQuote(text, ",");

  if (normalized.region === "hk") {
    if (fields.length < 15) throw new Error("Sina HK quote returned too few fields.");
    const price = numberValue(fields[6]);
    const previousClose = numberValue(fields[3]);
    const quote: MarketQuote = {
      symbol: normalized.symbol,
      name: input.companyName?.trim() || fields[1] || fields[0],
      provider: "global-stock-data",
      price,
      previousClose,
      open: numberValue(fields[2]),
      high: numberValue(fields[4]),
      low: numberValue(fields[5]),
      volume: numberValue(fields[12]),
      change: numberValue(fields[7]),
      percentChange: numberValue(fields[8]),
      currency: "HKD",
      exchange: "HKEX",
      retrievedAt,
      dateStatus: "retrieved-only",
      confidence: "medium",
    };

    return buildSinaQuoteCandidate(url, retrievedAt, quote);
  }

  if (fields.length < 30) throw new Error("Sina US quote returned too few fields.");
  const price = numberValue(fields[1]);
  const previousClose = numberValue(fields[26]);
  const change =
    price !== undefined && previousClose !== undefined
      ? round(price - previousClose, 4)
      : undefined;
  const quote: MarketQuote = {
    symbol: normalized.symbol,
    name: input.companyName?.trim() || fields[0],
    provider: "global-stock-data",
    price,
    previousClose,
    open: numberValue(fields[5]),
    high: numberValue(fields[6]),
    low: numberValue(fields[7]),
    volume: numberValue(fields[10]),
    change,
    percentChange: numberValue(fields[2]),
    marketCap: numberValue(fields[12]),
    peRatio: numberValue(fields[14]),
    currency: "USD",
    marketTimestamp: fields[3] || undefined,
    retrievedAt,
    dateStatus: fields[3] ? "market-timestamp" : "retrieved-only",
    confidence: "medium",
  };

  return buildSinaQuoteCandidate(url, retrievedAt, quote);
}

function buildSinaQuoteCandidate(
  url: string,
  retrievedAt: string,
  quote: MarketQuote,
): ProviderCandidate {
  return {
    quote,
    sources: [
      {
        id: "market-sina-quote",
        title: "Sina Finance quote",
        url,
        domain: "hq.sinajs.cn",
        publisher: "Sina Finance",
        sourceType: "market-data",
        retrievedAt,
        confidence: "medium",
        dateStatus: sourceDateStatus(quote.dateStatus),
        qualityReason:
          "Sina quote endpoint referenced by global-stock-data.",
        sourceRank: 4,
      },
    ],
    warnings: quote.price === undefined ? ["Sina quote returned no price."] : [],
  };
}

function chooseQuote(candidates: ProviderCandidate[]) {
  return candidates
    .map((candidate) => candidate.quote)
    .find((quote) => quote?.price !== undefined);
}

function choosePriceHistory(
  candidates: ProviderCandidate[],
  maxDailyPoints: number,
) {
  const sina = candidates.find((candidate) =>
    candidate.sources.some((source) => source.id === "market-sina-us-kline"),
  );
  const yahoo = candidates.find((candidate) =>
    candidate.sources.some((source) => source.id === "market-yahoo-chart"),
  );
  const selected = sina?.priceHistory?.length
    ? sina.priceHistory
    : yahoo?.priceHistory || [];

  return selected.slice(-maxDailyPoints);
}

function buildInferredQuote({
  input,
  latest,
  normalized,
  retrievedAt,
}: {
  input: MarketInput;
  latest: MarketPricePoint;
  normalized: NormalizedMarketTicker;
  retrievedAt: string;
}): MarketQuote {
  return {
    symbol: normalized.symbol,
    name: input.companyName?.trim(),
    provider: "global-stock-data",
    price: latest.close,
    open: latest.open,
    high: latest.high,
    low: latest.low,
    volume: latest.volume,
    currency: normalized.region === "hk" ? "HKD" : "USD",
    exchange: normalized.region === "hk" ? "HKEX" : undefined,
    marketTimestamp: latest.date,
    retrievedAt,
    dateStatus: latest.date ? "market-timestamp" : "retrieved-only",
    confidence: "medium",
  };
}

function buildPricePointFromYahoo(
  timestamp: number,
  index: number,
  quoteData: Record<string, Array<number | null> | undefined>,
): MarketPricePoint | undefined {
  const close = arrayNumberValue(quoteData.close, index);
  const open = arrayNumberValue(quoteData.open, index);
  const high = arrayNumberValue(quoteData.high, index);
  const low = arrayNumberValue(quoteData.low, index);

  if (
    close === undefined &&
    open === undefined &&
    high === undefined &&
    low === undefined
  ) {
    return undefined;
  }

  return {
    date: new Date(timestamp * 1000).toISOString().slice(0, 10),
    open,
    high,
    low,
    close,
    volume: arrayNumberValue(quoteData.volume, index),
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetchWithTimeout(url, init);
  if (!response.ok) {
    throw new Error(`Market data request failed with status ${response.status}.`);
  }
  return (await response.json()) as T;
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  const response = await fetchWithTimeout(url, init);
  if (!response.ok) {
    throw new Error(`Market data request failed with status ${response.status}.`);
  }
  return response.text();
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseDelimitedQuote(text: string, delimiter: "," | "~") {
  const match = text.match(/"(.+)"/);
  if (!match) return [];
  return match[1].split(delimiter);
}

function getYahooRange(maxDailyPoints: number) {
  if (maxDailyPoints <= 5) return "5d";
  if (maxDailyPoints <= 30) return "1mo";
  if (maxDailyPoints <= 90) return "3mo";
  return "6mo";
}

function parseTencentTimestamp(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!match) return value;
  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function sourceDateStatus(value: MarketQuote["dateStatus"]) {
  if (value === "unknown") return "unknown" as const;
  return "retrieved-only" as const;
}

function timestampToIso(value: unknown) {
  const timestamp = numberValue(value);
  if (timestamp === undefined) return undefined;
  return new Date(timestamp * 1000).toISOString();
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = numberValue(value);
    if (number !== undefined) return number;
  }
  return undefined;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number(value.replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function arrayNumberValue(values: Array<number | null> | undefined, index: number) {
  if (!values) return undefined;
  const value = values[index];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function dedupeSources(sources: EvidenceSource[]) {
  const seen = new Set<string>();

  return sources.filter((source) => {
    if (seen.has(source.id)) return false;
    seen.add(source.id);
    return true;
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
