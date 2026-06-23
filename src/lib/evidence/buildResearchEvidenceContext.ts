import type {
  EvidencePack,
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
}: {
  ticker: string;
  companyName?: string;
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
}): ResearchEvidenceContext | undefined {
  const hasSearchEvidence = Boolean(searchEvidencePack);
  const hasSecEvidence = Boolean(secEvidencePack);

  if (!hasSearchEvidence && !hasSecEvidence) return undefined;

  const sourceRegistry = buildSourceRegistry({
    searchEvidencePack,
    secEvidencePack,
  });
  const factLedger = buildFactLedger({ searchEvidencePack, secEvidencePack });
  const linkedSources = linkFactsToSources(sourceRegistry, factLedger);
  const coverage = buildEvidenceCoverage({
    searchEvidencePack,
    secEvidencePack,
    factLedger,
  });
  const warnings = [
    ...(searchEvidencePack?.warnings || []),
    ...(secEvidencePack?.warnings || []),
    ...coverage.warnings,
  ];

  return {
    asOf: latestTimestamp([
      searchEvidencePack?.asOf,
      secEvidencePack?.asOf,
      formatCstTimestamp(),
    ]),
    ticker: ticker.trim().toUpperCase(),
    companyName:
      companyName?.trim() ||
      secEvidencePack?.companyName ||
      searchEvidencePack?.companyName,
    dataMode: "evidence-draft",
    evidenceLevel: getEvidenceLevel(hasSearchEvidence, hasSecEvidence),
    searchEvidencePack,
    secEvidencePack,
    sourceRegistry: linkedSources,
    factLedger,
    coverage,
    warnings,
  };
}

function getEvidenceLevel(
  hasSearchEvidence: boolean,
  hasSecEvidence: boolean,
): ResearchEvidenceLevel {
  if (hasSearchEvidence && hasSecEvidence) return "search-and-sec";
  if (hasSearchEvidence) return "search-only";
  if (hasSecEvidence) return "sec-only";
  return "none";
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
