import type {
  ConsensusEvidencePack,
  EvidencePack,
  IrEvidencePack,
  MarketEvidencePack,
  ResearchEvidenceContext,
  ResearchEvidenceFact,
  ResearchEvidenceLevel,
  ResearchEvidenceSource,
  SecEvidencePack,
} from "@/types/evidence";
import { buildEvidenceCoverage } from "./evidenceCoverage";
import { buildFactLedger } from "./factLedger";
import { buildSourceRegistry } from "./sourceRegistry";

export function buildResearchEvidenceContext({
  ticker,
  companyName,
  searchEvidencePack,
  secEvidencePack,
  irEvidencePack,
  marketEvidencePack,
  consensusEvidencePack,
}: {
  ticker: string;
  companyName?: string;
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
  marketEvidencePack?: MarketEvidencePack;
  consensusEvidencePack?: ConsensusEvidencePack;
}): ResearchEvidenceContext | undefined {
  const hasSearchEvidence = Boolean(searchEvidencePack);
  const hasSecEvidence = Boolean(secEvidencePack);
  const hasIrEvidence = Boolean(irEvidencePack);
  const hasMarketEvidence = Boolean(marketEvidencePack);
  const hasConsensusEvidence = Boolean(consensusEvidencePack);

  if (
    !hasSearchEvidence &&
    !hasSecEvidence &&
    !hasIrEvidence &&
    !hasMarketEvidence &&
    !hasConsensusEvidence
  ) return undefined;

  const sourceRegistry = buildSourceRegistry({
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
    marketEvidencePack,
    consensusEvidencePack,
  });
  const factLedger = buildFactLedger({
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
    marketEvidencePack,
    consensusEvidencePack,
  });
  const linkedSources = linkFactsToSources(sourceRegistry, factLedger);
  const coverage = buildEvidenceCoverage({
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
    marketEvidencePack,
    consensusEvidencePack,
    factLedger,
  });
  const warnings = [
    ...(searchEvidencePack?.warnings || []),
    ...(secEvidencePack?.warnings || []),
    ...(irEvidencePack?.warnings || []),
    ...(marketEvidencePack?.warnings || []),
    ...(consensusEvidencePack?.warnings || []),
    ...coverage.warnings,
  ];

  return {
    asOf: latestTimestamp([
      searchEvidencePack?.asOf,
      secEvidencePack?.asOf,
      irEvidencePack?.asOf,
      marketEvidencePack?.asOf,
      consensusEvidencePack?.asOf,
      formatCstTimestamp(),
    ]),
    ticker: ticker.trim().toUpperCase(),
    companyName:
      companyName?.trim() ||
      secEvidencePack?.companyName ||
      searchEvidencePack?.companyName ||
      irEvidencePack?.companyName ||
      marketEvidencePack?.companyName ||
      consensusEvidencePack?.companyName,
    dataMode: "evidence-draft",
    evidenceLevel: getEvidenceLevel(
      hasSearchEvidence,
      hasSecEvidence,
      hasIrEvidence,
      hasMarketEvidence,
      hasConsensusEvidence,
    ),
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
    marketEvidencePack,
    consensusEvidencePack,
    sourceRegistry: linkedSources,
    factLedger,
    coverage,
    warnings,
  };
}

function getEvidenceLevel(
  hasSearchEvidence: boolean,
  hasSecEvidence: boolean,
  hasIrEvidence: boolean,
  hasMarketEvidence: boolean,
  hasConsensusEvidence: boolean,
): ResearchEvidenceLevel {
  const parts = [
    hasSearchEvidence ? "search" : "",
    hasSecEvidence ? "sec" : "",
    hasIrEvidence ? "ir" : "",
    hasMarketEvidence ? "market" : "",
    hasConsensusEvidence ? "consensus" : "",
  ].filter(Boolean);

  if (!parts.length) return "none";
  if (parts.length === 1) return `${parts[0]}-only` as ResearchEvidenceLevel;
  if (parts.length === 2) {
    return `${parts[0]}-and-${parts[1]}` as ResearchEvidenceLevel;
  }

  return `${parts.slice(0, -1).join("-")}-and-${
    parts[parts.length - 1]
  }` as ResearchEvidenceLevel;
}

function linkFactsToSources(
  sources: ResearchEvidenceSource[],
  facts: ResearchEvidenceFact[],
) {
  return sources.map((source) => ({
    ...source,
    linkedFactIds: facts
      .filter((fact) => fact.sourceId === source.id)
      .map((fact) => fact.id),
  }));
}

function latestTimestamp(values: Array<string | undefined>) {
  return values.find(Boolean) || formatCstTimestamp();
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
