import { buildResearchEvidenceContext } from "@/lib/evidence/buildResearchEvidenceContext";
import type {
  ConsensusEvidencePack,
  EvidencePack,
  IrEvidencePack,
  MarketEvidencePack,
  ResearchEvidenceContext,
  ResearchEvidenceFact,
  ResearchEvidenceSource,
  SecEvidencePack,
} from "@/types/evidence";
import {
  BUY_SIDE_MEMO_V2_RESEARCH_CONTEXT_VERSION,
  BUY_SIDE_MEMO_V2_SECTION_LABELS,
} from "./buySideMemoSchema";
import type {
  BuySideMemoV2ResearchContext,
  BuySideMemoV2SectionKey,
  V2ConsensusContext,
  V2SourceDataRole,
  V2SourceKind,
  V2SourceStatus,
  V2SourceStatusMap,
  V2SourceStatusValue,
} from "./buySideMemoSchema";

export type BuildV2ResearchContextInput = {
  ticker?: string;
  companyName?: string | null;
  researchEvidenceContext?: ResearchEvidenceContext;
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
  marketEvidencePack?: MarketEvidencePack;
  consensusEvidencePack?: ConsensusEvidencePack;
};

type LegacySourceKind = ResearchEvidenceSource["sourceKind"];
type FactType = ResearchEvidenceFact["factType"];

type SourceStatusConfig = {
  label: string;
  dataRole: V2SourceDataRole;
  legacySourceKind: LegacySourceKind;
  caveat: string;
  missingPatterns: RegExp[];
};

const SOURCE_STATUS_CONFIG: Record<V2SourceKind, SourceStatusConfig> = {
  webSearch: {
    label: "Web Search",
    dataRole: "recentPublicContext",
    legacySourceKind: "search",
    caveat:
      "Web Search is recent public context only and remains evidence-draft.",
    missingPatterns: [/recent public web context/i, /news/i, /search/i],
  },
  sec: {
    label: "SEC",
    dataRole: "officialDisclosure",
    legacySourceKind: "sec",
    caveat:
      "SEC companyfacts and submissions are official disclosure inputs, but this adapter still marks the context as evidence-draft.",
    missingPatterns: [/sec/i, /filing/i, /fiscal/i, /revenue/i, /eps/i],
  },
  companyIr: {
    label: "Company IR",
    dataRole: "companyNarrative",
    legacySourceKind: "ir",
    caveat:
      "Company IR supports official narrative and management commentary only; it is not SEC financial data or consensus.",
    missingPatterns: [/ir/i, /company ir/i, /earnings-release/i, /narrative/i],
  },
  marketData: {
    label: "Market Data",
    dataRole: "marketContext",
    legacySourceKind: "market",
    caveat:
      "Market data is third-party free market context and may be delayed, incomplete, field-limited, or unavailable.",
    missingPatterns: [/market/i, /price/i, /volume/i],
  },
  consensus: {
    label: "Consensus",
    dataRole: "estimateContext",
    legacySourceKind: "consensus",
    caveat:
      "Consensus is limited to mock estimateContext or unavailable in this phase; it is not real Wall Street consensus.",
    missingPatterns: [/consensus/i, /estimate/i, /analyst/i],
  },
};

export function buildV2ResearchContext(
  input: BuildV2ResearchContextInput,
): BuySideMemoV2ResearchContext {
  const legacyContext = resolveLegacyContext(input);
  const sources = legacyContext?.sourceRegistry || [];
  const facts = legacyContext?.factLedger || [];
  const ticker = resolveTicker(input, legacyContext);

  return {
    schemaVersion: BUY_SIDE_MEMO_V2_RESEARCH_CONTEXT_VERSION,
    ticker,
    companyName:
      input.companyName?.trim() ||
      legacyContext?.companyName ||
      input.searchEvidencePack?.companyName ||
      input.secEvidencePack?.companyName ||
      input.irEvidencePack?.companyName ||
      input.marketEvidencePack?.companyName ||
      input.consensusEvidencePack?.companyName ||
      null,
    asOf: legacyContext?.asOf || null,
    dataMode: "evidence-draft",
    evidenceLevel: legacyContext?.evidenceLevel || "none",
    sourceStatus: buildV2SourceStatus(legacyContext),
    sources,
    facts,
    factsBySection: buildFactsBySection(facts),
    coverage: legacyContext?.coverage || null,
    warnings: Array.from(new Set(legacyContext?.warnings || [])),
    consensus: buildV2ConsensusContext(legacyContext?.consensusEvidencePack),
  };
}

export function buildV2SourceStatus(
  context?: ResearchEvidenceContext,
): V2SourceStatusMap {
  return {
    webSearch: buildStatusItem({
      context,
      source: "webSearch",
      provider: context?.searchEvidencePack?.searchProvider || null,
      hasEvidence: Boolean(context?.searchEvidencePack),
      asOf: context?.searchEvidencePack?.asOf || null,
      warnings: context?.searchEvidencePack?.warnings || [],
    }),
    sec: buildStatusItem({
      context,
      source: "sec",
      provider: context?.secEvidencePack?.provider || null,
      hasEvidence: Boolean(context?.secEvidencePack),
      asOf: context?.secEvidencePack?.asOf || null,
      warnings: context?.secEvidencePack?.warnings || [],
    }),
    companyIr: buildStatusItem({
      context,
      source: "companyIr",
      provider: context?.irEvidencePack?.provider || null,
      hasEvidence: Boolean(context?.irEvidencePack),
      asOf: context?.irEvidencePack?.asOf || null,
      warnings: context?.irEvidencePack?.warnings || [],
    }),
    marketData: buildStatusItem({
      context,
      source: "marketData",
      provider: context?.marketEvidencePack?.provider || null,
      hasEvidence: Boolean(context?.marketEvidencePack),
      asOf: context?.marketEvidencePack?.asOf || null,
      warnings: context?.marketEvidencePack?.warnings || [],
      isFallback: inferMarketFallback(context?.marketEvidencePack),
    }),
    consensus: buildStatusItem({
      context,
      source: "consensus",
      provider: context?.consensusEvidencePack?.provider || null,
      hasEvidence: Boolean(context?.consensusEvidencePack),
      asOf: context?.consensusEvidencePack?.asOf || null,
      warnings: context?.consensusEvidencePack?.warnings || [],
      isFallback: context?.consensusEvidencePack?.isFallback || null,
    }),
  };
}

function resolveLegacyContext(input: BuildV2ResearchContextInput) {
  if (input.researchEvidenceContext) return input.researchEvidenceContext;

  return buildResearchEvidenceContext({
    ticker: resolveTicker(input),
    companyName: input.companyName || undefined,
    searchEvidencePack: input.searchEvidencePack,
    secEvidencePack: input.secEvidencePack,
    irEvidencePack: input.irEvidencePack,
    marketEvidencePack: input.marketEvidencePack,
    consensusEvidencePack: input.consensusEvidencePack,
  });
}

function buildStatusItem({
  asOf,
  context,
  hasEvidence,
  isFallback = null,
  provider,
  source,
  warnings,
}: {
  asOf: string | null;
  context?: ResearchEvidenceContext;
  hasEvidence: boolean;
  isFallback?: boolean | null;
  provider: string | null;
  source: V2SourceKind;
  warnings: string[];
}): V2SourceStatus {
  const config = SOURCE_STATUS_CONFIG[source];
  const sourceCount = countSources(context?.sourceRegistry || [], config.legacySourceKind);
  const factCount = countFacts(context?.factLedger || [], config.legacySourceKind);
  const status = getStatus({
    factCount,
    hasEvidence,
    provider,
    source,
    sourceCount,
  });

  return {
    source,
    label: config.label,
    status,
    provider: provider || null,
    dataRole: config.dataRole,
    sourceCount,
    factCount,
    asOf,
    missing: getMissingForSource(context, source),
    warnings: Array.from(new Set(warnings)),
    caveat: config.caveat,
    isFallback,
  };
}

function getStatus({
  factCount,
  hasEvidence,
  provider,
  source,
  sourceCount,
}: {
  factCount: number;
  hasEvidence: boolean;
  provider: string | null;
  source: V2SourceKind;
  sourceCount: number;
}): V2SourceStatusValue {
  if (!hasEvidence) return "unavailable";
  if (source === "consensus") return provider === "mock" ? "mock" : "unavailable";
  if (provider === "mock") return "mock";
  if (sourceCount === 0 || factCount === 0) return "partial";
  return "available";
}

function buildFactsBySection(
  facts: ResearchEvidenceFact[],
): Record<BuySideMemoV2SectionKey, ResearchEvidenceFact[]> {
  return {
    investmentConclusion: factsOfTypes(facts, [
      "recent-development",
      "risk-catalyst",
      "market-discussion",
      "market-valuation-context",
      "consensus-revenue",
      "consensus-eps",
    ]),
    companyProfile: factsOfTypes(facts, [
      "filing-metadata",
      "official-financial",
      "management-commentary",
      "business-update",
    ]),
    fundamentalAnalysis: factsOfTypes(facts, [
      "official-financial",
      "management-commentary",
      "company-guidance-context",
      "consensus-revenue",
      "consensus-eps",
      "analyst-count",
    ]),
    valuationFramework: factsOfTypes(facts, [
      "market-price",
      "market-volume",
      "market-price-history",
      "market-valuation-context",
      "consensus-revenue",
      "consensus-eps",
      "consensus-range",
      "analyst-count",
    ]),
    catalystRisk: factsOfTypes(facts, [
      "recent-development",
      "risk-catalyst",
      "company-guidance-context",
      "business-update",
    ]),
    monitoringDashboard: factsOfTypes(facts, [
      "market-price",
      "market-volume",
      "market-price-history",
      "analyst-count",
      "recent-development",
      "risk-catalyst",
    ]),
    sourceFooter: facts,
  };
}

function buildV2ConsensusContext(
  consensusEvidencePack?: ConsensusEvidencePack,
): V2ConsensusContext {
  if (!consensusEvidencePack) {
    return {
      status: "unavailable",
      provider: null,
      role: "estimateContext",
      estimateCount: 0,
      asOf: null,
      warnings: [],
      caveat:
        "Consensus is unavailable. V2 must not imply real Wall Street consensus estimates are connected.",
    };
  }

  return {
    status: "mock",
    provider: "mock",
    role: "estimateContext",
    estimateCount: consensusEvidencePack.estimates.length,
    asOf: consensusEvidencePack.asOf || null,
    warnings: Array.from(new Set(consensusEvidencePack.warnings || [])),
    caveat:
      "Consensus is mock estimateContext only. It is not SEC actual data, market price data, verified-real-data, or investment advice.",
  };
}

function getMissingForSource(
  context: ResearchEvidenceContext | undefined,
  source: V2SourceKind,
) {
  const config = SOURCE_STATUS_CONFIG[source];
  const missing = context?.coverage.missing || [];

  return missing.filter((item) =>
    config.missingPatterns.some((pattern) => pattern.test(item)),
  );
}

function factsOfTypes(
  facts: ResearchEvidenceFact[],
  factTypes: FactType[],
) {
  return facts.filter((fact) => factTypes.includes(fact.factType));
}

function countSources(sources: ResearchEvidenceSource[], sourceKind: LegacySourceKind) {
  return sources.filter((source) => source.sourceKind === sourceKind).length;
}

function countFacts(facts: ResearchEvidenceFact[], sourceKind: LegacySourceKind) {
  return facts.filter((fact) => fact.sourceKind === sourceKind).length;
}

function inferMarketFallback(marketEvidencePack?: MarketEvidencePack) {
  if (!marketEvidencePack) return null;
  if (marketEvidencePack.provider !== "mock") return false;

  return Boolean(
    marketEvidencePack.attemptedProviders?.some((provider) => provider !== "mock"),
  );
}

function resolveTicker(
  input: BuildV2ResearchContextInput,
  context?: ResearchEvidenceContext,
) {
  return (
    input.ticker ||
    context?.ticker ||
    input.searchEvidencePack?.ticker ||
    input.secEvidencePack?.ticker ||
    input.irEvidencePack?.ticker ||
    input.marketEvidencePack?.ticker ||
    input.consensusEvidencePack?.ticker ||
    "UNKNOWN"
  )
    .trim()
    .toUpperCase();
}

export const V2_RESEARCH_CONTEXT_SECTION_LABELS =
  BUY_SIDE_MEMO_V2_SECTION_LABELS;
