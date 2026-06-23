import type {
  EvidencePack,
  EvidenceSourceType,
  ResearchEvidenceSource,
  SecEvidencePack,
} from "@/types/evidence";

export function buildSourceRegistry({
  searchEvidencePack,
  secEvidencePack,
}: {
  searchEvidencePack?: EvidencePack;
  secEvidencePack?: SecEvidencePack;
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

  return [...searchSources, ...secSources];
}

export function getSearchSourceId(sourceId?: string) {
  return `search-${sourceId || "unknown"}`;
}

export function getSecSourceId(sourceId?: string) {
  return `sec-${sourceId || "unknown"}`;
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

function inferSecSourceType(sourceId: string) {
  if (sourceId.includes("companyfacts")) return "sec-companyfacts" as const;
  if (sourceId.includes("submissions")) return "sec-submission" as const;
  return "sec-submission" as const;
}
