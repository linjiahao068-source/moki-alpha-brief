import type { ReactNode } from "react";
import type { SavedBriefRecord } from "@/types/savedBrief";

type SavedBriefMetaPanelProps = {
  savedBrief: SavedBriefRecord;
};

export function SavedBriefMetaPanel({ savedBrief }: SavedBriefMetaPanelProps) {
  const sourceItems = getSourceItems(savedBrief);

  return (
    <section className="rounded-[8px] border border-[var(--border)] bg-white p-4 shadow-[0_12px_40px_-32px_rgba(0,0,0,0.28)] sm:p-5">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
            Public Research Brief
          </p>
          <h2 className="mt-1 text-base font-semibold leading-6 text-[var(--foreground)]">
            {savedBrief.ticker} / {savedBrief.title}
          </h2>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2 text-xs font-semibold leading-5">
          <Pill tone="brand">Unlisted Share Page</Pill>
          {savedBrief.isFallback ? <Pill tone="risk">Fallback Result</Pill> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem label="Generated At" value={savedBrief.createdAt} mono />
        <MetaItem label="Updated At" value={savedBrief.updatedAt} mono />
        <MetaItem label="Ticker" value={savedBrief.ticker} mono />
        <MetaItem label="Company" value={savedBrief.companyName || "n/a"} />
        <MetaItem label="Model" value={savedBrief.modelName || "n/a"} mono />
      </div>

      {sourceItems.length ? (
        <div className="mt-4 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
            Data Used in This Brief
          </p>
          <div className="mt-3 grid gap-2 text-sm leading-6 sm:grid-cols-2 lg:grid-cols-5">
            {sourceItems.map((item) => (
              <MetaItem key={item.label} label={item.label} value={item.value} mono />
            ))}
          </div>
        </div>
      ) : null}

      {savedBrief.disclaimer ? (
        <p className="mt-4 rounded-[8px] border border-[var(--risk-border)] bg-[var(--risk-soft)] px-3 py-2 text-sm font-semibold leading-6 text-[var(--risk-ink)]">
          {savedBrief.disclaimer}
        </p>
      ) : null}
    </section>
  );
}

function MetaItem({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[var(--border)] bg-white px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-60">
        {label}
      </p>
      <p className={`mt-1 break-words text-sm font-semibold ${mono ? "font-mono" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "brand" | "neutral" | "risk";
}) {
  const className =
    tone === "brand"
      ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]"
      : tone === "risk"
        ? "border-[var(--risk-border)] bg-[var(--risk-soft)] text-[var(--risk-ink)]"
        : "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]";

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${className}`}
    >
      {children}
    </span>
  );
}

function getSourceItems(savedBrief: SavedBriefRecord) {
  const counts = getCountMap(savedBrief.sourceCounts);
  const brief = savedBrief.briefDocument;

  return [
    getSourceItem(
      "Web Search",
      counts.searchSources || counts.searchItems || brief.evidencePack?.sources?.length,
    ),
    getSourceItem(
      "SEC Filings",
      counts.secSources || brief.secEvidencePack?.sources?.length,
    ),
    getSourceItem(
      "Company IR",
      counts.irSources || counts.irItems || brief.irEvidencePack?.irItems?.length,
    ),
    getSourceItem(
      "Market Data",
      counts.marketSources || brief.marketEvidencePack?.sources?.length,
    ),
    getSourceItem(
      "Consensus Estimates",
      counts.consensusSources ||
        counts.consensusEstimates ||
        brief.consensusEvidencePack?.estimates?.length,
    ),
  ].filter((item): item is { label: string; value: string } => Boolean(item));
}

function getSourceItem(label: string, count?: number) {
  if (!count) return null;
  return {
    label,
    value: count === 1 ? "Used" : `${count} items`,
  };
}

function getCountMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => typeof item === "number")
      .map(([key, item]) => [key, item as number]),
  );
}