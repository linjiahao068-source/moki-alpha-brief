import type { MarketConfig, NormalizedMarketTicker } from "./types";

export function normalizeMarketTicker(
  ticker: string,
  region: MarketConfig["dataRegion"] = "auto",
): NormalizedMarketTicker {
  const raw = ticker.trim().toUpperCase();
  const hkMatch = raw.match(/^(\d{3,5})(?:\.HK)?$/);
  const isExplicitHk = raw.endsWith(".HK");
  const isHk =
    region === "hk" ||
    (region === "auto" && (isExplicitHk || Boolean(hkMatch && raw.includes(".HK"))));

  if (isHk && hkMatch) {
    const hkCode = hkMatch[1].padStart(4, "0");
    return {
      raw,
      symbol: `${hkCode}.HK`,
      yahooSymbol: `${hkCode}.HK`,
      region: "hk",
      hkCode: hkCode.padStart(5, "0"),
    };
  }

  return {
    raw,
    symbol: raw,
    yahooSymbol: raw,
    region: "us",
  };
}

export function normalizeTickerForStockApi(
  ticker: string,
  region: MarketConfig["dataRegion"] = "auto",
) {
  const normalized = normalizeMarketTicker(ticker, region);

  if (normalized.region === "hk") {
    return `HK${normalized.hkCode || normalized.symbol.replace(".HK", "").padStart(5, "0")}`;
  }

  const raw = normalized.raw.replaceAll(".", "-");
  if (/^US[A-Z0-9-]+$/.test(raw)) return raw;

  return `US${raw}`;
}

export function isValidMarketTicker(ticker: string) {
  return /^[A-Z0-9.-]{1,12}$/.test(ticker.trim().toUpperCase());
}
