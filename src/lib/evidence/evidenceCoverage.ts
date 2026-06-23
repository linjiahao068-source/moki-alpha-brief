import type {
  EvidenceCoverageSummary,
  EvidencePack,
  IrEvidencePack,
  MarketEvidencePack,
  ResearchEvidenceFact,
  SecEvidencePack,
} from "@/types/evidence";

export function buildEvidenceCoverage({
  searchEvidencePack,
  secEvidencePack,
  irEvidencePack,
  marketEvidencePack,
  factLedger,
}: {
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
  marketEvidencePack?: MarketEvidencePack;
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
  const hasCompanyIr = Boolean(irEvidencePack?.irItems?.length);
  const hasEarningsRelease = Boolean(
    irEvidencePack?.irItems?.some((item) =>
      /earnings-release|quarterly-results|wire-release|press-release/.test(
        item.sourceType,
      ),
    ),
  );
  const hasManagementCommentary = factLedger.some(
    (fact) => fact.factType === "management-commentary",
  );
  const hasGuidanceContext = factLedger.some(
    (fact) => fact.factType === "company-guidance-context",
  );
  const hasMarketPrice = Boolean(marketEvidencePack?.quote?.price !== undefined);
  const hasMarketVolume = Boolean(marketEvidencePack?.quote?.volume !== undefined);
  const hasMarketPriceHistory = Boolean(marketEvidencePack?.priceHistory?.length);
  const hasMarketCap = Boolean(marketEvidencePack?.quote?.marketCap !== undefined);
  const missing = ["consensus estimates"];
  const warnings: string[] = [];

  if (!hasMarketPrice) missing.unshift("real-time market price");
  if (!hasCompanyIr) missing.push("company IR narrative");
  if (!hasSearchEvidence) missing.push("recent public web context");
  if (!hasSecEvidence) missing.push("SEC companyfacts / submissions");
  if (marketEvidencePack && !hasMarketVolume) {
    warnings.push("Market evidence has no volume field.");
  }
  if (marketEvidencePack && !hasMarketPriceHistory) {
    warnings.push("Market evidence has no recent daily price history.");
  }
  if (
    marketEvidencePack?.quote &&
    !marketEvidencePack.quote.marketTimestamp &&
    marketEvidencePack.quote.dateStatus === "retrieved-only"
  ) {
    warnings.push(
      "Market evidence is retrieved-only; public quote timestamp may be delayed or unavailable.",
    );
  }
  if (hasCompanyIr && !hasEarningsRelease) {
    warnings.push("IR evidence has no earnings-release or quarterly-results item.");
  }
  if (hasCompanyIr && !hasManagementCommentary) {
    warnings.push("IR evidence has no management-commentary fact.");
  }
  if (hasCompanyIr && !hasGuidanceContext) {
    warnings.push("IR evidence has no company-guidance-context fact.");
  }
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
    hasMarketPrice,
    hasMarketVolume,
    hasMarketPriceHistory,
    hasMarketCap,
    hasConsensus: false,
    hasCompanyIr,
    hasEarningsRelease,
    hasManagementCommentary,
    hasGuidanceContext,
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
