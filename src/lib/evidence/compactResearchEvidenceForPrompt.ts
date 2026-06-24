import type {
  ResearchEvidenceContext,
  ResearchEvidenceFact,
  ResearchEvidenceSource,
} from "@/types/evidence";
import { compactConsensusEvidenceForPrompt } from "@/lib/consensus/compactConsensusEvidenceForPrompt";
import { compactMarketEvidenceForPrompt } from "@/lib/market/compactMarketEvidenceForPrompt";

export function compactResearchEvidenceForPrompt(
  context: ResearchEvidenceContext,
) {
  const factLedger = selectFactsForPrompt(context.factLedger);

  return {
    asOf: context.asOf,
    ticker: context.ticker,
    companyName: context.companyName,
    dataMode: context.dataMode,
    evidenceLevel: context.evidenceLevel,
    coverage: context.coverage,
    warnings: (context.warnings || []).slice(0, 5),
    sourceRegistry: context.sourceRegistry.slice(0, 8).map(compactSource),
    factLedger: factLedger.map(compactFact),
    marketEvidence: compactMarketEvidenceForPrompt(context.marketEvidencePack),
    consensusEvidence: compactConsensusEvidenceForPrompt(
      context.consensusEvidencePack,
    ),
  };
}

function compactSource(source: ResearchEvidenceSource) {
  return {
    id: source.id,
    sourceKind: source.sourceKind,
    sourceType: source.sourceType,
    title: source.title,
    url: source.url,
    domain: source.domain,
    publisher: source.publisher,
    confidence: source.confidence,
    retrievedAt: source.retrievedAt,
    publishedAt: source.publishedAt,
    dateStatus: source.dateStatus,
    linkedFactIds: source.linkedFactIds?.slice(0, 6),
  };
}

function compactFact(fact: ResearchEvidenceFact) {
  return {
    id: fact.id,
    factType: fact.factType,
    sourceKind: fact.sourceKind,
    label: fact.label,
    value:
      typeof fact.value === "string" ? truncate(fact.value, 350) : fact.value,
    unit: fact.unit,
    period: fact.period,
    filed: fact.filed,
    form: fact.form,
    concept: fact.concept,
    confidence: fact.confidence,
    allowedUse: fact.allowedUse,
  };
}

function selectFactsForPrompt(facts: ResearchEvidenceFact[]) {
  const officialFinancial = facts
    .filter((fact) => fact.factType === "official-financial")
    .slice(0, 12);
  const filingMetadata = facts
    .filter((fact) => fact.factType === "filing-metadata")
    .slice(0, 5);
  const recentOrRisk = facts
    .filter(
      (fact) =>
        fact.factType === "recent-development" ||
        fact.factType === "risk-catalyst",
    )
    .slice(0, 6);
  const irFacts = facts
    .filter(
      (fact) =>
        fact.factType === "management-commentary" ||
        fact.factType === "company-guidance-context" ||
        fact.factType === "business-update",
    )
    .slice(0, 8);
  const marketFacts = facts
    .filter(
      (fact) =>
        fact.factType === "market-price" ||
        fact.factType === "market-volume" ||
        fact.factType === "market-price-history" ||
        fact.factType === "market-valuation-context",
    )
    .slice(0, 5);
  const consensusFacts = facts
    .filter(
      (fact) =>
        fact.factType === "consensus-revenue" ||
        fact.factType === "consensus-eps" ||
        fact.factType === "consensus-range" ||
        fact.factType === "analyst-count",
    )
    .slice(0, 8);
  const remainingSlots =
    30 -
    officialFinancial.length -
    filingMetadata.length -
    recentOrRisk.length -
    irFacts.length -
    marketFacts.length -
    consensusFacts.length;
  const marketDiscussion = facts
    .filter((fact) => fact.factType === "market-discussion")
    .slice(0, Math.max(0, remainingSlots));

  return [
    ...officialFinancial,
    ...filingMetadata,
    ...recentOrRisk,
    ...irFacts,
    ...marketFacts,
    ...consensusFacts,
    ...marketDiscussion,
  ].slice(0, 30);
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}
