import type { SearchDepth } from "./types";

export const TAVILY_DEFAULT_SEARCH_DEPTH: SearchDepth = "basic";
export const TAVILY_DEFAULT_MAX_RESULTS = 5;

export type SearchConfig = {
  provider: "mock" | "tavily";
  tavilyApiKey?: string;
  tavilySearchDepth: SearchDepth;
  tavilyMaxResults: number;
};

export function getSearchConfig(): SearchConfig {
  const provider = process.env.SEARCH_PROVIDER === "tavily" ? "tavily" : "mock";
  const depth =
    process.env.TAVILY_SEARCH_DEPTH === "advanced" ? "advanced" : "basic";
  const maxResults = Number(process.env.TAVILY_MAX_RESULTS);

  return {
    provider,
    tavilyApiKey: process.env.TAVILY_API_KEY?.trim(),
    tavilySearchDepth: depth,
    tavilyMaxResults:
      Number.isFinite(maxResults) && maxResults > 0
        ? Math.min(Math.floor(maxResults), 10)
        : TAVILY_DEFAULT_MAX_RESULTS,
  };
}

export function getSearchConfigIssue(config = getSearchConfig()) {
  if (config.provider !== "tavily") return undefined;
  if (!config.tavilyApiKey) return "Missing TAVILY_API_KEY";
  return undefined;
}
