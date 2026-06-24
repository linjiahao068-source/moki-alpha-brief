import type {
  ConsensusEvidencePack,
  EvidencePack,
  EvidenceSourceType,
  IrEvidencePack,
  MarketEvidencePack,
  ResearchEvidenceSource,
  SecEvidencePack,
} from "@/types/evidence";

export function buildSourceRegistry({
  searchEvidencePack,
  secEvidencePack,
  irEvidencePack,
  marketEvidencePack,
  consensusEvidencePack,
}: {
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
  irEvidencePack?: IrEvidencePack;
  marketEvidencePack?: MarketEvidencePack;
  consensusEvidencePack?: ConsensusEvidencePack;
}): ResearchEvidenceSource[] {
  const searchSources =
    searchEvidencePack?.sources.map((source) => ({
      id: getSearchSourceId(source.id),
      sourceKind:
        searchEvidencePack.searchProvider === "mock"
          ? ("mock" as const)
          : ("search" as const),
      sourceType: normalizeSearchSourceType(source.sourceType),
      title: source.title,
      url: source.url,
      domain: source.domain,
      publisher: source.publisher,
      confidence: source.confidence,
      retrievedAt: source.retrievedAt,
      publishedAt: source.publishedAt,
      dateStatus: source.dateStatus,
      linkedFactIds: [],
    })) || [];

  const secSources =
    secEvidencePack?.sources.map((source) => ({
      id: getSecSourceId(source.id),
      sourceKind:
        secEvidencePack.provider === "mock" ? ("mock" as const) : ("sec" as const),
      sourceType: inferSecSourceType(source.id),
      title: source.title,
      url: source.url,
      domain: source.domain,
      publisher: source.publisher,
      confidence: source.confidence,
      retrievedAt: source.retrievedAt,
      publishedAt: source.publishedAt,
      dateStatus: source.dateStatus,
      linkedFactIds: [],
    })) || [];

  const irSources =
    irEvidencePack?.sources.map((source) => ({
      id: getIrSourceId(source.id),
      sourceKind: "ir" as const,
      sourceType: normalizeIrSourceType(source.sourceType),
      title: source.title,
      url: source.url,
      domain: source.domain,
      publisher: source.publisher,
      confidence: source.confidence,
      retrievedAt: source.retrievedAt,
      publishedAt: source.publishedAt,
      dateStatus: source.dateStatus,
      linkedFactIds: [],
    })) || [];

  const marketSources =
    marketEvidencePack?.sources.map((source) => ({
      id: getMarketSourceId(source.id),
      sourceKind:
        marketEvidencePack.provider === "mock"
          ? ("mock" as const)
          : ("market" as const),
      sourceType: "market-data" as const,
      title: source.title,
      url: source.url,
      domain: source.domain,
      publisher: source.publisher,
      confidence: source.confidence,
      retrievedAt: source.retrievedAt,
      publishedAt: source.publishedAt,
      dateStatus: source.dateStatus,
      linkedFactIds: [],
    })) || [];

  const consensusSources =
    consensusEvidencePack?.sources.map((source) => ({
      id: getConsensusSourceId(source.id),
      sourceKind: "consensus" as const,
      sourceType: "consensus" as const,
      title: source.title,
      url: source.url,
      domain: source.domain,
      publisher: source.publisher,
      confidence: source.confidence,
      retrievedAt: source.retrievedAt,
      publishedAt: source.publishedAt,
      dateStatus: source.dateStatus,
      linkedFactIds: [],
    })) || [];

  return [
    ...searchSources,
    ...secSources,
    ...irSources,
    ...marketSources,
    ...consensusSources,
  ];
}

export function getSearchSourceId(sourceId?: string) {
  return `search-${sourceId || "unknown"}`;
}

export function getSecSourceId(sourceId?: string) {
  return `sec-${sourceId || "unknown"}`;
}

export function getIrSourceId(sourceId?: string) {
  return `ir-${sourceId || "unknown"}`;
}

export function getMarketSourceId(sourceId?: string) {
  return `market-${sourceId || "unknown"}`;
}

export function getConsensusSourceId(sourceId?: string) {
  return `consensus-${sourceId || "unknown"}`;
}

function normalizeSearchSourceType(sourceType: EvidenceSourceType) {
  if (
    sourceType === "news" ||
    sourceType === "company-ir" ||
    sourceType === "web" ||
    sourceType === "market-commentary" ||
    sourceType === "manual"
  ) {
    return sourceType;
  }

  return "web";
}

function normalizeIrSourceType(sourceType: EvidenceSourceType) {
  if (
    sourceType === "company-ir" ||
    sourceType === "earnings-release" ||
    sourceType === "press-release" ||
    sourceType === "investor-presentation" ||
    sourceType === "shareholder-letter" ||
    sourceType === "quarterly-results" ||
    sourceType === "official-web" ||
    sourceType === "wire-release" ||
    sourceType === "other"
  ) {
    return sourceType;
  }

  return "company-ir";
}

function inferSecSourceType(sourceId: string) {
  if (sourceId.includes("companyfacts")) return "sec-companyfacts" as const;
  if (sourceId.includes("submissions")) return "sec-submission" as const;
  return "sec-submission" as const;
}
