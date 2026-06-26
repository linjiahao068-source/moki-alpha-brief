import type { BriefDataMode, SourceNoteData } from "@/types/brief";
import type {
  ResearchEvidenceLevel,
  SearchProviderName,
  SecProviderName,
  IrProviderName,
  MarketProviderName,
  ConsensusProviderName,
} from "@/types/evidence";

type SourceNoteProps = {
  sourceNote: SourceNoteData;
  dataMode: BriefDataMode;
  hasEvidencePack: boolean;
  hasSecEvidencePack?: boolean;
  hasIrEvidencePack?: boolean;
  hasMarketEvidencePack?: boolean;
  hasConsensusEvidencePack?: boolean;
  evidenceLevel?: ResearchEvidenceLevel;
  searchProvider?: SearchProviderName;
  secProvider?: SecProviderName;
  irProvider?: IrProviderName;
  marketProvider?: MarketProviderName;
  consensusProvider?: ConsensusProviderName;
};

export function SourceNote({
  sourceNote,
  hasEvidencePack,
  hasSecEvidencePack = false,
  hasIrEvidencePack = false,
  hasMarketEvidencePack = false,
  hasConsensusEvidencePack = false,
}: SourceNoteProps) {
  const sourceItems = [
    hasEvidencePack ? "Web Search" : "",
    hasSecEvidencePack ? "SEC Filings" : "",
    hasIrEvidencePack ? "Company IR" : "",
    hasMarketEvidencePack ? "Market Data" : "",
    hasConsensusEvidencePack ? "Consensus Estimates" : "",
  ].filter(Boolean);

  return (
    <section
      id={sourceNote.id}
      className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4 sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
          Sources & Method
        </p>
        <span className="inline-flex w-fit max-w-full rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold leading-5 text-[var(--foreground)] opacity-75">
          {sourceItems.length ? "Sources attached" : "No external sources selected"}
        </span>
      </div>

      {sourceItems.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {sourceItems.map((item) => (
            <span
              key={item}
              className="inline-flex max-w-full rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 text-xs font-semibold leading-5 text-[var(--brand-ink)]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-3 space-y-3 text-[15px] leading-7 text-[var(--foreground)] opacity-85">
        <p>
          This brief may use SEC filings, company IR or earnings-release
          materials, public web search results, market data where available, and
          consensus estimate context when selected.
        </p>
        <p>
          The analysis is AI-generated and should be treated as research support,
          not investment advice. Important facts, prices, and estimates should be
          independently verified before use.
        </p>
      </div>
    </section>
  );
}