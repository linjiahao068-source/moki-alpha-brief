import type {
  EvidenceNewsItem,
  EvidencePack,
  ResearchEvidenceFact,
  SecEvidencePack,
  SecFiscalFact,
  SecFilingSummary,
} from "@/types/evidence";
import { getSearchSourceId, getSecSourceId } from "./sourceRegistry";

export function buildFactLedger({
  searchEvidencePack,
  secEvidencePack,
}: {
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
}): ResearchEvidenceFact[] {
  return [
    ...buildSecFinancialFacts(secEvidencePack),
    ...buildSecFilingFacts(secEvidencePack),
    ...buildSearchFacts(searchEvidencePack),
  ];
}

function buildSecFinancialFacts(secEvidencePack?: SecEvidencePack) {
  if (!secEvidencePack) return [];

  return secEvidencePack.fiscalFacts.map((fact, index) =>
    secFiscalFactToLedgerFact(fact, index, secEvidencePack.provider),
  );
}

function secFiscalFactToLedgerFact(
  fact: SecFiscalFact,
  index: number,
  provider: SecEvidencePack["provider"],
): ResearchEvidenceFact {
  return {
    id: `sec-financial-${index + 1}-${slugify(fact.concept)}`,
    factType: "official-financial",
    sourceKind: provider === "mock" ? "mock" : "sec",
    sourceId: getSecSourceId("sec-companyfacts"),
    label: fact.label || fact.concept,
    value: fact.value,
    unit: fact.unit,
    period: fact.periodEnd || fact.frame || [fact.fy, fact.fp].filter(Boolean).join(" "),
    filed: fact.filed,
    form: fact.form,
    concept: fact.concept,
    confidence: "high",
    allowedUse: "financial-analysis",
    note: "Official financial fact from SEC companyfacts. Do not mix with search snippets.",
  };
}

function buildSecFilingFacts(secEvidencePack?: SecEvidencePack) {
  if (!secEvidencePack) return [];

  return secEvidencePack.recentFilings.map((filing, index) =>
    secFilingToLedgerFact(filing, index, secEvidencePack.provider),
  );
}

function secFilingToLedgerFact(
  filing: SecFilingSummary,
  index: number,
  provider: SecEvidencePack["provider"],
): ResearchEvidenceFact {
  return {
    id: `sec-filing-${index + 1}-${slugify(filing.form)}`,
    factType: "filing-metadata",
    sourceKind: provider === "mock" ? "mock" : "sec",
    sourceId: getSecSourceId("sec-submissions"),
    label: `${filing.form} filed ${filing.filingDate}`,
    value: filing.accessionNumber,
    period: filing.reportDate,
    filed: filing.filingDate,
    form: filing.form,
    confidence: "high",
    allowedUse: "context-only",
    note: filing.description || "SEC submissions filing metadata.",
  };
}

function buildSearchFacts(searchEvidencePack?: EvidencePack) {
  if (!searchEvidencePack?.newsItems?.length) return [];

  return searchEvidencePack.newsItems.map((item, index) =>
    searchItemToLedgerFact(item, index, searchEvidencePack.searchProvider),
  );
}

function searchItemToLedgerFact(
  item: EvidenceNewsItem,
  index: number,
  provider: EvidencePack["searchProvider"],
): ResearchEvidenceFact {
  const confidence = item.confidence || "low";
  const sourceKind = provider === "mock" ? "mock" : "search";
  const factType = getSearchFactType(item);

  return {
    id: `search-${factType}-${index + 1}`,
    factType,
    sourceKind,
    sourceId: getSearchSourceId(item.sourceId || item.id),
    label: item.title,
    value: truncate(item.snippet, 360),
    period: item.publishedAt || item.retrievedAt,
    confidence,
    allowedUse: getAllowedUse(item, confidence),
    note:
      confidence === "low"
        ? "Low-confidence search item. Use only as market discussion context, not as a fact base."
        : "Search evidence draft item. Use for recent developments, catalysts, or risk context only.",
  };
}

function getSearchFactType(item: EvidenceNewsItem): ResearchEvidenceFact["factType"] {
  if (item.confidence === "low") return "market-discussion";
  if (item.theme === "risk") return "risk-catalyst";
  if (item.theme === "catalyst" || item.theme === "company-update") {
    return "recent-development";
  }
  return "market-discussion";
}

function getAllowedUse(
  item: EvidenceNewsItem,
  confidence: "high" | "medium" | "low",
): ResearchEvidenceFact["allowedUse"] {
  if (confidence === "low") return "context-only";
  if (item.theme === "risk") return "risk-catalyst";
  return "recent-developments";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}
