import type { IrConfig } from "./types";

export const IR_DEFAULT_MAX_RESULTS = 5;

export function getIrConfig(): IrConfig {
  const requested = process.env.IR_PROVIDER?.trim().toLowerCase();
  const provider = requested === "mock" ? "mock" : "search";
  const maxResults = Number(process.env.IR_MAX_RESULTS);
  const depth =
    process.env.TAVILY_SEARCH_DEPTH === "advanced" ? "advanced" : "basic";

  return {
    provider,
    maxResults:
      Number.isFinite(maxResults) && maxResults > 0
        ? Math.min(Math.floor(maxResults), IR_DEFAULT_MAX_RESULTS)
        : IR_DEFAULT_MAX_RESULTS,
    tavilyApiKey: process.env.TAVILY_API_KEY?.trim(),
    tavilySearchDepth: depth,
  };
}

export function getIrConfigIssue(config = getIrConfig()) {
  if (config.provider !== "search") return undefined;
  if (!config.tavilyApiKey) return "Missing TAVILY_API_KEY for IR_PROVIDER=search";
  return undefined;
}
