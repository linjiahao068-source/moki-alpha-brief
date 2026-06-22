import type {
  EvidenceNewsItem,
  EvidencePack,
  EvidenceQuery,
  EvidenceQueryPurpose,
  EvidenceSource,
  EvidenceSourceType,
  EvidenceTheme,
} from "@/types/evidence";
import { getSearchConfig, getSearchConfigIssue } from "./config";
import { mockSearchProvider } from "./providers/mockSearchProvider";
import { createTavilySearchProvider } from "./providers/tavilySearchProvider";
import type {
  SearchEvidenceResult,
  SearchInput,
  SearchProvider,
  SearchResult,
} from "./types";

const MAX_EVIDENCE_ITEMS = 10;

export async function buildSearchEvidencePack(
  input: SearchInput,
): Promise<SearchEvidenceResult> {
  const config = getSearchConfig();
  const ticker = input.ticker.trim().toUpperCase();
  const querySet = buildEvidenceQueries(ticker, input.companyName);
  const configIssue = getSearchConfigIssue(config);

  if (config.provider === "mock" || configIssue) {
    const result = await collectEvidence({
      input,
      provider: mockSearchProvider,
      providerName: "mock",
      querySet,
      warnings: [
        configIssue || "Using mock search evidence; no live web search was run.",
      ],
    });

    return {
      ...result,
      isFallback: Boolean(configIssue),
      error: configIssue,
    };
  }

  try {
    return await collectEvidence({
      input,
      provider: createTavilySearchProvider(config),
      providerName: "tavily",
      querySet,
      warnings: [],
    });
  } catch (error) {
    console.error("Search evidence provider error", {
      provider: "tavily",
      hasApiKey: Boolean(process.env.TAVILY_API_KEY),
      error: {
        name: getErrorField(error, "name") || "Error",
        message: getErrorField(error, "message") || "Tavily request failed",
      },
    });

    const reason = getSafeSearchError(error);
    const fallback = await collectEvidence({
      input,
      provider: mockSearchProvider,
      providerName: "mock",
      querySet,
      warnings: [reason, "Fell back to mock search evidence."],
    });

    return {
      ...fallback,
      isFallback: true,
      error: reason,
    };
  }
}

function buildEvidenceQueries(
  ticker: string,
  companyName?: string,
): EvidenceQuery[] {
  const name = companyName?.trim() || ticker;

  return [
    {
      id: "recent-news",
      query: `${ticker} latest news earnings guidance AI data center`,
      purpose: "recent-news",
    },
    {
      id: "company-ir",
      query: `${name} investor relations earnings release guidance`,
      purpose: "company-ir",
    },
    {
      id: "risk-catalyst",
      query: `${ticker} risks catalysts regulation supply chain demand`,
      purpose: "risk-catalyst",
    },
  ];
}

async function collectEvidence({
  input,
  provider,
  providerName,
  querySet,
  warnings,
}: {
  input: SearchInput;
  provider: SearchProvider;
  providerName: "mock" | "tavily";
  querySet: EvidenceQuery[];
  warnings: string[];
}): Promise<SearchEvidenceResult> {
  const ticker = input.ticker.trim().toUpperCase();
  const retrievedAt = formatCstTimestamp();
  const results: Array<{
    query: EvidenceQuery;
    result: SearchResult;
  }> = [];

  for (const query of querySet) {
    const queryResults = await provider.search(query.query, {
      ...input,
      maxResults: Math.min(input.maxResults || 5, 5),
    });

    for (const result of queryResults.slice(0, 5)) {
      results.push({ query, result });
    }
  }

  const seen = new Set<string>();
  const selected = results
    .filter(({ result }) => {
      const key = normalizeUrl(result.url) || result.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, Math.min(input.maxResults || 5, MAX_EVIDENCE_ITEMS));

  const sources: EvidenceSource[] = [];
  const newsItems: EvidenceNewsItem[] = [];

  selected.forEach(({ query, result }, index) => {
    const id = `src-${index + 1}`;
    const publisher = inferPublisher(result.url);
    const sourceType = inferSourceType(query.purpose, result.url);
    const confidence = inferConfidence(result.url, sourceType);
    const snippet =
      result.snippet ||
      result.content ||
      "Search result snippet unavailable; use as weak context only.";

    sources.push({
      id,
      title: result.title || "Untitled search result",
      url: result.url,
      publisher,
      sourceType,
      publishedAt: result.publishedAt,
      retrievedAt,
      confidence,
    });

    newsItems.push({
      id: `news-${index + 1}`,
      title: result.title || "Untitled search result",
      url: result.url,
      publisher,
      publishedAt: result.publishedAt,
      retrievedAt,
      snippet,
      relevance: confidence === "high" ? "high" : "medium",
      theme: inferTheme(query.purpose),
      sourceId: id,
    });
  });

  const evidenceWarnings = [...warnings];
  if (providerName === "mock") {
    evidenceWarnings.push(
      "Mock Search Evidence: results are simulated and not live web search.",
    );
  }
  if (newsItems.length < 3) {
    evidenceWarnings.push("EvidencePack has fewer than 3 source items.");
  }

  const evidencePack: EvidencePack = {
    asOf: retrievedAt,
    ticker,
    companyName: input.companyName?.trim(),
    dataMode: "evidence-draft",
    searchProvider: providerName,
    querySet,
    sources,
    newsItems,
    warnings: evidenceWarnings,
  };

  return {
    ok: true,
    provider: providerName,
    evidencePack,
    warnings: evidenceWarnings,
  };
}

function inferSourceType(
  purpose: EvidenceQueryPurpose,
  url?: string,
): EvidenceSourceType {
  const normalized = (url || "").toLowerCase();
  if (purpose === "company-ir" || /investor|ir\.|\/ir\//.test(normalized)) {
    return "company-ir";
  }
  if (/bloomberg|reuters|cnbc|marketwatch|barrons|wsj|financialtimes|ft\.com/.test(normalized)) {
    return "news";
  }
  if (/seekingalpha|fool|investing|marketbeat/.test(normalized)) {
    return "market-commentary";
  }
  return "web";
}

function inferConfidence(url: string | undefined, sourceType: EvidenceSourceType) {
  const normalized = (url || "").toLowerCase();
  if (/sec\.gov|investor|nvidia\.com|apple\.com|microsoft\.com|alphabet\.com/.test(normalized)) {
    return "high";
  }
  if (sourceType === "news" || sourceType === "company-ir") return "medium";
  if (sourceType === "market-commentary") return "medium";
  return "low";
}

function inferTheme(purpose: EvidenceQueryPurpose): EvidenceTheme {
  if (purpose === "risk-catalyst") return "risk";
  if (purpose === "company-ir") return "company-update";
  if (purpose === "industry-context") return "industry";
  return "catalyst";
}

function inferPublisher(url?: string) {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return undefined;
  }
}

function normalizeUrl(url?: string) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function getSafeSearchError(error: unknown) {
  const message = getErrorField(error, "message");
  if (typeof message === "string" && message.includes("Missing TAVILY_API_KEY")) {
    return "Missing TAVILY_API_KEY";
  }
  if (typeof message === "string" && message.includes("status")) {
    return message;
  }
  return "Search provider request failed";
}

function getErrorField(error: unknown, field: string) {
  if (!error || typeof error !== "object") return undefined;
  return (error as Record<string, unknown>)[field];
}

function formatCstTimestamp() {
  const value = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return `${value} CST`;
}
