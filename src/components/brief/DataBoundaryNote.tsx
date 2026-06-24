import { getEvidenceStatusCopy } from "@/lib/evidence/evidenceStatusCopy";
import type { BriefDataMode, BriefDocument } from "@/types/brief";

type DataBoundaryNoteProps = {
  brief: BriefDocument;
  compact?: boolean;
};

const labelByDataMode: Record<BriefDataMode, string> = {
  mock: "Mock Demo / No Live Data",
  "llm-demo-no-live-data": "LLM Demo / No Live Data",
  "evidence-draft": "Evidence Draft / Sources Attached",
  "verified-real-data": "Verification Mode Disabled",
};

export function DataBoundaryNote({
  brief,
  compact = false,
}: DataBoundaryNoteProps) {
  const dataMode = brief.metadata.dataMode;
  const hasEvidence = Boolean(
    brief.researchEvidenceContext ||
      brief.evidencePack ||
      brief.secEvidencePack ||
      brief.irEvidencePack ||
      brief.marketEvidencePack ||
      brief.consensusEvidencePack,
  );
  const isVerified = dataMode === "verified-real-data";
  const isEvidenceDraft = dataMode === "evidence-draft";
  const evidenceState = getEvidenceStatusCopy({
    evidenceLevel: brief.researchEvidenceContext?.evidenceLevel,
    hasSearchEvidence: Boolean(brief.evidencePack),
    hasSecEvidence: Boolean(brief.secEvidencePack),
    hasIrEvidence: Boolean(brief.irEvidencePack),
    hasMarketEvidence: Boolean(brief.marketEvidencePack),
    hasConsensusEvidence: Boolean(brief.consensusEvidencePack),
    searchProvider: brief.evidencePack?.searchProvider,
    secProvider: brief.secEvidencePack?.provider,
    irProvider: brief.irEvidencePack?.provider,
    marketProvider: brief.marketEvidencePack?.provider,
    consensusProvider: brief.consensusEvidencePack?.provider,
  });

  return (
    <aside
      className={`rounded-[8px] border border-[var(--brand-border)] bg-[var(--brand-soft)] ${
        compact ? "px-4 py-3" : "p-4 sm:p-5"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brand-ink)]">
            Data Boundary
          </p>
          <h2 className="mt-1 text-sm font-semibold leading-6 text-[var(--foreground)]">
            {isEvidenceDraft ? evidenceState.label : labelByDataMode[dataMode]}
          </h2>
        </div>
        <span className="inline-flex w-fit max-w-full rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-mono text-xs font-semibold leading-5 text-[var(--brand-ink)]">
          {hasEvidence ? "Evidence: attached" : "Evidence: none"}
        </span>
      </div>

      {isEvidenceDraft ? (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          {evidenceState.boundaryDescription}
        </p>
      ) : !isVerified ? (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          当前未接入实时数据源，数字和判断仅为演示结构。页面未连接搜索、SEC、公司 IR、实时股价、一致预期或数据库。
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          当前版本不支持验证级真实数据展示；必须先具备完整证据链、来源时间戳、置信度和人工校验。
        </p>
      )}
    </aside>
  );
}
