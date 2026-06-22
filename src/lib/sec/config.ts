import type { SecConfig, SecProviderName } from "./types";

export const SEC_DEFAULT_USER_AGENT =
  "MokiAlphaBrief/0.1 contact: linjiahao068@gmail.com";

export function getSecConfig(): SecConfig {
  const requested = process.env.SEC_PROVIDER?.trim().toLowerCase();
  const provider: SecProviderName = requested === "mock" ? "mock" : "sec";
  const maxRecentFilings = Number(process.env.SEC_MAX_RECENT_FILINGS);

  return {
    provider,
    userAgent:
      process.env.SEC_USER_AGENT?.trim() || SEC_DEFAULT_USER_AGENT,
    maxRecentFilings:
      Number.isFinite(maxRecentFilings) && maxRecentFilings > 0
        ? Math.min(Math.floor(maxRecentFilings), 12)
        : 8,
  };
}
