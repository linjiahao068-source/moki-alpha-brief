import { getEvidenceStatusCopy } from "@/lib/evidence/evidenceStatusCopy";
import type { BriefDataMode, SourceNoteData } from "@/types/brief";
import type {
  ResearchEvidenceLevel,
  SearchProviderName,
  SecProviderName,
} from "@/types/evidence";

type SourceNoteProps = {
  sourceNote: SourceNoteData;
  dataMode: BriefDataMode;
  hasEvidencePack: boolean;
  hasSecEvidencePack?: boolean;
  evidenceLevel?: ResearchEvidenceLevel;
  searchProvider?: SearchProviderName;
  secProvider?: SecProviderName;
};

export function SourceNote({
  sourceNote,
  dataMode,
  evidenceLevel,
  hasEvidencePack,
  hasSecEvidencePack = false,
  searchProvider,
  secProvider,
}: SourceNoteProps) {
  const evidenceState = getEvidenceStatusCopy({
    evidenceLevel,
    hasSearchEvidence: hasEvidencePack,
    hasSecEvidence: hasSecEvidencePack,
    searchProvider,
    secProvider,
  });

  return (
    <section
      id={sourceNote.id}
      className="rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-4 sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)] opacity-60">
          {sourceNote.title}
        </p>
        <span className="inline-flex w-fit max-w-full rounded-full border border-[var(--border)] bg-white px-3 py-1 font-mono text-xs font-semibold leading-5 text-[var(--foreground)] opacity-75">
          {dataMode} / {evidenceState.label}
        </span>
      </div>
      <div className="mt-3 space-y-3 text-[15px] leading-7 text-[var(--foreground)] opacity-85">
        {sourceNote.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
