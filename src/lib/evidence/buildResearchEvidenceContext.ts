import type {
  EvidencePack,
  IrEvidencePack,
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
}: {
  ticker: string;
  companyName?: string;
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
}): ResearchEvidenceContext | undefined {
  const hasSearchEvidence = Boolean(searchEvidencePack);
  const hasSecEvidence = Boolean(secEvidencePack);
  const hasIrEvidence = Boolean(irEvidencePack);

  if (!hasSearchEvidence && !hasSecEvidence && !hasIrEvidence) return undefined;

  const sourceRegistry = buildSourceRegistry({
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
  });
  const factLedger = buildFactLedger({
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
  });
  const linkedSources = linkFactsToSources(sourceRegistry, factLedger);
  const coverage = buildEvidenceCoverage({
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
    factLedger,
  });
  const warnings = [
    ...(searchEvidencePack?.warnings || []),
    ...(secEvidencePack?.warnings || []),
    ...(irEvidencePack?.warnings || []),
    ...coverage.warnings,
  ];

  return {
    asOf: latestTimestamp([
      searchEvidencePack?.asOf,
      secEvidencePack?.asOf,
      irEvidencePack?.asOf,
      formatCstTimestamp(),
    ]),
    ticker: ticker.trim().toUpperCase(),
    companyName:
      companyName?.trim() ||
      secEvidencePack?.companyName ||
      searchEvidencePack?.companyName ||
      irEvidencePack?.companyName,
    dataMode: "evidence-draft",
    evidenceLevel: getEvidenceLevel(
      hasSearchEvidence,
      hasSecEvidence,
      hasIrEvidence,
    ),
    searchEvidencePack,
    secEvidencePack,
    irEvidencePack,
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
): ResearchEvidenceLevel {
  if (hasSearchEvidence && hasSecEvidence && hasIrEvidence) {
    return "search-sec-and-ir";
  }
  if (hasSearchEvidence && hasSecEvidence) return "search-and-sec";
  if (hasSearchEvidence && hasIrEvidence) return "search-and-ir";
  if (hasSecEvidence && hasIrEvidence) return "sec-and-ir";
  if (hasSearchEvidence) return "search-only";
  if (hasSecEvidence) return "sec-only";
  if (hasIrEvidence) return "ir-only";
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
