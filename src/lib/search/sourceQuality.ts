import type {
  EvidenceConfidence,
  EvidenceSourceType,
} from "@/types/evidence";
import type { SearchResult } from "./types";

export type SearchDateStatus = "published" | "retrieved-only" | "unknown";

export type SourceDomainClass = {
  confidence: EvidenceConfidence;
  sourceType: EvidenceSourceType;
  qualityReason: string;
  score: number;
};

export type RankedSearchResult = SearchResult & {
  normalizedUrl?: string;
  domain?: string;
  confidence: EvidenceConfidence;
  dateStatus: SearchDateStatus;
  qualityReason: string;
  sourceRank: number;
  sourceType: EvidenceSourceType;
  qualityScore: number;
};

const HIGH_CONFIDENCE_DOMAINS = new Set([
  "sec.gov",
  "investor.nvidia.com",
  "nvidia.com",
  "reuters.com",
  "apnews.com",
  "cnbc.com",
  "bloomberg.com",
  "wsj.com",
  "ft.com",
  "barrons.com",
  "marketwatch.com",
  "nasdaq.com",
  "businesswire.com",
  "prnewswire.com",
]);

const MEDIUM_CONFIDENCE_DOMAINS = new Set([
  "yahoo.com",
  "finance.yahoo.com",
  "seekingalpha.com",
  "fool.com",
  "investing.com",
  "tradingview.com",
  "stockstory.org",
  "morningstar.com",
]);

const LOW_CONFIDENCE_DOMAINS = new Set([
  "reddit.com",
  "x.com",
  "twitter.com",
  "stocktwits.com",
  "medium.com",
  "substack.com",
  "quora.com",
  "youtube.com",
  "tiktok.com",
  "perplexity.ai",
]);

const DISCUSSION_OR_AGGREGATOR_PATTERN =
  /(forum|forums|reddit|stocktwits|twitter|x\.com|perplexity|quora|youtube|tiktok|substack|medium)/i;

export function normalizeUrl(url?: string) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    parsed.hash = "";

    for (const param of Array.from(parsed.searchParams.keys())) {
      if (
        /^utm_/i.test(param) ||
        ["fbclid", "gclid", "mc_cid", "mc_eid", "ref"].includes(
          param.toLowerCase(),
        )
      ) {
        parsed.searchParams.delete(param);
      }
    }

    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const next = parsed.toString().replace(/\/$/, "");
    return next.toLowerCase();
  } catch {
    return url.trim().toLowerCase().replace(/\/$/, "") || undefined;
  }
}

export function getDomain(url?: string) {
  if (!url) return undefined;

  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    const match = url.toLowerCase().match(/^(?:https?:\/\/)?([^/?#]+)/);
    return match?.[1]?.replace(/^www\./, "");
  }
}

export function classifySourceDomain(domain?: string): SourceDomainClass {
  if (!domain) {
    return {
      confidence: "low",
      sourceType: "web",
      qualityReason: "Unknown domain; treat as low-confidence web context.",
      score: 10,
    };
  }

  if (matchesDomain(domain, HIGH_CONFIDENCE_DOMAINS)) {
    return {
      confidence: "high",
      sourceType: inferSourceTypeFromDomain(domain, "high"),
      qualityReason: "High-confidence official, wire, or established financial source.",
      score: 90,
    };
  }

  if (/^(investor|investors|ir)\./.test(domain)) {
    return {
      confidence: "high",
      sourceType: "company-ir",
      qualityReason: "High-confidence company investor-relations subdomain.",
      score: 86,
    };
  }

  if (matchesDomain(domain, MEDIUM_CONFIDENCE_DOMAINS)) {
    return {
      confidence: "medium",
      sourceType: inferSourceTypeFromDomain(domain, "medium"),
      qualityReason: "Medium-confidence financial media or market commentary source.",
      score: 60,
    };
  }

  if (
    matchesDomain(domain, LOW_CONFIDENCE_DOMAINS) ||
    DISCUSSION_OR_AGGREGATOR_PATTERN.test(domain)
  ) {
    return {
      confidence: "low",
      sourceType: "web",
      qualityReason: "Low confidence / discussion or aggregator source.",
      score: 20,
    };
  }

  return {
    confidence: "medium",
    sourceType: "web",
    qualityReason: "Unlisted web source; use as draft context until reviewed.",
    score: 45,
  };
}

export function scoreSearchResult(result: SearchResult): RankedSearchResult {
  const normalizedUrl = normalizeUrl(result.url);
  const domain = getDomain(result.url);
  const domainClass = classifySourceDomain(domain);
  const dateStatus: SearchDateStatus = result.publishedAt
    ? "published"
    : result.url || result.title
      ? "retrieved-only"
      : "unknown";
  const tavilyScore =
    typeof result.score === "number" ? Math.max(0, Math.min(result.score, 1)) : 0;
  const hasSnippet = Boolean((result.snippet || result.content || "").trim());
  const hasTitle = Boolean(result.title?.trim());
  const qualityScore =
    domainClass.score + tavilyScore * 10 + (hasSnippet ? 4 : 0) + (hasTitle ? 2 : 0);

  return {
    ...result,
    normalizedUrl,
    domain,
    confidence: domainClass.confidence,
    dateStatus,
    qualityReason: domainClass.qualityReason,
    sourceRank: 0,
    sourceType: domainClass.sourceType,
    qualityScore,
  };
}

export function dedupeSearchResults(results: SearchResult[]) {
  const selected: SearchResult[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  for (const result of results) {
    const normalizedUrl = normalizeUrl(result.url);
    const titleKey = normalizeTitle(result.title);

    if (normalizedUrl && seenUrls.has(normalizedUrl)) continue;
    if (titleKey && seenTitles.has(titleKey)) continue;

    if (normalizedUrl) seenUrls.add(normalizedUrl);
    if (titleKey) seenTitles.add(titleKey);
    selected.push(result);
  }

  return selected;
}

export function filterAndRankSearchResults(
  results: SearchResult[],
  maxResults = 5,
): RankedSearchResult[] {
  const deduped = dedupeSearchResults(results);
  const ranked = deduped
    .map(scoreSearchResult)
    .sort((left, right) => right.qualityScore - left.qualityScore);

  const domainCounts = new Map<string, number>();
  const cappedByDomain = ranked.filter((result) => {
    const domain = result.domain || "unknown";
    const nextCount = (domainCounts.get(domain) || 0) + 1;
    if (nextCount > 2) return false;
    domainCounts.set(domain, nextCount);
    return true;
  });

  const highOrMedium = cappedByDomain.filter(
    (result) => result.confidence !== "low",
  );
  const low = cappedByDomain.filter((result) => result.confidence === "low");
  const lowLimit = highOrMedium.length >= Math.min(maxResults, 3) ? 1 : 2;
  const selected = [...highOrMedium, ...low.slice(0, lowLimit)]
    .slice(0, maxResults)
    .map((result, index) => ({
      ...result,
      sourceRank: index + 1,
    }));

  return selected;
}

function matchesDomain(domain: string, domains: Set<string>) {
  return Array.from(domains).some(
    (candidate) => domain === candidate || domain.endsWith(`.${candidate}`),
  );
}

function inferSourceTypeFromDomain(
  domain: string,
  confidence: EvidenceConfidence,
): EvidenceSourceType {
  if (/sec\.gov$/.test(domain)) return "sec";
  if (/investor|ir\.|businesswire|prnewswire/.test(domain)) {
    return "company-ir";
  }
  if (
    /(reuters|apnews|cnbc|bloomberg|wsj|ft\.com|barrons|marketwatch|nasdaq)/.test(
      domain,
    )
  ) {
    return "news";
  }
  if (confidence === "medium") return "market-commentary";
  return "web";
}

function normalizeTitle(title?: string) {
  if (!title) return undefined;
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.length > 12 ? normalized.slice(0, 120) : undefined;
}
