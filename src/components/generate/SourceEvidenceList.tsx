import type {
  EvidenceConfidence,
  EvidenceNewsItem,
  EvidencePack,
  EvidenceSource,
} from "@/types/evidence";
import type { ReactNode } from "react";

type SourceEvidenceListProps = {
  evidencePack?: EvidencePack;
  warnings?: string[];
};

type DisplayEvidenceItem = EvidenceNewsItem & {
  confidence?: EvidenceConfidence;
  domain?: string;
  qualityReason?: string;
  sourceRank?: number;
};

export function SourceEvidenceList({
  evidencePack,
  warnings = [],
}: SourceEvidenceListProps) {
  if (!evidencePack) return null;

  const sourceById = new Map(
    evidencePack.sources.map((source) => [source.id, source]),
  );
  const items: DisplayEvidenceItem[] = evidencePack.newsItems?.length
    ? evidencePack.newsItems.map((item) => mergeSourceMeta(item, sourceById))
    : evidencePack.sources.map(sourceToDisplayItem);
  const counts = countConfidence(items, evidencePack.sources);
  const isMock = evidencePack.searchProvider === "mock";
  const combinedWarnings = Array.from(
    new Set([...warnings, ...(evidencePack.warnings || [])].filter(Boolean)),
  );

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)] opacity-60">
            Source Evidence
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {isMock ? "Mock Search Evidence" : "Search Evidence Draft"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--foreground)] opacity-75">
            Search evidence is a draft research aid. It is not SEC data, real-time price data, consensus data, or verified real data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill tone="brand">{evidencePack.searchProvider || "mock"}</Pill>
          <Pill>{items.length} sources</Pill>
          <Pill>High {counts.high}</Pill>
          <Pill>Medium {counts.medium}</Pill>
          <Pill>Low {counts.low}</Pill>
        </div>
      </div>

      {combinedWarnings.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] px-4 py-3 text-sm leading-6 text-[var(--brand-ink)]">
          <p className="font-semibold">Evidence Warnings: {combinedWarnings.length}</p>
          <ul className="mt-2 space-y-1">
            {combinedWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {items.map((item, index) => {
          const confidence = item.confidence || "low";
          const domain = item.domain || getDomain(item.url) || "domain unknown";
          const dateLabel = item.publishedAt
            ? `Published: ${item.publishedAt}`
            : `Retrieved only: ${item.retrievedAt}`;

          return (
            <article
              key={item.id}
              className="rounded-[8px] border border-[var(--border)] bg-[var(--background)] p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="min-w-0 text-sm font-semibold leading-6 text-[var(--foreground)]">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-words underline decoration-[var(--brand-border)] underline-offset-4 hover:text-[var(--brand-ink)]"
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </h3>
                <span className="shrink-0 rounded-full border border-[var(--border)] bg-white px-3 py-1 font-mono text-xs text-[var(--foreground)] opacity-70">
                  #{item.sourceRank || index + 1}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold leading-5">
                <ConfidencePill confidence={confidence} />
                <Pill>{domain}</Pill>
                <Pill>{dateLabel}</Pill>
              </div>

              {confidence === "low" ? (
                <p className="mt-2 rounded-[8px] border border-[var(--border)] bg-white px-3 py-2 text-xs leading-5 text-[var(--foreground)] opacity-75">
                  Low confidence / discussion or aggregator source. Treat as a market-discussion clue, not a factual basis.
                </p>
              ) : null}

              <div className="mt-2 flex flex-wrap gap-2 text-xs leading-5 text-[var(--foreground)] opacity-70">
                <span>{item.publisher || domain}</span>
                <span className="font-mono">retrieved {item.retrievedAt}</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
                {item.snippet}
              </p>

              {item.qualityReason ? (
                <p className="mt-2 text-xs leading-5 text-[var(--foreground)] opacity-60">
                  {item.qualityReason}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function mergeSourceMeta(
  item: EvidenceNewsItem,
  sourceById: Map<string, EvidenceSource>,
): DisplayEvidenceItem {
  const source = item.sourceId ? sourceById.get(item.sourceId) : undefined;
  return {
    ...item,
    domain: item.domain || source?.domain,
    confidence: item.confidence || source?.confidence,
    dateStatus: item.dateStatus || source?.dateStatus,
    qualityReason: item.qualityReason || source?.qualityReason,
    sourceRank: item.sourceRank || source?.sourceRank,
  };
}

function sourceToDisplayItem(source: EvidenceSource): DisplayEvidenceItem {
  return {
    id: source.id,
    title: source.title,
    url: source.url,
    domain: source.domain,
    publisher: source.publisher,
    publishedAt: source.publishedAt,
    retrievedAt: source.retrievedAt,
    dateStatus: source.dateStatus,
    snippet: "Source metadata only; snippet unavailable.",
    relevance: source.confidence === "high" ? "high" : "medium",
    confidence: source.confidence,
    qualityReason: source.qualityReason,
    sourceRank: source.sourceRank,
  };
}

function countConfidence(
  items: DisplayEvidenceItem[],
  sources: EvidenceSource[],
) {
  const values = items.length ? items : sources;
  return values.reduce(
    (acc, item) => {
      const confidence = item.confidence || "low";
      acc[confidence] += 1;
      return acc;
    },
    { high: 0, medium: 0, low: 0 } as Record<EvidenceConfidence, number>,
  );
}

function ConfidencePill({ confidence }: { confidence: EvidenceConfidence }) {
  const label = `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)} confidence`;
  const className =
    confidence === "high"
      ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
      : confidence === "medium"
        ? "border-[var(--border)] bg-white text-[var(--foreground)]"
        : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";

  return (
    <span className={`rounded-full border px-3 py-1 ${className}`}>{label}</span>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "brand" | "neutral";
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 ${
        tone === "brand"
          ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
          : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)] opacity-75"
      }`}
    >
      {children}
    </span>
  );
}

function getDomain(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}
