import "server-only";

import type { SearchConfig } from "../config";
import type { SearchInput, SearchProvider, SearchResult } from "../types";

const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

type TavilySearchResponse = {
  results?: Array<{
    title?: string;
    url?: string;
    content?: string;
    raw_content?: string;
    published_date?: string;
    score?: number;
  }>;
};

export function createTavilySearchProvider(
  config: SearchConfig,
): SearchProvider {
  return {
    async search(query: string, input: SearchInput): Promise<SearchResult[]> {
      if (!config.tavilyApiKey) {
        throw new Error("Missing TAVILY_API_KEY");
      }

      const response = await fetch(TAVILY_SEARCH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: config.tavilyApiKey,
          query,
          search_depth: input.searchDepth || config.tavilySearchDepth,
          max_results: Math.min(input.maxResults || config.tavilyMaxResults, 10),
          include_answer: false,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search failed with status ${response.status}`);
      }

      const payload = (await response.json()) as TavilySearchResponse;

      return (payload.results || [])
        .map((item): SearchResult => {
          const title = cleanText(item.title) || "Untitled Tavily result";
          const content = cleanText(item.content || item.raw_content);

          return {
            title,
            url: item.url,
            content,
            snippet: content,
            publishedAt: item.published_date,
            score: typeof item.score === "number" ? item.score : undefined,
            rawSource: {
              hasRawContent: Boolean(item.raw_content),
            },
          };
        })
        .filter((item) => item.title || item.url || item.snippet);
    },
  };
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return undefined;
  return value.replace(/\s+/g, " ").trim();
}
