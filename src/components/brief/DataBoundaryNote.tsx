import type { BriefDocument } from "@/types/brief";

type DataBoundaryNoteProps = {
  brief: BriefDocument;
  compact?: boolean;
};

export function DataBoundaryNote({
  brief,
  compact = false,
}: DataBoundaryNoteProps) {
  const usedSources = getUsedSources(brief);
  const hasEvidence = usedSources.length > 0;

  return (
    <aside
      className={`rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] ${
        compact ? "px-4 py-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
            Data Used in This Brief
          </p>
          <h2 className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
            {hasEvidence
              ? usedSources.join(" / ")
              : "No external sources selected"}
          </h2>
        </div>
        <span className="inline-flex w-fit max-w-full rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-xs font-semibold leading-5 text-[var(--brand-ink)]">
          {hasEvidence ? "Sources attached" : "Source-light brief"}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
        {hasEvidence
          ? "This brief uses the selected source context where available. Market data may be delayed depending on provider availability; consensus estimates are used only as estimate context."
          : "This brief was generated without external source context. Use it as research support only and verify important facts independently."}
      </p>
    </aside>
  );
}

function getUsedSources(brief: BriefDocument) {
  return [
    brief.evidencePack ? "Web Search" : "",
    brief.secEvidencePack ? "SEC Filings" : "",
    brief.irEvidencePack ? "Company IR" : "",
    brief.marketEvidencePack ? "Market Data" : "",
    brief.consensusEvidencePack ? "Consensus Estimates" : "",
  ].filter(Boolean);
}