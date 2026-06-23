import type {
  EvidenceCoverageSummary,
  EvidencePack,
  ResearchEvidenceFact,
  SecEvidencePack,
} from "@/types/evidence";

export function buildEvidenceCoverage({
  searchEvidencePack,
  secEvidencePack,
  factLedger,
}: {
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  factLedger: ResearchEvidenceFact[];
}): EvidenceCoverageSummary {
  const hasSearchEvidence = Boolean(searchEvidencePack?.newsItems?.length);
  const hasSecEvidence = Boolean(secEvidencePack);
  const hasRecentFilings = Boolean(secEvidencePack?.recentFilings.length);
  const hasFiscalFacts = Boolean(secEvidencePack?.fiscalFacts.length);
  const hasRevenueFact = hasConceptLike(factLedger, /revenue|sales/i);
  const hasNetIncomeFact = hasConceptLike(factLedger, /netincome|net income/i);
  const hasEpsFact = hasConceptLike(
    factLedger,
    /earningspershare|earnings per share|eps/i,
  );
  const missing = [
    "real-time market price",
    "consensus estimates",
    "company IR narrative",
  ];
  const warnings: string[] = [];

  if (!hasSearchEvidence) missing.push("recent public web context");
  if (!hasSecEvidence) missing.push("SEC companyfacts / submissions");
  if (hasSecEvidence && !hasRecentFilings) {
    missing.push("recent SEC filings metadata");
    warnings.push("SEC evidence has no recent filings.");
  }
  if (hasSecEvidence && !hasFiscalFacts) {
    missing.push("SEC fiscal facts");
    warnings.push("SEC evidence has no fiscal facts.");
  }
  if (hasSecEvidence && !hasRevenueFact) {
    missing.push("SEC revenue fact");
    warnings.push("Revenue fact was not extracted from SEC companyfacts.");
  }
  if (hasSecEvidence && !hasNetIncomeFact) {
    missing.push("SEC net income fact");
    warnings.push("Net income fact was not extracted from SEC companyfacts.");
  }
  if (hasSecEvidence && !hasEpsFact) {
    missing.push("SEC EPS fact");
    warnings.push("EPS fact was not extracted from SEC companyfacts.");
  }

  return {
    hasSearchEvidence,
    hasSecEvidence,
    hasRecentFilings,
    hasFiscalFacts,
    hasRevenueFact,
    hasNetIncomeFact,
    hasEpsFact,
    hasMarketPrice: false,
    hasConsensus: false,
    hasCompanyIr: false,
    missing,
    warnings,
  };
}

function hasConceptLike(facts: ResearchEvidenceFact[], pattern: RegExp) {
  return facts.some(
    (fact) =>
      fact.factType === "official-financial" &&
      pattern.test(`${fact.concept || ""} ${fact.label || ""}`),
  );
}
