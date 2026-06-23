import type { MarketConfig } from "./types";

export const MARKET_DEFAULT_MAX_DAILY_POINTS = 30;

export function getMarketConfig(): MarketConfig {
  const requested = process.env.MARKET_PROVIDER?.trim().toLowerCase();
  const provider =
    requested === "mock" ? "mock" : "global-stock-data";
  const maxDailyPoints = Number(process.env.MARKET_MAX_DAILY_POINTS);
  const requestedRegion = process.env.MARKET_DATA_REGION?.trim().toLowerCase();
  const dataRegion =
    requestedRegion === "us" || requestedRegion === "hk"
      ? requestedRegion
      : "auto";

  return {
    provider,
    maxDailyPoints:
      Number.isFinite(maxDailyPoints) && maxDailyPoints > 0
        ? Math.min(Math.floor(maxDailyPoints), 120)
        : MARKET_DEFAULT_MAX_DAILY_POINTS,
    dataRegion,
  };
}
