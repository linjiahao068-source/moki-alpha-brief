import type { SearchInput, SearchProvider, SearchResult } from "../types";

export const mockSearchProvider: SearchProvider = {
  async search(query: string, input: SearchInput): Promise<SearchResult[]> {
    const ticker = input.ticker.trim().toUpperCase();
    const companyName = input.companyName?.trim() || `${ticker} Demo Company`;
    const slug = ticker.toLowerCase().replaceAll(".", "-");

    return [
      {
        title: `Mock search result: ${ticker} official investor update context`,
        url: `https://investor.nvidia.com/mock/${slug}-ir-context`,
        snippet: `Mock search result for ${companyName}. This simulated item represents an investor-relations style update for Search Evidence Draft QA only. It is not live web evidence. Query: ${query}`,
        publishedAt: "2026-06-01",
        score: 0.86,
      },
      {
        title: `Mock search result: ${ticker} Reuters-style industry catalyst note`,
        url: `https://www.reuters.com/mock/${slug}-industry-catalyst`,
        snippet: `Mock search result for ${companyName}. This simulated item stands in for a higher-confidence news source discussing demand, supply chain, or product-cycle catalysts. It is not verified real data.`,
        publishedAt: "2026-05-28",
        score: 0.78,
      },
      {
        title: `Mock search result: ${ticker} market commentary watch item`,
        url: `https://finance.yahoo.com/mock/${slug}-market-commentary`,
        snippet: `Mock search result for ${companyName}. This simulated market commentary source is useful for UI and prompt testing, but should remain evidence-draft only.`,
        score: 0.66,
      },
      {
        title: `Mock search result: ${ticker} discussion-source risk chatter`,
        url: `https://www.reddit.com/mock/${slug}-risk-discussion`,
        snippet: `Mock search result for ${companyName}. This simulated low-confidence discussion source is included to verify that the UI labels forum or aggregator-style sources correctly.`,
        score: 0.35,
      },
    ];
  },
};
