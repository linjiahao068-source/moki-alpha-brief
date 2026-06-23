import type {
  EvidenceConfidence,
  EvidenceSource,
  IrAllowedUse,
  IrEvidenceItem,
  IrEvidenceSourceType,
  IrEvidenceTheme,
} from "@/types/evidence";
import {
  classifySourceDomain,
  getDomain,
  type RankedSearchResult,
} from "@/lib/search/sourceQuality";
import type { SearchResult } from "@/lib/search/types";

type IrClassifiedResult = SearchResult | RankedSearchResult;

export function searchResultToIrItem({
  id,
  result,
  retrievedAt,
}: {
  id: string;
  result: IrClassifiedResult;
  retrievedAt: string;
}): IrEvidenceItem {
  const domain = "domain" in result ? result.domain : getDomain(result.url);
  const domainClass = classifySourceDomain(domain);
  const title = cleanText(result.title) || "Untitled company IR item";
  const snippet =
    cleanText(result.snippet || result.content) ||
    "IR search result snippet unavailable; use as weak company narrative context only.";
  const text = `${title} ${snippet}`.toLowerCase();
  const sourceType = inferIrSourceType(text, domain);
  const confidence = inferIrConfidence(domain, sourceType, domainClass.confidence);
  const theme = inferIrTheme(text);

  return {
    id,
    title,
    url: result.url,
    domain,
    publisher: domain,
    sourceType,
    publishedAt: result.publishedAt,
    retrievedAt,
    dateStatus: result.publishedAt
      ? "published"
      : result.url || result.title
        ? "retrieved-only"
        : "unknown",
    snippet: truncateSnippet(snippet),
    confidence,
    theme,
    allowedUse: inferAllowedUse(theme, sourceType, confidence),
  };
}

export function irItemToEvidenceSource(
  item: IrEvidenceItem,
  index: number,
): EvidenceSource {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    domain: item.domain,
    publisher: item.publisher,
    sourceType: item.sourceType,
    publishedAt: item.publishedAt,
    retrievedAt: item.retrievedAt,
    confidence: item.confidence,
    dateStatus: item.dateStatus,
    qualityReason: getQualityReason(item),
    sourceRank: index + 1,
  };
}

function inferIrSourceType(
  text: string,
  domain?: string,
): IrEvidenceSourceType {
  const host = domain || "";

  if (/shareholder letter|letter to shareholders/.test(text)) {
    return "shareholder-letter";
  }
  if (/investor presentation|presentation|slides?/.test(text)) {
    return "investor-presentation";
  }
  if (/quarterly results|quarterly financial results|financial results/.test(text)) {
    return "quarterly-results";
  }
  if (/earnings release|earnings results|quarterly earnings/.test(text)) {
    return "earnings-release";
  }
  if (/businesswire|prnewswire/.test(host)) return "wire-release";
  if (/press release|news release/.test(text)) return "press-release";
  if (/^(investor|investors|ir)\./.test(host)) return "company-ir";
  if (/investor-relations|investorrelations|\/ir\/|\/investors?\//.test(host)) {
    return "company-ir";
  }
  if (host && !isAggregatorDomain(host)) return "official-web";
  return "other";
}

function inferIrTheme(text: string): IrEvidenceTheme {
  if (/guidance|outlook|forecast/.test(text)) return "guidance";
  if (/capital allocation|buyback|repurchase|dividend/.test(text)) {
    return "capital-allocation";
  }
  if (/risk|uncertain|headwind|regulation|supply chain/.test(text)) {
    return "risk-disclosure";
  }
  if (/product|launch|platform|customer|demand|data center|ai/.test(text)) {
    return "product-update";
  }
  if (/revenue|margin|income|eps|cash flow|quarterly|financial/.test(text)) {
    return "financial-commentary";
  }
  if (/management|ceo|cfo|commentary|strategy/.test(text)) {
    return "management-commentary";
  }
  return "other";
}

function inferAllowedUse(
  theme: IrEvidenceTheme,
  sourceType: IrEvidenceSourceType,
  confidence: EvidenceConfidence,
): IrAllowedUse {
  if (theme === "guidance") return "company-guidance-context";
  if (confidence === "low") return "context-only";
  if (
    theme === "product-update" ||
    theme === "financial-commentary" ||
    theme === "capital-allocation" ||
    sourceType === "quarterly-results" ||
    sourceType === "earnings-release"
  ) {
    return "business-update";
  }
  if (theme === "management-commentary") return "management-commentary";
  return "context-only";
}

function inferIrConfidence(
  domain: string | undefined,
  sourceType: IrEvidenceSourceType,
  baseConfidence: EvidenceConfidence,
): EvidenceConfidence {
  const host = domain || "";

  if (
    sourceType === "company-ir" ||
    /^(investor|investors|ir)\./.test(host) ||
    /investor-relations|investorrelations/.test(host)
  ) {
    return "high";
  }
  if (/businesswire|prnewswire/.test(host)) return "high";
  if (isAggregatorDomain(host)) return "low";
  if (baseConfidence === "high" && sourceType === "official-web") return "medium";
  return baseConfidence;
}

function getQualityReason(item: IrEvidenceItem) {
  if (item.confidence === "high") {
    return "Company IR, official web, or wire-release evidence draft source.";
  }
  if (item.confidence === "medium") {
    return "Public web or financial media item; use as IR context only.";
  }
  return "Low-confidence or aggregator item; use only as weak context.";
}

function isAggregatorDomain(domain: string) {
  return /(reddit|stocktwits|twitter|x\.com|perplexity|quora|youtube|tiktok|medium|substack|forum)/i.test(
    domain,
  );
}

function cleanText(value?: string) {
  return value?.replace(/\s+/g, " ").trim();
}

function truncateSnippet(value: string, limit = 520) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trim()}...`;
}
