import type { SearchResult } from "@/lib/search/types";
import type { IrInput, IrProvider } from "../types";

const COMPANY_NAMES: Record<string, string> = {
  NVDA: "NVIDIA",
  TSLA: "Tesla",
  MSFT: "Microsoft",
  ORCL: "Oracle",
  SNOW: "Snowflake",
};

export const mockIrProvider: IrProvider = {
  async search(query: string, input: IrInput): Promise<SearchResult[]> {
    const ticker = input.ticker.trim().toUpperCase();
    const companyName = input.companyName?.trim() || COMPANY_NAMES[ticker] || `${ticker} Demo Company`;
    const slug = ticker.toLowerCase().replaceAll(".", "-");

    return [
      {
        title: `Mock IR: ${companyName} quarterly results and earnings release`,
        url: `https://investor.${slug}.com/mock/quarterly-results`,
        snippet: `Mock company IR item for ${companyName}. This simulates an official quarterly results / earnings release page for Company IR Evidence Draft QA only. Query: ${query}`,
        publishedAt: "2026-06-01",
        score: 0.9,
      },
      {
        title: `Mock IR: ${companyName} guidance and management commentary`,
        url: `https://investor.${slug}.com/mock/earnings-guidance`,
        snippet: `Mock IR item describing management commentary and company guidance context. It must not be treated as consensus, real-time market price, or SEC official financial data.`,
        publishedAt: "2026-05-30",
        score: 0.84,
      },
      {
        title: `Mock wire release: ${companyName} product and business update`,
        url: `https://www.businesswire.com/mock/${slug}-business-update`,
        snippet: `Mock wire-release item for company official narrative and business-update context. This is simulated evidence, not a live wire release.`,
        publishedAt: "2026-05-22",
        score: 0.78,
      },
      {
        title: `Mock IR: ${companyName} investor presentation`,
        url: `https://investor.${slug}.com/mock/investor-presentation.pdf`,
        snippet: `Mock investor presentation search result. The system stores only this search snippet and URL; it does not download or parse PDF full text.`,
        score: 0.7,
      },
    ];
  },
};
