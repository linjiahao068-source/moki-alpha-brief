import type { BriefDataMode, BriefDocument } from "@/types/brief";

type DataBoundaryNoteProps = {
  brief: BriefDocument;
  compact?: boolean;
};

const labelByDataMode: Record<BriefDataMode, string> = {
  mock: "Mock Demo / No Live Data",
  "llm-demo-no-live-data": "LLM Demo / No Live Data",
  "evidence-draft": "Search Evidence Draft / Sources Attached",
  "verified-real-data": "Verified Real Data",
};

export function DataBoundaryNote({
  brief,
  compact = false,
}: DataBoundaryNoteProps) {
  const dataMode = brief.metadata.dataMode;
  const hasEvidencePack = Boolean(brief.evidencePack);
  const isVerified = dataMode === "verified-real-data";
  const isEvidenceDraft = dataMode === "evidence-draft";

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
            {labelByDataMode[dataMode]}
          </h2>
        </div>
        <span className="inline-flex w-fit max-w-full rounded-full border border-[var(--brand-border)] bg-white px-3 py-1 font-mono text-xs font-semibold leading-5 text-[var(--brand-ink)]">
          {hasEvidencePack ? "EvidencePack: yes" : "EvidencePack: none"}
        </span>
      </div>

      {isEvidenceDraft ? (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          当前接入的是搜索证据草稿，仅用于辅助近期内容判断；未接 SEC、实时股价、一致预期或数据库，不能标记为 verified-real-data。
        </p>
      ) : !isVerified ? (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          当前未接入实时数据源，数字和判断仅为演示结构。页面未连接真实
          SEC、公司 IR、实时股价、一致预期或新闻检索。
        </p>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)] opacity-80">
          当前页面标记为已验证真实数据，必须依赖 EvidencePack 中的来源、时间戳与置信度。
        </p>
      )}
    </aside>
  );
}
