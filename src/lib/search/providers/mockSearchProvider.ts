import type { SearchInput, SearchProvider, SearchResult } from "../types";

export const mockSearchProvider: SearchProvider = {
  async search(query: string, input: SearchInput): Promise<SearchResult[]> {
    const ticker = input.ticker.trim().toUpperCase();
    const companyName = input.companyName?.trim() || `${ticker} Demo Company`;

    return [
      {
        title: `Mock search result: ${ticker} recent AI and data center update`,
        url: `https://example.com/mock/${ticker.toLowerCase()}-recent-update`,
        snippet: `模拟搜索结果：${companyName} 的近期公开内容可用于演示 catalysts 与 demand discussion，但不是实时核验来源。Query: ${query}`,
        publishedAt: "2026-06-01",
        score: 0.82,
      },
      {
        title: `Mock search result: ${ticker} investor relations context`,
        url: `https://example.com/mock/${ticker.toLowerCase()}-ir-context`,
        snippet: `模拟搜索结果：该条代表投资者关系或 earnings release 相关线索，仅用于 Search Evidence Draft UI 验证。`,
        publishedAt: "2026-05-28",
        score: 0.74,
      },
      {
        title: `Mock search result: ${ticker} risk and catalyst watch`,
        url: `https://example.com/mock/${ticker.toLowerCase()}-risk-catalyst`,
        snippet: `模拟搜索结果：该条代表供应链、监管、需求节奏等风险催化线索，不能视为真实新闻检索。`,
        publishedAt: "2026-05-20",
        score: 0.69,
      },
    ];
  },
};
