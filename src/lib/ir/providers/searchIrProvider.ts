import "server-only";

import { createTavilySearchProvider } from "@/lib/search/providers/tavilySearchProvider";
import type { SearchConfig } from "@/lib/search/config";
import type { IrConfig } from "../types";
import type { IrProvider } from "../types";

export function createSearchIrProvider(config: IrConfig): IrProvider {
  const searchConfig: SearchConfig = {
    provider: "tavily",
    tavilyApiKey: config.tavilyApiKey,
    tavilyMaxResults: config.maxResults,
    tavilySearchDepth: config.tavilySearchDepth,
  };
  const tavilyProvider = createTavilySearchProvider(searchConfig);

  return {
    search(query, input) {
      return tavilyProvider.search(query, {
        ticker: input.ticker,
        companyName: input.companyName,
        maxResults: Math.min(input.maxResults || config.maxResults, 5),
        searchDepth: config.tavilySearchDepth,
      });
    },
  };
}
